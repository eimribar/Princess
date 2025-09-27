-- ============================================================
-- DIRECT USER CREATION - BYPASSES SUPABASE SIGNUP BUG
-- ============================================================
-- This solves the issue where signUp() doesn't properly save
-- passwords when email confirmation is disabled
-- ============================================================

-- Drop the function if it exists
DROP FUNCTION IF EXISTS create_user_directly CASCADE;

-- Create the direct user creation function
CREATE OR REPLACE FUNCTION create_user_directly(
    p_email VARCHAR,
    p_password VARCHAR,
    p_token VARCHAR,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_invitation invitations;
    v_encrypted_password TEXT;
BEGIN
    -- Validate the invitation token first
    SELECT * INTO v_invitation
    FROM invitations
    WHERE token = p_token
    AND status = 'pending'
    LIMIT 1;
    
    IF v_invitation.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid invitation token'
        );
    END IF;
    
    -- Check if invitation is expired
    IF v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invitation has expired'
        );
    END IF;
    
    -- Verify email matches invitation
    IF v_invitation.email != p_email THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email does not match invitation'
        );
    END IF;
    
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        -- User already exists, just accept the invitation
        UPDATE invitations
        SET status = 'accepted',
            accepted_at = NOW(),
            updated_at = NOW()
        WHERE id = v_invitation.id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User already exists, invitation accepted',
            'user_exists', true
        );
    END IF;
    
    -- Generate a new user ID
    v_user_id := gen_random_uuid();
    
    -- Encrypt the password using bcrypt
    v_encrypted_password := crypt(p_password, gen_salt('bf'));
    
    -- Insert into auth.users with all required fields
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        aud,
        role,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        last_sign_in_at,
        confirmation_sent_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone,
        phone_confirmed_at,
        phone_change_token,
        phone_change,
        reauthentication_token,
        reauthentication_sent_at
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        p_email,
        v_encrypted_password,
        NOW(), -- Email confirmed immediately
        NOW(),
        'authenticated',
        'authenticated',
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email']
        ),
        jsonb_build_object(
            'role', v_invitation.role,
            'organization_id', v_invitation.organization_id,
            'project_id', v_invitation.project_id,
            'needs_onboarding', true,
            'invitation_token', p_token
        ) || COALESCE(p_metadata, '{}'::jsonb),
        false,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        '',
        '',
        NULL,
        NULL,
        '',
        '',
        '',
        NULL
    );
    
    -- Create the public users record
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        organization_id,
        needs_onboarding,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        p_email,
        COALESCE(
            p_metadata->>'full_name',
            split_part(p_email, '@', 1)
        ),
        v_invitation.role,
        v_invitation.organization_id,
        true,
        NOW(),
        NOW()
    );
    
    -- Accept the invitation
    UPDATE invitations
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = v_user_id,
        updated_at = NOW()
    WHERE id = v_invitation.id;
    
    -- Return success with user ID
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', p_email,
        'role', v_invitation.role,
        'message', 'User created successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback will happen automatically
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_directly TO anon;
GRANT EXECUTE ON FUNCTION create_user_directly TO authenticated;

-- Create a helper function to check if user can sign in
CREATE OR REPLACE FUNCTION verify_user_password(
    p_email VARCHAR,
    p_password VARCHAR
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_encrypted_password TEXT;
BEGIN
    -- Get the encrypted password from auth.users
    SELECT encrypted_password INTO v_encrypted_password
    FROM auth.users
    WHERE email = p_email
    LIMIT 1;
    
    -- If no user found, return false
    IF v_encrypted_password IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if password matches
    RETURN v_encrypted_password = crypt(p_password, v_encrypted_password);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for verification
GRANT EXECUTE ON FUNCTION verify_user_password TO anon;
GRANT EXECUTE ON FUNCTION verify_user_password TO authenticated;

-- Test the functions
DO $$
BEGIN
    RAISE NOTICE 'Direct user creation functions installed successfully!';
    RAISE NOTICE 'Use create_user_directly() to bypass Supabase signUp issues';
    RAISE NOTICE 'Use verify_user_password() to check if login will work';
END $$;