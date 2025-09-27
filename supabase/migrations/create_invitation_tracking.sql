-- ============================================================================
-- CLERK INVITATION TRACKING TABLE
-- ============================================================================
-- This table tracks invitations created through Clerk to maintain our business
-- logic around decision makers and project assignments
-- ============================================================================

-- Create invitation tracking table
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

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_invitation_tracking_email ON invitation_tracking(email);
CREATE INDEX IF NOT EXISTS idx_invitation_tracking_project ON invitation_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tracking_clerk_id ON invitation_tracking(clerk_invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tracking_status ON invitation_tracking(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invitation_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitation_tracking_updated_at
BEFORE UPDATE ON invitation_tracking
FOR EACH ROW
EXECUTE FUNCTION update_invitation_tracking_updated_at();

-- Add comment to document the table
COMMENT ON TABLE invitation_tracking IS 'Tracks Clerk invitations for business logic around roles and decision makers';
COMMENT ON COLUMN invitation_tracking.clerk_invitation_id IS 'The invitation ID from Clerk';
COMMENT ON COLUMN invitation_tracking.is_decision_maker IS 'Whether this invitation is for a decision maker role (max 2 per project)';

-- ============================================================================
-- IMPORTANT: Run this migration after setting up Clerk integration
-- ============================================================================