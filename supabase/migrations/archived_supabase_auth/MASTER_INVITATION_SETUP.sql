-- ============================================================
-- MASTER INVITATION SYSTEM SETUP FOR PRINCESS
-- ============================================================
-- Run this entire script in Supabase SQL Editor
-- It will check what exists and create/fix what's missing
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STEP 1: CHECK AND CREATE ORGANIZATIONS TABLE
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'organizations') THEN
        CREATE TABLE organizations (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(255),
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created organizations table';
    ELSE
        RAISE NOTICE 'Organizations table already exists';
    END IF;
END $$;

-- Add domain column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'domain') THEN
        ALTER TABLE organizations ADD COLUMN domain VARCHAR(255);
        RAISE NOTICE 'Added domain column to organizations';
    END IF;
END $$;

-- Insert a default organization if none exists
INSERT INTO organizations (id, name)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Default Organization'
WHERE NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- ============================================================
-- STEP 2: CHECK AND CREATE/UPDATE USERS TABLE
-- ============================================================
DO $$
BEGIN
    -- Create users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY,
            organization_id UUID REFERENCES organizations(id),
            email VARCHAR(255) NOT NULL UNIQUE,
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'viewer',
            avatar_url TEXT,
            phone VARCHAR(20),
            notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "level": "all"}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created users table';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
    
    -- Add missing columns if they don't exist
    -- Invitation tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'invitation_token') THEN
        ALTER TABLE users ADD COLUMN invitation_token VARCHAR(255);
        RAISE NOTICE 'Added invitation_token column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'invited_by') THEN
        ALTER TABLE users ADD COLUMN invited_by UUID;
        RAISE NOTICE 'Added invited_by column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'invited_at') THEN
        ALTER TABLE users ADD COLUMN invited_at TIMESTAMPTZ;
        RAISE NOTICE 'Added invited_at column to users';
    END IF;
    
    -- Onboarding columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_image') THEN
        ALTER TABLE users ADD COLUMN profile_image TEXT;
        RAISE NOTICE 'Added profile_image column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'title') THEN
        ALTER TABLE users ADD COLUMN title VARCHAR(255);
        RAISE NOTICE 'Added title column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'department') THEN
        ALTER TABLE users ADD COLUMN department VARCHAR(255);
        RAISE NOTICE 'Added department column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'needs_onboarding') THEN
        ALTER TABLE users ADD COLUMN needs_onboarding BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added needs_onboarding column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added onboarding_completed column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'onboarding_completed_at') THEN
        ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added onboarding_completed_at column to users';
    END IF;
END $$;

-- ============================================================
-- STEP 3: CHECK AND CREATE INVITATIONS TABLE
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'invitations') THEN
        CREATE TABLE invitations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'viewer',
            organization_id UUID REFERENCES organizations(id),
            invited_by UUID,  -- Not referencing users to avoid circular dependency
            token VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
            expires_at TIMESTAMPTZ NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_invitations_token ON invitations(token);
        CREATE INDEX idx_invitations_email ON invitations(email);
        CREATE INDEX idx_invitations_status ON invitations(status);
        
        RAISE NOTICE 'Created invitations table with indexes';
    ELSE
        RAISE NOTICE 'Invitations table already exists';
    END IF;
END $$;

-- ============================================================
-- STEP 4: CREATE OR REPLACE INVITATION MANAGEMENT FUNCTIONS
-- ============================================================

