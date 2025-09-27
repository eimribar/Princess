-- ============================================================
-- COMPLETE INVITATION SYSTEM FIX
-- ============================================================
-- This migration creates all necessary functions for a proper
-- invitation system that works correctly
-- ============================================================

-- 1. Function to auto-confirm email for invited users
CREATE OR REPLACE FUNCTION auto_confirm_invited_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this user was created from an invitation
  IF NEW.raw_user_meta_data->>'invitation_token' IS NOT NULL THEN
    -- Auto-confirm their email immediately
    NEW.email_confirmed_at = NOW();
    RAISE LOG 'Auto-confirmed email for invited user: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger to auto-confirm invited users
DROP TRIGGER IF EXISTS auto_confirm_invited_users_trigger ON auth.users;
CREATE TRIGGER auto_confirm_invited_users_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_invited_user();

-- 3. Function to validate invitation and create/update user
CREATE OR REPLACE FUNCTION process_invitation_signup(
  p_token VARCHAR,
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_invitation invitations;
  v_user_id UUID;
  v_existing_user RECORD;
  v_result JSONB;
BEGIN
  -- Validate the invitation token
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND email = p_email
    AND expires_at > NOW();
  
  IF v_invitation.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;
  
  -- Check if user already exists in auth.users
  SELECT id, email, encrypted_password 
  INTO v_existing_user
  FROM auth.users
  WHERE email = p_email;
  
  IF v_existing_user.id IS NOT NULL THEN
    -- User exists - check if they have a password
    IF v_existing_user.encrypted_password IS NULL OR v_existing_user.encrypted_password = '' THEN
      -- User was created by inviteUserByEmail without password
      -- We need to set their password using admin privileges
      -- Note: Direct password update requires service role key
      RETURN jsonb_build_object(
        'success', false,
        'error', 'existing_user_needs_password',
        'user_id', v_existing_user.id,
        'message', 'User exists without password. Frontend should handle this case.'
      );
    ELSE
      -- User already has a password - they should sign in instead
      RETURN jsonb_build_object(
        'success', false,
        'error', 'user_exists_with_password',
        'message', 'User already exists. Please sign in with your existing password.'
      );
    END IF;
  END IF;
  
  -- Accept the invitation
  UPDATE invitations
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = v_invitation.id;
  
  -- Return success - user should be created via normal signup
  RETURN jsonb_build_object(
    'success', true,
    'invitation', row_to_json(v_invitation),
    'message', 'Invitation validated. Proceed with signup.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to handle invitation-only signup enforcement
CREATE OR REPLACE FUNCTION enforce_invitation_only_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_invitation_token VARCHAR;
  v_invitation invitations;
BEGIN
  -- Get invitation token from metadata
  v_invitation_token := NEW.raw_user_meta_data->>'invitation_token';
  
  -- If no invitation token, check if this is a system/admin user
  IF v_invitation_token IS NULL THEN
    -- Allow if it's the first user (admin setup)
    IF (SELECT COUNT(*) FROM auth.users) = 0 THEN
      RETURN NEW;
    END IF;
    
    -- Check if signup is from OAuth provider (allow Google sign-ins if configured)
    IF NEW.raw_user_meta_data->>'provider' = 'google' THEN
      RETURN NEW;
    END IF;
    
    -- Otherwise, block the signup
    RAISE EXCEPTION 'Signup requires a valid invitation';
  END IF;
  
  -- Validate the invitation
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = v_invitation_token
    AND email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Mark invitation as accepted
  UPDATE invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = NEW.id
  WHERE id = v_invitation.id;
  
  -- Add invitation metadata to user
  NEW.raw_user_meta_data = NEW.raw_user_meta_data || 
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'role', v_invitation.role,
      'organization_id', v_invitation.organization_id,
      'project_id', v_invitation.project_id
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for invitation-only signup (disabled by default)
-- Uncomment these lines to enforce invitation-only signup
-- DROP TRIGGER IF EXISTS enforce_invitation_only_signup_trigger ON auth.users;
-- CREATE TRIGGER enforce_invitation_only_signup_trigger
--   BEFORE INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION enforce_invitation_only_signup();

-- 6. Function to confirm all invited users' emails (for fixing existing users)
CREATE OR REPLACE FUNCTION confirm_all_invited_users()
RETURNS TABLE(email VARCHAR, status TEXT) AS $$
BEGIN
  RETURN QUERY
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE raw_user_meta_data->>'invitation_token' IS NOT NULL
    AND email_confirmed_at IS NULL
  RETURNING auth.users.email, 'Email confirmed' as status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create or update the create_invitation function with better defaults
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
  v_existing invitations;
  v_token VARCHAR;
BEGIN
  -- Check if there's an existing pending invitation
  SELECT * INTO v_existing
  FROM invitations
  WHERE email = p_email
    AND status = 'pending'
    AND expires_at > NOW()
  LIMIT 1;
  
  IF v_existing.id IS NOT NULL THEN
    -- Update existing invitation with new token
    v_token := encode(gen_random_bytes(32), 'hex');
    
    UPDATE invitations
    SET token = v_token,
        expires_at = NOW() + INTERVAL '7 days',
        metadata = p_metadata,
        role = p_role,
        organization_id = COALESCE(p_organization_id, organization_id),
        project_id = COALESCE(p_project_id, project_id),
        updated_at = NOW()
    WHERE id = v_existing.id
    RETURNING * INTO v_invitation;
    
    RAISE LOG 'Updated existing invitation for %', p_email;
  ELSE
    -- Create new invitation
    v_token := encode(gen_random_bytes(32), 'hex');
    
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
      COALESCE(p_organization_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
      p_project_id,
      v_token,
      p_metadata,
      'pending',
      NOW() + INTERVAL '7 days'
    ) RETURNING * INTO v_invitation;
    
    RAISE LOG 'Created new invitation for %', p_email;
  END IF;
  
  RETURN v_invitation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_invitation_signup TO anon;
GRANT EXECUTE ON FUNCTION create_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_all_invited_users TO service_role;

-- 9. Fix any existing users who were created with inviteUserByEmail
-- This confirms their emails so they can sign in
SELECT confirm_all_invited_users();

-- 10. Show current status
SELECT '=== INVITATION SYSTEM STATUS ===' as status;
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending_invitations,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_invitations,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_invitations,
  COUNT(*) as total_invitations
FROM invitations;

SELECT '=== USERS NEEDING EMAIL CONFIRMATION ===' as status;
SELECT email, created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Not confirmed'
    ELSE '✅ Confirmed'
  END as confirmation_status
FROM auth.users
WHERE email_confirmed_at IS NULL
LIMIT 10;

-- 11. Instructions for production
SELECT '=== PRODUCTION SETUP ===' as info;
SELECT 'To enforce invitation-only signup:' as step_1,
       'Uncomment lines 127-130 to enable the trigger' as action_1,
       '' as blank_1,
       'To send real emails:' as step_2,
       'Add RESEND_API_KEY to Edge Function environment variables' as action_2,
       '' as blank_2,
       'Email confirmation setting:' as step_3,
       'Keep "Confirm email" OFF in Supabase Dashboard for invited users' as action_3;