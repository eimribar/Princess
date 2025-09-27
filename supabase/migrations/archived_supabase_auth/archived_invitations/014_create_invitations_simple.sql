-- Simple Invitations Table Creation
-- Run this to quickly fix the missing invitations table

-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS invitations CASCADE;

-- Create invitations table with minimal setup
CREATE TABLE invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization_id UUID DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    project_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);

-- Create the invitation function
CREATE OR REPLACE FUNCTION create_invitation(
    p_email VARCHAR,
    p_role VARCHAR,
    p_organization_id UUID,
    p_project_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS invitations AS $$
DECLARE
    v_invitation invitations;
    v_token VARCHAR;
BEGIN
    -- Generate a unique token
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create the invitation
    INSERT INTO invitations (
        email,
        role,
        organization_id,
        project_id,
        token,
        metadata
    ) VALUES (
        p_email,
        p_role,
        COALESCE(p_organization_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
        p_project_id,
        v_token,
        p_metadata
    ) RETURNING * INTO v_invitation;
    
    RETURN v_invitation;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON invitations TO authenticated;
GRANT EXECUTE ON FUNCTION create_invitation TO authenticated;

-- Test the setup
SELECT 'Invitations table created successfully!' as status;