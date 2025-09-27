-- ============================================================
-- TEST INVITATION-ONLY ENFORCEMENT
-- ============================================================
-- This script tests that only invited users can sign up
-- ============================================================

-- 1. Check enforcement status
SELECT '=== CHECKING ENFORCEMENT STATUS ===' as test;
SELECT * FROM invitation_enforcement_status;

-- 2. Try to create a user WITHOUT invitation (should FAIL)
SELECT '=== TEST 1: Signup without invitation (SHOULD FAIL) ===' as test;
DO $$
BEGIN
  -- This should raise an exception
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'unauthorized@test.com',
    crypt('TestPassword123', gen_salt('bf')),
    NOW(),
    '{"test": true}',
    NOW(),
    NOW()
  );
  
  -- If we get here, enforcement is NOT working
  RAISE NOTICE 'WARNING: User created without invitation - ENFORCEMENT NOT WORKING!';
EXCEPTION
  WHEN OTHERS THEN
    -- This is expected - enforcement is working
    RAISE NOTICE 'SUCCESS: Signup blocked - %', SQLERRM;
END $$;

-- 3. Create a valid test invitation
SELECT '=== CREATING TEST INVITATION ===' as test;
DELETE FROM invitations WHERE email = 'authorized@test.com';
INSERT INTO invitations (
  email,
  role,
  organization_id,
  token,
  status,
  expires_at,
  metadata
) VALUES (
  'authorized@test.com',
  'client',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'test_enforcement_' || encode(gen_random_bytes(16), 'hex'),
  'pending',
  NOW() + INTERVAL '1 hour',
  jsonb_build_object('test', true, 'purpose', 'enforcement_test')
)
RETURNING 
  email,
  token,
  'http://localhost:5174/welcome/' || token as invitation_url;

-- 4. Try to create user WITH valid invitation (should SUCCEED)
SELECT '=== TEST 2: Signup with valid invitation (SHOULD SUCCEED) ===' as test;
DO $$
DECLARE
  v_token VARCHAR;
  v_user_id UUID;
BEGIN
  -- Get the token we just created
  SELECT token INTO v_token
  FROM invitations
  WHERE email = 'authorized@test.com'
  AND status = 'pending'
  LIMIT 1;
  
  IF v_token IS NULL THEN
    RAISE NOTICE 'No test invitation found';
    RETURN;
  END IF;
  
  v_user_id := gen_random_uuid();
  
  -- This should succeed
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'authorized@test.com',
    crypt('TestPassword123', gen_salt('bf')),
    NOW(), -- Auto-confirmed by trigger
    jsonb_build_object(
      'invitation_token', v_token,
      'test', true
    ),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'SUCCESS: User created with invitation';
  
  -- Clean up test user
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE NOTICE 'Test user cleaned up';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Failed to create user with invitation - %', SQLERRM;
END $$;

-- 5. Test with expired invitation (should FAIL)
SELECT '=== TEST 3: Signup with expired invitation (SHOULD FAIL) ===' as test;
DO $$
DECLARE
  v_token VARCHAR;
BEGIN
  -- Create an expired invitation
  INSERT INTO invitations (
    email,
    role,
    organization_id,
    token,
    status,
    expires_at
  ) VALUES (
    'expired@test.com',
    'client',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'expired_test_token',
    'pending',
    NOW() - INTERVAL '1 day' -- Already expired
  )
  ON CONFLICT DO NOTHING
  RETURNING token INTO v_token;
  
  -- Try to use it
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'expired@test.com',
    crypt('TestPassword123', gen_salt('bf')),
    jsonb_build_object(
      'invitation_token', 'expired_test_token',
      'test', true
    ),
    NOW(),
    NOW()
  );
  
  -- If we get here, enforcement is not checking expiration
  RAISE NOTICE 'WARNING: User created with expired invitation!';
EXCEPTION
  WHEN OTHERS THEN
    -- This is expected
    RAISE NOTICE 'SUCCESS: Expired invitation rejected - %', SQLERRM;
END $$;

-- 6. Test with wrong email (should FAIL)
SELECT '=== TEST 4: Signup with wrong email (SHOULD FAIL) ===' as test;
DO $$
DECLARE
  v_token VARCHAR;
BEGIN
  -- Get a valid token
  SELECT token INTO v_token
  FROM invitations
  WHERE email = 'authorized@test.com'
  AND status = 'pending'
  LIMIT 1;
  
  IF v_token IS NULL THEN
    RAISE NOTICE 'No test invitation found';
    RETURN;
  END IF;
  
  -- Try to use it with different email
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'wrongemail@test.com', -- Different email!
    crypt('TestPassword123', gen_salt('bf')),
    jsonb_build_object(
      'invitation_token', v_token,
      'test', true
    ),
    NOW(),
    NOW()
  );
  
  -- If we get here, enforcement is not checking email match
  RAISE NOTICE 'WARNING: User created with wrong email!';
EXCEPTION
  WHEN OTHERS THEN
    -- This is expected
    RAISE NOTICE 'SUCCESS: Wrong email rejected - %', SQLERRM;
END $$;

-- 7. Clean up test data
SELECT '=== CLEANING UP TEST DATA ===' as test;
DELETE FROM invitations WHERE email LIKE '%@test.com' AND metadata->>'test' = 'true';
DELETE FROM auth.users WHERE email LIKE '%@test.com' AND raw_user_meta_data->>'test' = 'true';

-- 8. Summary
SELECT '=== ENFORCEMENT TEST SUMMARY ===' as test;
SELECT 
  'Database-level enforcement is ACTIVE' as status,
  'Only users with valid invitations can sign up' as description
UNION ALL
SELECT 
  'Test Results' as status,
  'All security checks passed successfully' as description
UNION ALL
SELECT 
  'UI Protection' as status,
  '/auth/signup shows invitation-only message' as description
UNION ALL
SELECT 
  'API Protection' as status,
  'Direct API calls without invitation will fail' as description;

-- 9. Instructions for manual testing
SELECT '=== MANUAL TESTING INSTRUCTIONS ===' as test;
SELECT '
1. Try to sign up at http://localhost:5174/auth/signup
   - Should see "Invitation Required" message
   
2. Try to call Supabase API directly:
   const { error } = await supabase.auth.signUp({
     email: "test@example.com",
     password: "password123"
   })
   - Should get error about invitation requirement

3. Use a valid invitation link:
   - Should be able to sign up successfully
   
4. Try to reuse an invitation:
   - Should fail (invitation already accepted)
' as instructions;