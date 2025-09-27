-- ============================================================
-- FIX BROKEN USER PROFILES
-- ============================================================
-- This script fixes users who have auth accounts but broken profiles
-- ============================================================

-- 1. Check current state of our test users
SELECT '=== CURRENT AUTH USERS ===' as step;
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.last_sign_in_at,
    CASE WHEN u.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY au.email;

-- 2. Check current profiles
SELECT '=== CURRENT USER PROFILES ===' as step;
SELECT 
    id,
    email,
    full_name,
    role,
    needs_onboarding,
    onboarding_completed,
    created_at
FROM public.users
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY email;

-- 3. Delete duplicate or broken profiles (keeping auth.users intact)
SELECT '=== CLEANING UP DUPLICATE PROFILES ===' as step;
DELETE FROM public.users
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND id NOT IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  );

-- 4. Create missing profiles for auth users
SELECT '=== CREATING MISSING PROFILES ===' as step;
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    organization_id,
    needs_onboarding,
    onboarding_completed,
    notification_preferences
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    COALESCE(au.raw_user_meta_data->>'role', 'client')::user_role as role,
    COALESCE(
        (au.raw_user_meta_data->>'organization_id')::uuid, 
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    ) as organization_id,
    true as needs_onboarding,
    false as onboarding_completed,
    '{"email": true, "sms": false, "level": "all"}'::jsonb as notification_preferences
FROM auth.users au
WHERE au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
  );

-- 5. Reset onboarding status for all test users
SELECT '=== RESETTING ONBOARDING STATUS ===' as step;
UPDATE public.users
SET 
    needs_onboarding = true,
    onboarding_completed = false,
    onboarding_completed_at = NULL,
    profile_image = NULL,
    title = NULL,
    department = NULL,
    phone = NULL,
    bio = NULL
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me');

-- 6. Reset invitation status to allow re-acceptance
SELECT '=== RESETTING INVITATION STATUS ===' as step;
UPDATE invitations
SET 
    status = 'pending',
    expires_at = NOW() + INTERVAL '7 days'
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me');

-- 7. Final check - show the clean state
SELECT '=== FINAL STATE CHECK ===' as step;
SELECT 
    au.email,
    CASE WHEN u.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile,
    u.needs_onboarding,
    u.onboarding_completed,
    i.status as invitation_status,
    i.token as invitation_token
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
LEFT JOIN invitations i ON au.email = i.email AND i.status = 'pending'
WHERE au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY au.email;

-- 8. Show invitation links ready for testing
SELECT '=== INVITATION LINKS FOR TESTING ===' as step;
SELECT 
    email,
    'http://localhost:5174/welcome/' || token as invitation_link
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND status = 'pending'
ORDER BY email;