-- Function to create or update an invitation
CREATE OR REPLACE FUNCTION create_or_update_invitation(
  p_email VARCHAR,
  p_role VARCHAR,
  p_organization_id UUID,
  p_invited_by UUID,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  role VARCHAR,
  token VARCHAR,
  status VARCHAR,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_token VARCHAR;
  v_existing_id UUID;
  v_invitation_id UUID;
BEGIN
  -- Generate a unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Check if a pending invitation already exists
  SELECT invitations.id INTO v_existing_id
  FROM invitations 
  WHERE invitations.email = p_email 
  AND invitations.status = 'pending'
  AND invitations.organization_id = p_organization_id
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing invitation with new token and expiry
    UPDATE invitations
    SET 
      token = v_token,
      role = p_role,
      invited_by = p_invited_by,
      metadata = p_metadata,
      expires_at = NOW() + INTERVAL '7 days',
      updated_at = NOW()
    WHERE invitations.id = v_existing_id
    RETURNING invitations.id INTO v_invitation_id;
    
    RAISE NOTICE 'Updated existing invitation for %', p_email;
  ELSE
    -- Create new invitation
    INSERT INTO invitations (
      email, role, organization_id, invited_by, 
      token, status, expires_at, metadata
    ) VALUES (
      p_email, p_role, p_organization_id, p_invited_by,
      v_token, 'pending', NOW() + INTERVAL '7 days', p_metadata
    )
    RETURNING invitations.id INTO v_invitation_id;
    
    RAISE NOTICE 'Created new invitation for %', p_email;
  END IF;
  
  -- Return the invitation details
  RETURN QUERY
  SELECT 
    invitations.id,
    invitations.email,
    invitations.role,
    invitations.token,
    invitations.status,
    invitations.expires_at
  FROM invitations
  WHERE invitations.id = v_invitation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RAISE NOTICE 'No valid invitation found for token: %', p_token;
    RETURN FALSE;
  END IF;
  
  -- Update invitation status
  UPDATE invitations
  SET status = 'accepted',
      updated_at = NOW()
  WHERE token = p_token;
  
  RAISE NOTICE 'Invitation accepted for email: %', v_invitation.email;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 5: DIAGNOSTIC QUERIES
-- ============================================================

-- Check current state of tables
SELECT '=== DIAGNOSTIC INFORMATION ===' as info;

-- Check organizations
SELECT 'Organizations Table:' as info;
SELECT COUNT(*) as organization_count FROM organizations;
SELECT * FROM organizations LIMIT 3;

-- Check users table structure
SELECT 'Users Table Columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check invitations table structure  
SELECT 'Invitations Table Columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- Check current invitations
SELECT 'Current Invitations:' as info;
SELECT id, email, role, status, 
       CASE 
         WHEN expires_at < NOW() THEN 'EXPIRED'
         ELSE 'VALID'
       END as validity,
       created_at
FROM invitations
ORDER BY created_at DESC
LIMIT 10;

-- Check for any users created through invitations
SELECT 'Users Created via Invitations:' as info;
SELECT id, email, full_name, role, needs_onboarding, onboarding_completed, created_at
FROM users
WHERE invitation_token IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- STEP 6: TEST THE INVITATION SYSTEM
-- ============================================================

-- Create a test invitation (uncomment to test)
/*
SELECT * FROM create_or_update_invitation(
  'test@example.com',
  'client',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  NULL,
  '{"test": true}'::jsonb
);
*/

-- ============================================================
-- STEP 7: CHECK AUTH SCHEMA
-- ============================================================

-- Check if auth.users exists and show sample structure
SELECT 'Auth Users Table:' as info;
SELECT COUNT(*) as auth_user_count FROM auth.users;

SELECT 'Sample Auth User Structure:' as info;
SELECT id, email, email_confirmed_at, 
       raw_user_meta_data->>'full_name' as full_name,
       raw_user_meta_data->>'role' as role,
       created_at
FROM auth.users
LIMIT 3;

-- ============================================================
-- STEP 8: CLEANUP EXPIRED INVITATIONS
-- ============================================================

-- Mark expired invitations
UPDATE invitations
SET status = 'expired'
WHERE status = 'pending' 
  AND expires_at < NOW();

-- Report cleanup
SELECT 'Expired Invitations Cleaned:' as info, COUNT(*) 
FROM invitations 
WHERE status = 'expired';

-- ============================================================
-- FINAL SUMMARY
-- ============================================================

SELECT '=== SETUP COMPLETE ===' as info;
SELECT 'Tables Ready:' as status,
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') as organizations_exists,
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') as users_exists,
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') as invitations_exists;

-- Show counts
SELECT 'Data Summary:' as info;
SELECT 
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM invitations) as total_invitations,
  (SELECT COUNT(*) FROM invitations WHERE status = 'pending') as pending_invitations,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users;