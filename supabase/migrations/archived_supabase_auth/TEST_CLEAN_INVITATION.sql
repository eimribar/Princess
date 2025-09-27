-- ============================================================
-- TEST THE CLEAN INVITATION SYSTEM
-- ============================================================

-- 1. Clean up any existing test data
DELETE FROM invitations WHERE email = 'cleantest@example.com';
DELETE FROM auth.users WHERE email = 'cleantest@example.com';

-- 2. Create a fresh test invitation
DO $$
DECLARE
    v_invitation invitations;
BEGIN
    v_invitation := create_invitation(
        'cleantest@example.com',
        'client',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        NULL,
        jsonb_build_object(
            'test', true,
            'firstName', 'Clean',
            'lastName', 'Test',
            'created', NOW()::text
        )
    );
    
    RAISE NOTICE 'Token: %', v_invitation.token;
END $$;

-- 3. Show the test invitation
SELECT '=== YOUR TEST INVITATION ===' as title;
SELECT 
    email,
    role,
    status,
    token,
    '👉 COPY THIS URL:' as instruction,
    'http://localhost:5174/welcome/' || token as test_url
FROM invitations
WHERE email = 'cleantest@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Show all recent invitations
SELECT '=== ALL RECENT INVITATIONS ===' as title;
SELECT 
    email,
    status,
    CASE 
        WHEN expires_at < NOW() THEN '❌ Expired'
        WHEN status = 'accepted' THEN '✅ Accepted'
        ELSE '⏳ Pending'
    END as state,
    created_at
FROM invitations
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. Check for users without passwords (should be none if system is clean)
SELECT '=== USERS WITHOUT PASSWORDS ===' as title;
SELECT 
    email,
    created_at,
    '❌ Cannot sign in - no password set' as issue
FROM auth.users
WHERE (encrypted_password IS NULL OR encrypted_password = '')
ORDER BY created_at DESC
LIMIT 10;

-- 6. Testing instructions
SELECT '=== HOW TO TEST ===' as title;
SELECT '
1. Copy the cleantest@example.com URL above
2. Open in incognito window
3. Click "Accept Invitation"
4. Set password (use: Test123!)
5. Should auto sign in and go to onboarding

IF IT FAILS:
- Check console for errors
- Try manually signing in at /auth/login
- Password should be: Test123!
' as instructions;