-- ============================================================
-- TEST THE DIRECT USER CREATION SYSTEM
-- ============================================================

-- 1. Clean up any existing test data
DELETE FROM invitations WHERE email = 'directtest@example.com';
DELETE FROM public.users WHERE email = 'directtest@example.com';
DELETE FROM auth.users WHERE email = 'directtest@example.com';

-- 2. Create a fresh test invitation
DO $$
DECLARE
    v_invitation invitations;
    v_test_result JSONB;
BEGIN
    -- Create the invitation
    v_invitation := create_invitation(
        'directtest@example.com',
        'client',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        NULL,
        jsonb_build_object(
            'test', true,
            'firstName', 'Direct',
            'lastName', 'Test',
            'created', NOW()::text
        )
    );
    
    RAISE NOTICE '=== TEST INVITATION CREATED ===';
    RAISE NOTICE 'Token: %', v_invitation.token;
    RAISE NOTICE 'Email: %', v_invitation.email;
    
    -- Test the direct creation function
    RAISE NOTICE '=== TESTING DIRECT USER CREATION ===';
    v_test_result := create_user_directly(
        'directtest@example.com',
        'TestPassword123!',
        v_invitation.token,
        jsonb_build_object('full_name', 'Direct Test User')
    );
    
    RAISE NOTICE 'Creation result: %', v_test_result;
    
    -- Verify password works
    IF verify_user_password('directtest@example.com', 'TestPassword123!') THEN
        RAISE NOTICE '✅ Password verification PASSED!';
    ELSE
        RAISE NOTICE '❌ Password verification FAILED!';
    END IF;
END $$;

-- 3. Show the test invitation URL
SELECT '=== YOUR TEST INVITATION ===' as title;
SELECT 
    email,
    role,
    status,
    token,
    '👉 TEST THIS URL:' as instruction,
    'http://localhost:5174/welcome/' || token as test_url
FROM invitations
WHERE email = 'directtest@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Check if user was created properly
SELECT '=== USER CREATED IN AUTH.USERS ===' as title;
SELECT 
    email,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN '✅ Has password'
        ELSE '❌ No password'
    END as password_status,
    CASE
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmed'
        ELSE '❌ Email not confirmed'
    END as confirmation_status,
    created_at
FROM auth.users
WHERE email = 'directtest@example.com';

-- 5. Check public.users record
SELECT '=== USER CREATED IN PUBLIC.USERS ===' as title;
SELECT 
    email,
    full_name,
    role,
    needs_onboarding,
    created_at
FROM public.users
WHERE email = 'directtest@example.com';

-- 6. Check invitation status
SELECT '=== INVITATION STATUS ===' as title;
SELECT 
    email,
    status,
    accepted_at,
    CASE 
        WHEN status = 'accepted' THEN '✅ Invitation accepted'
        ELSE '⏳ Invitation pending'
    END as acceptance_status
FROM invitations
WHERE email = 'directtest@example.com';

-- 7. Instructions
SELECT '=== HOW TO TEST ===' as title;
SELECT '
1. Copy the directtest@example.com URL above
2. Open in incognito window
3. Click "Accept Invitation"
4. Set password (use: TestPassword123!)
5. Should IMMEDIATELY sign in and go to onboarding

✅ This uses DIRECT user creation bypassing Supabase signUp bug
✅ Password is properly encrypted with crypt()
✅ Email is auto-confirmed
✅ Should work immediately!
' as instructions;