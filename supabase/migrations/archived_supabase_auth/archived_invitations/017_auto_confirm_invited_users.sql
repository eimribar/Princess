-- ============================================================
-- AUTO-CONFIRM EMAIL FOR INVITED USERS
-- ============================================================
-- This function confirms email addresses for invited users
-- This is safe because invited users are pre-verified
-- ============================================================

-- Function to auto-confirm email for invited users
CREATE OR REPLACE FUNCTION confirm_invited_user_email(p_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_invitation_exists BOOLEAN;
BEGIN
  -- Check if a pending invitation exists for this email
  SELECT EXISTS(
    SELECT 1 FROM invitations 
    WHERE email = p_email 
    AND status = 'pending'
  ) INTO v_invitation_exists;
  
  IF NOT v_invitation_exists THEN
    -- No invitation found - don't auto-confirm
    RETURN FALSE;
  END IF;
  
  -- Get the user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    -- User doesn't exist
    RETURN FALSE;
  END IF;
  
  -- Confirm the email for this invited user
  UPDATE auth.users 
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE id = v_user_id
    AND email_confirmed_at IS NULL;
  
  -- Check if update was successful
  IF FOUND THEN
    RAISE NOTICE 'Email confirmed for invited user: %', p_email;
    RETURN TRUE;
  ELSE
    -- Email was already confirmed or update failed
    RETURN FALSE;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error confirming email for %: %', p_email, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION confirm_invited_user_email(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_invited_user_email(VARCHAR) TO service_role;

-- ============================================================
-- OPTIONAL: Auto-confirm on invitation acceptance
-- ============================================================
-- You can also modify the accept_invitation function to auto-confirm

CREATE OR REPLACE FUNCTION accept_invitation_with_auto_confirm(p_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Update invitation status
  UPDATE invitations
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE token = p_token;
  
  -- Auto-confirm the user's email if they exist
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_invitation.email;
  
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Email auto-confirmed for invited user: %', v_invitation.email;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_invitation_with_auto_confirm(VARCHAR) TO authenticated;

-- ============================================================
-- TEST THE FUNCTION
-- ============================================================
-- You can test with:
-- SELECT confirm_invited_user_email('test@example.com');
-- SELECT accept_invitation_with_auto_confirm('invitation_token_here');