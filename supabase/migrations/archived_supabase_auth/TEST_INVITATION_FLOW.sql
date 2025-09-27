-- ============================================================
-- TEST THE COMPLETE INVITATION FLOW
-- ============================================================
-- Run this script to test the new invitation system
-- ============================================================

-- 1. Clean up any test data from previous attempts
SELECT '=== CLEANING UP TEST DATA ===' as step;
DELETE FROM invitations WHERE email LIKE 'test%@example.com';
DELETE FROM auth.users WHERE email LIKE 'test%@example.com';

-- 2. Create a fresh test invitation
SELECT '=== CREATING TEST INVITATION ===' as step;
DO $$
DECLARE
  v_invitation invitations;
BEGIN
  -- Create invitation using the function
  v_invitation := create_invitation(
    'testuser@example.com',
    'client',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    NULL,
    jsonb_build_object(
      'test', true,
      'firstName', 'Test',
      'lastName', 'User',
      'created', NOW()::text
    )
  );
  
  RAISE NOTICE 'Created invitation with token: %', v_invitation.token;
  RAISE NOTICE 'Invitation URL: http://localhost:5174/welcome/%', v_invitation.token;
END $$;

-- 3. Show the test invitation
SELECT '=== YOUR TEST INVITATION ===' as step;
SELECT 
  email,
  role,
  status,
  token,
  '👉 http://localhost:5174/welcome/' || token as test_invitation_url,
  'Copy this URL and test in an incognito window' as instructions
FROM invitations
WHERE email = 'testuser@example.com'
AND status = 'pending'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Create multiple test invitations for different scenarios
SELECT '=== CREATING ADDITIONAL TEST SCENARIOS ===' as step;

-- Test invitation for agency member
INSERT INTO invitations (email, role, organization_id, token, status, expires_at, metadata)
VALUES (
  'testagency@example.com',
  'agency',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'test_agency_' || encode(gen_random_bytes(16), 'hex'),
  'pending',
  NOW() + INTERVAL '7 days',
  jsonb_build_object('test', true, 'type', 'agency_member')
)
ON CONFLICT DO NOTHING;

-- Test invitation for viewer
INSERT INTO invitations (email, role, organization_id, token, status, expires_at, metadata)
VALUES (
  'testviewer@example.com',
  'viewer',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'test_viewer_' || encode(gen_random_bytes(16), 'hex'),
  'pending',
  NOW() + INTERVAL '7 days',
  jsonb_build_object('test', true, 'type', 'read_only_viewer')
)
ON CONFLICT DO NOTHING;

-- Test expired invitation
INSERT INTO invitations (email, role, organization_id, token, status, expires_at, metadata)
VALUES (
  'testexpired@example.com',
  'client',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'test_expired_' || encode(gen_random_bytes(16), 'hex'),
  'pending',
  NOW() - INTERVAL '1 day',  -- Already expired
  jsonb_build_object('test', true, 'type', 'expired_test')
)
ON CONFLICT DO NOTHING;

-- 5. Show all test invitations
SELECT '=== ALL TEST INVITATIONS ===' as step;
SELECT 
  email,
  role,
  CASE 
    WHEN expires_at < NOW() THEN '❌ EXPIRED'
    WHEN status = 'accepted' THEN '✅ ACCEPTED'
    ELSE '⏳ PENDING'
  END as status,
  'http://localhost:5174/welcome/' || token as test_url
FROM invitations
WHERE email LIKE 'test%@example.com'
ORDER BY created_at DESC;

-- 6. Check if any test users exist (from previous broken attempts)
SELECT '=== EXISTING TEST USERS IN AUTH ===' as step;
SELECT 
  email,
  created_at,
  CASE 
    WHEN encrypted_password IS NULL OR encrypted_password = '' THEN '❌ NO PASSWORD'
    ELSE '✅ HAS PASSWORD'
  END as password_status,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as email_status,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '❌ NEVER SIGNED IN'
    ELSE '✅ ' || to_char(last_sign_in_at, 'MM/DD HH24:MI')
  END as signin_status
FROM auth.users
WHERE email LIKE 'test%@example.com'
   OR email IN ('cometfen@proton.me', 'frost_persimmon@proton.me', 'lattice_marmot@proton.me')
ORDER BY created_at DESC;

-- 7. Test the process_invitation_signup function (simulation only)
SELECT '=== TESTING INVITATION VALIDATION FUNCTION ===' as step;
SELECT process_invitation_signup(
  (SELECT token FROM invitations WHERE email = 'testuser@example.com' AND status = 'pending' LIMIT 1),
  'testuser@example.com',
  'TestPassword123!'
) as validation_result;

-- 8. Testing instructions
SELECT '=== TESTING INSTRUCTIONS ===' as step;
SELECT '
1. FRESH TEST:
   - Copy the testuser@example.com invitation URL above
   - Open in incognito/private window
   - Click "Accept Invitation"
   - Set password: TestPassword123!
   - Should auto-login and redirect to /onboarding

2. EXISTING USER TEST:
   - Try to invite an email that already exists
   - System should handle gracefully

3. EXPIRED TEST:
   - Try the testexpired@example.com URL
   - Should show "expired" error

4. AFTER TESTING:
   - Check if user can log out and log back in
   - Password should work immediately
   - No email confirmation needed

5. TO RESET:
   - Run this script again to get fresh test invitations
' as instructions;

-- 9. Monitor results
SELECT '=== MONITORING QUERIES ===' as step;
SELECT '
-- Check if test user was created:
SELECT * FROM auth.users WHERE email = ''testuser@example.com'';

-- Check invitation status:
SELECT * FROM invitations WHERE email = ''testuser@example.com'';

-- Check if user can sign in:
-- Try logging in at http://localhost:5174/auth/login
' as monitor_queries;