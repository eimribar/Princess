-- ============================================================================
-- RUN THESE MIGRATIONS FOR CLERK INTEGRATION
-- ============================================================================
-- Run these two migrations in order to set up Clerk authentication properly
-- ============================================================================

-- MIGRATION 1: Fix Clerk Integration
-- ============================================================================
-- Remove Supabase Auth dependencies and add Clerk columns
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS needs_onboarding BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invited_by UUID;

UPDATE users 
SET needs_onboarding = false,
    onboarding_completed = true
WHERE email IN ('eimri@webloom.ai', 'eimribar@gmail.com');

COMMENT ON COLUMN users.clerk_user_id IS 'Clerk user ID for authentication integration';
COMMENT ON COLUMN users.id IS 'Internal UUID - no longer references auth.users';

-- MIGRATION 2: Create Invitation Tracking Table  
-- ============================================================================
-- Track Clerk invitations for business logic
CREATE TABLE IF NOT EXISTS invitation_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_invitation_id TEXT UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'client',
  is_decision_maker BOOLEAN DEFAULT false,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  invited_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitation_tracking_email ON invitation_tracking(email);
CREATE INDEX IF NOT EXISTS idx_invitation_tracking_project ON invitation_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tracking_clerk_id ON invitation_tracking(clerk_invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tracking_status ON invitation_tracking(status);

CREATE OR REPLACE FUNCTION update_invitation_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invitation_tracking_updated_at ON invitation_tracking;
CREATE TRIGGER invitation_tracking_updated_at
BEFORE UPDATE ON invitation_tracking
FOR EACH ROW
EXECUTE FUNCTION update_invitation_tracking_updated_at();

COMMENT ON TABLE invitation_tracking IS 'Tracks Clerk invitations for business logic around roles and decision makers';
COMMENT ON COLUMN invitation_tracking.clerk_invitation_id IS 'The invitation ID from Clerk';
COMMENT ON COLUMN invitation_tracking.is_decision_maker IS 'Whether this invitation is for a decision maker role (max 2 per project)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after the migrations to verify everything is set up correctly:

-- Check if users table has Clerk columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('clerk_user_id', 'onboarding_completed', 'needs_onboarding');

-- Check if invitation_tracking table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'invitation_tracking'
);

-- Verify no foreign key constraint to auth.users
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
AND constraint_name = 'users_id_fkey';