-- Create Invitations Table and Functions
-- This migration creates the missing invitations system

-- ========================================
-- PART 1: CREATE INVITATIONS TABLE
-- ========================================

-- Create enum for invitation status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    project_id UUID REFERENCES projects(id),
    status invitation_status DEFAULT 'pending',
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);

-- ========================================
-- PART 2: CREATE INVITATION FUNCTIONS
-- ========================================

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR AS $$
DECLARE
    v_token VARCHAR;
BEGIN
    -- Generate a random token
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Ensure it's unique
    WHILE EXISTS (SELECT 1 FROM invitations WHERE token = v_token) LOOP
        v_token := encode(gen_random_bytes(32), 'hex');
    END LOOP;
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

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
    v_inviter_id UUID;
BEGIN
    -- Get the current user ID (inviter)
    v_inviter_id := auth.uid();
    
    -- Check if invitation already exists for this email and is pending
    IF EXISTS (
        SELECT 1 FROM invitations 
        WHERE email = p_email 
        AND status = 'pending'
        AND expires_at > NOW()
        AND organization_id = p_organization_id
    ) THEN
        RAISE EXCEPTION 'Pending invitation already exists for this email';
    END IF;
    
    -- Generate unique token
    v_token := generate_invitation_token();
    
    -- Create the invitation
    INSERT INTO invitations (
        email,
        role,
        organization_id,
        project_id,
        token,
        invited_by,
        metadata,
        status,
        expires_at
    ) VALUES (
        p_email,
        p_role,
        p_organization_id,
        p_project_id,
        v_token,
        v_inviter_id,
        p_metadata,
        'pending',
        NOW() + INTERVAL '7 days'
    ) RETURNING * INTO v_invitation;
    
    RETURN v_invitation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_token VARCHAR)
RETURNS invitations AS $$
DECLARE
    v_invitation invitations;
    v_user_id UUID;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Find and validate invitation
    SELECT * INTO v_invitation
    FROM invitations
    WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;
    
    -- Update invitation status
    UPDATE invitations
    SET 
        status = 'accepted',
        accepted_at = NOW()
    WHERE id = v_invitation.id;
    
    -- Create or update user record
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        organization_id
    ) VALUES (
        v_user_id,
        v_invitation.email,
        v_invitation.metadata->>'full_name',
        v_invitation.role,
        v_invitation.organization_id
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id;
    
    -- If project_id is provided, add to team_members
    IF v_invitation.project_id IS NOT NULL THEN
        INSERT INTO team_members (
            project_id,
            user_id,
            name,
            email,
            role,
            team_type,
            is_decision_maker
        ) VALUES (
            v_invitation.project_id,
            v_user_id,
            COALESCE(v_invitation.metadata->>'full_name', v_invitation.email),
            v_invitation.email,
            v_invitation.role::VARCHAR,
            CASE WHEN v_invitation.role IN ('admin', 'agency') THEN 'agency'::team_type ELSE 'client'::team_type END,
            COALESCE((v_invitation.metadata->>'is_decision_maker')::BOOLEAN, FALSE)
        )
        ON CONFLICT (project_id, email) DO NOTHING;
    END IF;
    
    SELECT * INTO v_invitation FROM invitations WHERE id = v_invitation.id;
    RETURN v_invitation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PART 3: ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations in their organization
CREATE POLICY "Users can view organization invitations"
    ON invitations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Admin and agency can create invitations
CREATE POLICY "Admin and agency can create invitations"
    ON invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency')
        )
    );

-- Policy: Admin can manage all invitations in their org
CREATE POLICY "Admin can manage organization invitations"
    ON invitations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND organization_id = invitations.organization_id
        )
    );

-- Policy: Anyone with a valid token can accept an invitation
CREATE POLICY "Accept invitation with token"
    ON invitations FOR UPDATE
    USING (status = 'pending' AND expires_at > NOW())
    WITH CHECK (status = 'accepted');

-- ========================================
-- PART 4: GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_token TO authenticated;

-- Grant necessary permissions on the table
GRANT SELECT, INSERT, UPDATE ON invitations TO authenticated;
GRANT USAGE ON SEQUENCE invitations_id_seq TO authenticated;

-- ========================================
-- PART 5: CLEANUP EXPIRED INVITATIONS
-- ========================================

-- Function to clean up expired invitations (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM invitations
    WHERE status = 'pending'
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PART 6: HELPFUL VIEWS
-- ========================================

-- View for active invitations
CREATE OR REPLACE VIEW active_invitations AS
SELECT 
    i.*,
    u.full_name as inviter_name,
    o.name as organization_name,
    p.name as project_name
FROM invitations i
LEFT JOIN users u ON i.invited_by = u.id
LEFT JOIN organizations o ON i.organization_id = o.id
LEFT JOIN projects p ON i.project_id = p.id
WHERE i.status = 'pending'
AND i.expires_at > NOW();

-- Grant access to the view
GRANT SELECT ON active_invitations TO authenticated;