-- ============================================================
-- FIX USER PROFILE MISMATCH
-- ============================================================
-- This script identifies and fixes mismatches between 
-- auth.users and the custom users table
-- ============================================================

-- STEP 1: Show the mismatch
SELECT '=== USERS IN AUTH BUT NOT IN USERS TABLE ===' as diagnosis;

SELECT 
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.raw_user_meta_data->>'role' as role,
    au.raw_user_meta_data->>'organization_id' as organization_id,
    au.raw_user_meta_data->>'invitation_token' as invitation_token,
    au.raw_user_meta_data->>'needs_onboarding' as needs_onboarding
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- STEP 2: Show existing users in both tables
SELECT '=== USERS THAT EXIST IN BOTH TABLES ===' as diagnosis;

SELECT 
    u.id,
    u.email as users_email,
    au.email as auth_email,
    u.role as users_role,
    au.raw_user_meta_data->>'role' as auth_role,
    u.needs_onboarding,
    u.onboarding_completed
FROM users u
INNER JOIN auth.users au ON u.id = au.id;

-- STEP 3: Create missing user profiles
SELECT '=== CREATING MISSING USER PROFILES ===' as action;

INSERT INTO users (
    id,
    email,
    full_name,
    role,
    organization_id,
    invitation_token,
    needs_onboarding,
    onboarding_completed,
    notification_preferences,
    is_active,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    COALESCE(au.raw_user_meta_data->>'role', 'viewer')::user_role as role,  -- Cast to user_role enum
    COALESCE(
        (au.raw_user_meta_data->>'organization_id')::uuid,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    ) as organization_id,
    au.raw_user_meta_data->>'invitation_token' as invitation_token,
    COALESCE((au.raw_user_meta_data->>'needs_onboarding')::boolean, true) as needs_onboarding,
    false as onboarding_completed,
    '{"email": true, "sms": false, "level": "all"}'::jsonb as notification_preferences,
    true as is_active,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    role = COALESCE(users.role, EXCLUDED.role),
    organization_id = COALESCE(users.organization_id, EXCLUDED.organization_id),
    updated_at = NOW();

-- STEP 4: Show current invitations status
SELECT '=== CURRENT INVITATIONS STATUS ===' as status;

SELECT 
    i.email,
    i.role,
    i.status,
    i.token,
    CASE 
        WHEN i.expires_at < NOW() THEN 'EXPIRED - needs renewal'
        ELSE 'VALID until ' || i.expires_at::text
    END as validity,
    i.created_at,
    EXISTS(SELECT 1 FROM auth.users au WHERE au.email = i.email) as has_auth_account,
    EXISTS(SELECT 1 FROM users u WHERE u.email = i.email) as has_user_profile
FROM invitations i
ORDER BY i.created_at DESC;

-- STEP 5: Check for invitations that need to be marked as accepted
SELECT '=== INVITATIONS THAT SHOULD BE MARKED ACCEPTED ===' as check;

UPDATE invitations
SET status = 'accepted'
WHERE email IN (
    SELECT i.email 
    FROM invitations i
    INNER JOIN auth.users au ON i.email = au.email
    WHERE i.status = 'pending'
)
RETURNING email, status, created_at;

-- STEP 6: Final verification
SELECT '=== FINAL STATE ===' as summary;

SELECT 
    'Total Auth Users' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Total User Profiles' as metric,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Users Missing Profiles' as metric,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Pending Invitations' as metric,
    COUNT(*) as count
FROM invitations
WHERE status = 'pending'
UNION ALL
SELECT 
    'Accepted Invitations' as metric,
    COUNT(*) as count
FROM invitations
WHERE status = 'accepted'
UNION ALL
SELECT 
    'Users Needing Onboarding' as metric,
    COUNT(*) as count
FROM users
WHERE needs_onboarding = true AND onboarding_completed = false;

-- STEP 7: Show users ready for login
SELECT '=== USERS READY TO LOGIN ===' as ready;

SELECT 
    u.email,
    u.full_name,
    u.role,
    CASE 
        WHEN u.needs_onboarding AND NOT u.onboarding_completed THEN 'Needs Onboarding'
        WHEN u.onboarding_completed THEN 'Onboarding Complete'
        ELSE 'Ready'
    END as status,
    u.created_at
FROM users u
INNER JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;