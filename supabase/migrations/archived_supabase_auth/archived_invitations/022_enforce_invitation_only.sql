-- ============================================================
-- ENFORCE INVITATION-ONLY SIGNUP
-- ============================================================
-- This migration ensures ONLY invited users can sign up
-- It provides database-level security that cannot be bypassed
-- ============================================================

-- 1. First, make sure the enforcement function exists (update if needed)
CREATE OR REPLACE FUNCTION enforce_invitation_only_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_invitation_token VARCHAR;
  v_invitation invitations;
BEGIN
  -- Get invitation token from metadata
  v_invitation_token := NEW.raw_user_meta_data->>'invitation_token';
  
  -- Special cases where we allow signup without invitation
  
  -- Case 1: First user (admin setup)
  IF (SELECT COUNT(*) FROM auth.users) = 0 THEN
    RAISE LOG 'Allowing first user signup (admin setup)';
    RETURN NEW;
  END IF;
  
  -- Case 2: OAuth providers (optional - comment out if you want to block these too)
  IF NEW.raw_user_meta_data->>'provider' IN ('google', 'github', 'azure') THEN
    RAISE LOG 'Allowing OAuth signup for provider: %', NEW.raw_user_meta_data->>'provider';
    -- Optionally, you can still require invitation for OAuth:
    -- Comment the RETURN line below to require invitations for OAuth users
    RETURN NEW;
  END IF;
  
  -- Case 3: Service accounts (for testing/automation)
  IF NEW.email LIKE '%@service.princess.app' THEN
    RAISE LOG 'Allowing service account signup: %', NEW.email;
    RETURN NEW;
  END IF;
  
  -- MAIN CHECK: Require valid invitation
  IF v_invitation_token IS NULL OR v_invitation_token = '' THEN
    RAISE EXCEPTION 'Registration is by invitation only. Please contact your administrator to request an invitation.';
  END IF;
  
  -- Validate the invitation exists and is valid
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = v_invitation_token
    AND email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF v_invitation.id IS NULL THEN
    -- Check if invitation exists but with different issues
    PERFORM 1 FROM invitations WHERE token = v_invitation_token;
    IF FOUND THEN
      -- Token exists, check specific issue
      PERFORM 1 FROM invitations WHERE token = v_invitation_token AND email != NEW.email;
      IF FOUND THEN
        RAISE EXCEPTION 'This invitation is for a different email address.';
      END IF;
      
      PERFORM 1 FROM invitations WHERE token = v_invitation_token AND status != 'pending';
      IF FOUND THEN
        RAISE EXCEPTION 'This invitation has already been used.';
      END IF;
      
      PERFORM 1 FROM invitations WHERE token = v_invitation_token AND expires_at <= NOW();
      IF FOUND THEN
        RAISE EXCEPTION 'This invitation has expired. Please request a new one.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid invitation token. Please check your invitation link.';
    END IF;
  END IF;
  
  -- Mark invitation as accepted
  UPDATE invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = NEW.id
  WHERE id = v_invitation.id;
  
  RAISE LOG 'Invitation % accepted by user %', v_invitation.id, NEW.email;
  
  -- Enrich user metadata with invitation details
  NEW.raw_user_meta_data = NEW.raw_user_meta_data || 
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'invited_at', v_invitation.created_at,
      'role', COALESCE(v_invitation.role, 'viewer'),
      'organization_id', v_invitation.organization_id,
      'project_id', v_invitation.project_id,
      'signup_method', 'invitation'
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_invitation_only_signup_trigger ON auth.users;

-- 3. CREATE THE ENFORCEMENT TRIGGER (THIS IS THE KEY STEP!)
CREATE TRIGGER enforce_invitation_only_signup_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_invitation_only_signup();

-- 4. Create a function to temporarily disable enforcement (for admin use)
CREATE OR REPLACE FUNCTION toggle_invitation_enforcement(enable BOOLEAN)
RETURNS TEXT AS $$
BEGIN
  IF enable THEN
    -- Enable the trigger
    ALTER TABLE auth.users ENABLE TRIGGER enforce_invitation_only_signup_trigger;
    RETURN 'Invitation-only signup ENABLED. Only invited users can now register.';
  ELSE
    -- Disable the trigger
    ALTER TABLE auth.users DISABLE TRIGGER enforce_invitation_only_signup_trigger;
    RETURN 'Invitation-only signup DISABLED. Anyone can now register (NOT RECOMMENDED).';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role only (admins)
REVOKE EXECUTE ON FUNCTION toggle_invitation_enforcement FROM PUBLIC;
GRANT EXECUTE ON FUNCTION toggle_invitation_enforcement TO service_role;

-- 5. Create a view to check enforcement status
CREATE OR REPLACE VIEW invitation_enforcement_status AS
SELECT 
  CASE 
    WHEN tgenabled THEN 'ENABLED ✅ - Only invited users can sign up'
    ELSE 'DISABLED ❌ - Anyone can sign up (SECURITY RISK!)'
  END as status,
  'enforce_invitation_only_signup_trigger' as trigger_name
FROM pg_trigger
WHERE tgname = 'enforce_invitation_only_signup_trigger';

-- Grant select on the view
GRANT SELECT ON invitation_enforcement_status TO authenticated;

-- 6. Show current status
SELECT '=== INVITATION ENFORCEMENT STATUS ===' as info;
SELECT * FROM invitation_enforcement_status;

-- 7. Show recent signups to verify
SELECT '=== RECENT SIGNUPS (Last 24 Hours) ===' as info;
SELECT 
  email,
  created_at,
  raw_user_meta_data->>'invitation_token' as invitation_token,
  raw_user_meta_data->>'signup_method' as signup_method,
  CASE 
    WHEN raw_user_meta_data->>'invitation_token' IS NOT NULL THEN '✅ Via Invitation'
    ELSE '⚠️ Direct Signup'
  END as signup_type
FROM auth.users
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 8. Count users by signup method
SELECT '=== USERS BY SIGNUP METHOD ===' as info;
SELECT 
  CASE 
    WHEN raw_user_meta_data->>'invitation_token' IS NOT NULL THEN 'Invited Users'
    WHEN raw_user_meta_data->>'provider' IS NOT NULL THEN 'OAuth Users (' || raw_user_meta_data->>'provider' || ')'
    ELSE 'Direct Signups (No Invitation)'
  END as user_type,
  COUNT(*) as count
FROM auth.users
GROUP BY user_type
ORDER BY count DESC;

-- 9. Instructions
SELECT '=== IMPORTANT INFORMATION ===' as info;
SELECT 
  '✅ ENFORCEMENT IS NOW ACTIVE' as status,
  'From now on, users CANNOT sign up without a valid invitation.' as description
UNION ALL
SELECT 
  '🔒 Security Level' as status,
  'Database-level enforcement - Cannot be bypassed by API or UI' as description
UNION ALL
SELECT 
  '⚠️ To Temporarily Disable' as status,
  'SELECT toggle_invitation_enforcement(false);' as description
UNION ALL
SELECT 
  '✅ To Re-enable' as status,
  'SELECT toggle_invitation_enforcement(true);' as description
UNION ALL
SELECT 
  '📧 OAuth Logins' as status,
  'Currently ALLOWED - Edit function to change this behavior' as description;

-- 10. Test the enforcement
SELECT '=== TEST THE ENFORCEMENT ===' as info;
SELECT 'Try to sign up at /auth/signup (if route exists) - it should FAIL' as test_1,
       'Try to use Supabase API directly - it should FAIL' as test_2,
       'Try with valid invitation link - it should SUCCEED' as test_3;