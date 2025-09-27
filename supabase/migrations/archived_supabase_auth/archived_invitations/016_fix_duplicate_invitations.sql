-- Fix duplicate invitation issue by updating existing pending invitations
-- instead of throwing an error when trying to invite the same email again

-- Drop the existing function
DROP FUNCTION IF EXISTS create_invitation(VARCHAR, VARCHAR, UUID, UUID, JSONB);

-- Recreate the function with better duplicate handling
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
    v_existing_id UUID;
BEGIN
    -- Check if a pending invitation already exists for this email
    SELECT id INTO v_existing_id
    FROM invitations 
    WHERE email = p_email 
    AND status = 'pending'
    AND organization_id = p_organization_id
    AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    LIMIT 1;
    
    -- Generate a new token
    v_token := encode(gen_random_bytes(32), 'hex');
    
    IF v_existing_id IS NOT NULL THEN
        -- Update the existing invitation with new token and reset expiration
        UPDATE invitations 
        SET 
            token = v_token,
            expires_at = NOW() + INTERVAL '7 days',
            created_at = NOW(),  -- Update created_at to reflect the resend
            metadata = p_metadata,  -- Update metadata with new information
            role = p_role  -- Allow role change on resend
        WHERE id = v_existing_id
        RETURNING * INTO v_invitation;
        
        -- Log that we updated an existing invitation
        RAISE NOTICE 'Updated existing invitation for % with new token', p_email;
    ELSE
        -- Create a new invitation
        INSERT INTO invitations (
            email,
            role,
            organization_id,
            project_id,
            token,
            metadata,
            status,
            expires_at
        ) VALUES (
            p_email,
            p_role,
            p_organization_id,
            p_project_id,
            v_token,
            p_metadata,
            'pending',
            NOW() + INTERVAL '7 days'
        ) RETURNING * INTO v_invitation;
        
        -- Log that we created a new invitation
        RAISE NOTICE 'Created new invitation for %', p_email;
    END IF;
    
    RETURN v_invitation;
END;
$$ LANGUAGE plpgsql;

-- Also create a helper function to check invitation status
CREATE OR REPLACE FUNCTION get_invitation_status(p_email VARCHAR, p_organization_id UUID)
RETURNS TABLE(
    has_pending BOOLEAN,
    has_accepted BOOLEAN,
    last_sent TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM invitations WHERE email = p_email AND status = 'pending' AND organization_id = p_organization_id) as has_pending,
        EXISTS(SELECT 1 FROM invitations WHERE email = p_email AND status = 'accepted' AND organization_id = p_organization_id) as has_accepted,
        MAX(created_at) as last_sent,
        MAX(CASE WHEN status = 'pending' THEN invitations.expires_at ELSE NULL END) as expires_at
    FROM invitations
    WHERE email = p_email AND organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_status TO authenticated;

-- Add a comment to document the behavior
COMMENT ON FUNCTION create_invitation IS 'Creates a new invitation or updates an existing pending invitation with a new token and expiration date. This allows resending invitations to the same email address.';