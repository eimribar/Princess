-- Migration: Add Invitation System
-- Version: 001
-- Date: December 2024
-- Description: Implements invitation-based authentication system

-- ========================================
-- PART 1: CREATE INVITATIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    project_id UUID REFERENCES projects(id), -- Optional, for client invitations
    invited_by UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    metadata JSONB DEFAULT '{}', -- For additional data like team assignment
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_organization ON invitations(organization_id);

-- ========================================
-- PART 2: UPDATE USERS TABLE
-- ========================================

-- Add invitation tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;

-- ========================================
-- PART 3: ROW LEVEL SECURITY FOR INVITATIONS
-- ========================================

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins and agency members can view invitations in their organization
CREATE POLICY "View invitations in organization" ON invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = invitations.organization_id
            AND users.role IN ('admin', 'agency')
        )
    );

-- Admins can create invitations for agency members
CREATE POLICY "Admins can invite agency members" ON invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = invitations.organization_id
            AND users.role = 'admin'
            AND invitations.role IN ('agency', 'viewer')
        )
    );

-- Agency members can invite clients to their projects
CREATE POLICY "Agency can invite clients" ON invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = invitations.organization_id
            AND users.role IN ('admin', 'agency')
            AND invitations.role = 'client'
            AND invitations.project_id IS NOT NULL
        )
    );

-- Users can update invitation status
CREATE POLICY "Update invitation status" ON invitations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = invitations.organization_id
            AND users.role IN ('admin', 'agency')
        )
    );

-- ========================================
-- PART 4: FUNCTIONS FOR INVITATION MANAGEMENT
-- ========================================

-- Function to generate unique invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR AS $$
DECLARE
    token VARCHAR;
BEGIN
    LOOP
        -- Generate a random token (URL-safe base64)
        token := encode(gen_random_bytes(32), 'base64');
        token := replace(token, '+', '-');
        token := replace(token, '/', '_');
        token := replace(token, '=', '');
        
        -- Check if token already exists
        EXIT WHEN NOT EXISTS (SELECT 1 FROM invitations WHERE invitations.token = token);
    END LOOP;
    
    RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an invitation
CREATE OR REPLACE FUNCTION create_invitation(
    p_email VARCHAR,
    p_role user_role,
    p_organization_id UUID,
    p_project_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS invitations AS $$
DECLARE
    v_invitation invitations;
    v_token VARCHAR;
BEGIN
    -- Check if user has permission to invite
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = p_organization_id
        AND (
            (role = 'admin' AND p_role IN ('agency', 'viewer')) OR
            (role IN ('admin', 'agency') AND p_role = 'client' AND p_project_id IS NOT NULL)
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to create invitation';
    END IF;
    
    -- Check if invitation already exists for this email and is pending
    IF EXISTS (
        SELECT 1 FROM invitations 
        WHERE email = p_email 
        AND organization_id = p_organization_id
        AND status = 'pending'
        AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'Pending invitation already exists for this email';
    END IF;
    
    -- Generate unique token
    v_token := generate_invitation_token();
    
    -- Create invitation
    INSERT INTO invitations (
        token,
        email,
        role,
        organization_id,
        project_id,
        invited_by,
        metadata,
        expires_at
    ) VALUES (
        v_token,
        p_email,
        p_role,
        p_organization_id,
        p_project_id,
        auth.uid(),
        p_metadata,
        NOW() + INTERVAL '7 days'
    ) RETURNING * INTO v_invitation;
    
    RETURN v_invitation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_invitation invitations;
BEGIN
    -- Get invitation
    SELECT * INTO v_invitation
    FROM invitations
    WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF v_invitation.id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;
    
    -- Update invitation status
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invitation.id;
    
    -- Update user record with invitation info
    UPDATE users
    SET invited_by = v_invitation.invited_by,
        invitation_token = v_invitation.token,
        joined_at = NOW(),
        updated_at = NOW()
    WHERE id = auth.uid();
    
    -- If it's a client invitation, add them to the project team
    IF v_invitation.role = 'client' AND v_invitation.project_id IS NOT NULL THEN
        INSERT INTO team_members (
            project_id,
            user_id,
            name,
            email,
            role,
            team_type
        ) VALUES (
            v_invitation.project_id,
            auth.uid(),
            (SELECT full_name FROM users WHERE id = auth.uid()),
            v_invitation.email,
            'Client',
            'client'
        ) ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired invitations (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    UPDATE invitations
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
    AND expires_at < NOW();
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PART 5: TRIGGERS
-- ========================================

-- Add updated_at trigger for invitations
CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PART 6: INITIAL ADMIN SETUP
-- ========================================

-- Function to create initial admin user (call this once during setup)
CREATE OR REPLACE FUNCTION create_initial_admin(
    p_email VARCHAR,
    p_full_name VARCHAR,
    p_organization_name VARCHAR DEFAULT 'Deutsch & Co.'
)
RETURNS users AS $$
DECLARE
    v_org_id UUID;
    v_user users;
BEGIN
    -- Check if any admin already exists
    IF EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
        RAISE EXCEPTION 'Admin user already exists';
    END IF;
    
    -- Get or create organization
    SELECT id INTO v_org_id FROM organizations WHERE name = p_organization_name;
    
    IF v_org_id IS NULL THEN
        INSERT INTO organizations (name, subdomain)
        VALUES (p_organization_name, lower(replace(p_organization_name, ' ', '-')))
        RETURNING id INTO v_org_id;
    END IF;
    
    -- Create admin user
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        organization_id,
        is_active
    ) VALUES (
        auth.uid(), -- Must be called by authenticated user
        p_email,
        p_full_name,
        'admin',
        v_org_id,
        true
    ) RETURNING * INTO v_user;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PART 7: GRANT PERMISSIONS
-- ========================================

GRANT ALL ON invitations TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_token() TO authenticated;
GRANT EXECUTE ON FUNCTION create_invitation(VARCHAR, user_role, UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION create_initial_admin(VARCHAR, VARCHAR, VARCHAR) TO authenticated;