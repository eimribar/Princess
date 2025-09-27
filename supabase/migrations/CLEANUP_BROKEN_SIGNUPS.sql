-- ============================================================
-- CLEANUP BROKEN SIGNUPS
-- ============================================================
-- This script removes profiles that shouldn't exist yet
-- (users who have auth accounts but never completed signup properly)
-- ============================================================

-- STEP 1: Show current situation
SELECT '=== CURRENT SITUATION ===' as status;

-- Show users who have auth but incomplete profiles
SELECT 
    u.email,
    u.full_name,
    u.role,
    u.needs_onboarding,
    u.onboarding_completed,
    CASE 
        WHEN u.onboarding_completed = true THEN 'Profile Complete'
        WHEN u.needs_onboarding = true AND u.onboarding_completed = false THEN 'Needs Onboarding'
        ELSE 'Incomplete'
    END as status,
    u.created_at
FROM users u
ORDER BY u.created_at DESC;

-- STEP 2: Check which users should be removed
SELECT '=== USERS TO CLEAN UP (never completed proper signup) ===' as action;

-- These are users who:
-- 1. Need onboarding (never completed it)
-- 2. Have basic profiles we created via SQL
-- 3. Should go through the proper invitation flow
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at,
    'Will be removed - user needs to complete invitation flow properly' as action
FROM users u
WHERE u.needs_onboarding = true 
  AND u.onboarding_completed = false
  AND u.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me');

-- STEP 3: Delete the profiles that shouldn't exist
-- Comment this out if you want to review first
/*
DELETE FROM users
WHERE needs_onboarding = true 
  AND onboarding_completed = false
  AND email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
RETURNING email as deleted_profile;
*/

-- STEP 4: Reset invitations for these users
SELECT '=== RESETTING INVITATIONS ===' as action;

UPDATE invitations
SET status = 'pending',
    expires_at = NOW() + INTERVAL '7 days'
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND status = 'accepted'
RETURNING email, status, expires_at;

-- STEP 5: Final state
SELECT '=== FINAL STATE ===' as summary;

SELECT 
    'Auth Users' as category,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'User Profiles' as category,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Pending Invitations' as category,
    COUNT(*) as count
FROM invitations
WHERE status = 'pending';

-- STEP 6: Instructions
SELECT '=== NEXT STEPS ===' as instructions;
SELECT 'Users with auth accounts but no profiles can now:' as instruction
UNION ALL
SELECT '1. Visit the invitation link' as instruction
UNION ALL
SELECT '2. Sign in with their password (not sign up)' as instruction
UNION ALL
SELECT '3. Continue to onboarding' as instruction
UNION ALL
SELECT '4. Complete their profile' as instruction;