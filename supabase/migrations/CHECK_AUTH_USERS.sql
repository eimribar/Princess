-- ============================================================
-- DIAGNOSTIC: CHECK AUTH USER STATUS
-- ============================================================
-- This script helps diagnose authentication issues by checking
-- the status of auth users and their password configuration
-- ============================================================

-- 1. Check auth users and their password status
SELECT '=== AUTH USERS STATUS ===' as diagnostic_step;
SELECT 
  id,
  email,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN 'HAS PASSWORD'
    ELSE 'NO PASSWORD'
  END as password_status,
  created_at,
  confirmed_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data->>'role' as assigned_role,
  raw_user_meta_data->>'invitation_token' as invitation_token,
  raw_user_meta_data->>'needs_onboarding' as needs_onboarding
FROM auth.users
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY email;

-- 2. Check matching profiles in public.users
SELECT '=== PUBLIC USER PROFILES ===' as diagnostic_step;
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.needs_onboarding,
  u.onboarding_completed,
  u.created_at,
  CASE 
    WHEN au.id IS NOT NULL THEN 'HAS AUTH USER'
    ELSE 'NO AUTH USER'
  END as auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY u.email;

-- 3. Check invitation status
SELECT '=== INVITATION STATUS ===' as diagnostic_step;
SELECT 
  email,
  token,
  status,
  role,
  expires_at,
  CASE 
    WHEN expires_at > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as validity,
  accepted_at,
  created_at
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY email, created_at DESC;

-- 4. Check for orphaned auth users (no profile)
SELECT '=== ORPHANED AUTH USERS (NO PROFILE) ===' as diagnostic_step;
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN 'HAS PASSWORD'
    ELSE 'NO PASSWORD'
  END as password_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
  AND au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me');

-- 5. Summary of issues
SELECT '=== SUMMARY OF ISSUES ===' as diagnostic_step;
WITH user_status AS (
  SELECT 
    au.email,
    au.id as auth_id,
    u.id as profile_id,
    au.encrypted_password IS NOT NULL as has_password,
    u.needs_onboarding,
    u.onboarding_completed,
    i.status as invitation_status
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.id
  LEFT JOIN invitations i ON au.email = i.email AND i.status = 'pending'
  WHERE au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
)
SELECT 
  email,
  CASE 
    WHEN auth_id IS NULL THEN '❌ No auth user'
    WHEN NOT has_password THEN '⚠️ Auth user exists but NO PASSWORD'
    WHEN profile_id IS NULL THEN '⚠️ Auth user exists but NO PROFILE'
    WHEN needs_onboarding = true THEN '⏳ Needs onboarding'
    WHEN onboarding_completed = true THEN '✅ Ready to use'
    ELSE '❓ Unknown state'
  END as status,
  CASE 
    WHEN auth_id IS NULL THEN 'Create auth user with password'
    WHEN NOT has_password THEN 'Set password using auth.updateUser or password reset'
    WHEN profile_id IS NULL THEN 'Create profile in public.users'
    WHEN needs_onboarding = true THEN 'Complete onboarding'
    ELSE 'No action needed'
  END as recommended_action
FROM user_status
ORDER BY email;

-- 6. Quick fix suggestions
SELECT '=== RECOMMENDED SQL FIXES ===' as diagnostic_step;
SELECT 
  '-- For users without passwords, they need to use password reset flow or auth.updateUser API' as fix_1,
  '-- For users without profiles, run the FIX_BROKEN_PROFILES.sql migration' as fix_2,
  '-- For expired invitations, create new invitations with extended expiry' as fix_3;