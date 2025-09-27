-- ============================================================
-- COMPREHENSIVE FIX FOR ALL AUTH ISSUES
-- ============================================================
-- This script fixes all authentication-related issues for test users
-- Run this after CHECK_AUTH_USERS.sql to fix any identified problems
-- ============================================================

-- 1. First, let's see the current state
SELECT '=== CURRENT STATE BEFORE FIXES ===' as step;
SELECT 
  au.email,
  au.id as auth_id,
  CASE WHEN au.encrypted_password IS NOT NULL THEN 'YES' ELSE 'NO' END as has_password,
  CASE WHEN u.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile,
  u.needs_onboarding,
  u.onboarding_completed
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY au.email;

-- 2. Fix missing profiles for existing auth users
SELECT '=== CREATING MISSING PROFILES ===' as step;
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  organization_id,
  needs_onboarding,
  onboarding_completed,
  notification_preferences,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ) as full_name,
  COALESCE(
    (au.raw_user_meta_data->>'role')::user_role,
    'client'::user_role
  ) as role,
  COALESCE(
    (au.raw_user_meta_data->>'organization_id')::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  ) as organization_id,
  true as needs_onboarding,
  false as onboarding_completed,
  '{"email": true, "sms": false, "level": "all"}'::jsonb as notification_preferences,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
  )
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW(),
  needs_onboarding = CASE 
    WHEN users.onboarding_completed = true THEN false
    ELSE true
  END;

-- 3. Ensure all test users have proper metadata in auth.users
SELECT '=== UPDATING AUTH USER METADATA ===' as step;
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'full_name', COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'role', COALESCE(raw_user_meta_data->>'role', 'client'),
  'organization_id', COALESCE(raw_user_meta_data->>'organization_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  'needs_onboarding', COALESCE(raw_user_meta_data->>'needs_onboarding', 'true')
)
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND (
    raw_user_meta_data IS NULL 
    OR raw_user_meta_data = '{}'::jsonb
    OR raw_user_meta_data->>'role' IS NULL
  );

-- 4. Reset all test users to need onboarding (for testing)
SELECT '=== RESETTING ONBOARDING STATUS ===' as step;
UPDATE public.users
SET 
  needs_onboarding = true,
  onboarding_completed = false,
  onboarding_completed_at = NULL
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me');

-- 5. Create fresh invitations for all test users
SELECT '=== CREATING FRESH INVITATIONS ===' as step;

-- First, delete old invitations for these test users
DELETE FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me');

-- Create new invitations with proper tokens
INSERT INTO invitations (
  email,
  role,
  organization_id,
  token,
  status,
  expires_at,
  created_at,
  metadata
)
VALUES 
  (
    'frost_persimmon@proton.me',
    'client'::user_role,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    encode(gen_random_bytes(32), 'hex'),
    'pending',
    NOW() + INTERVAL '7 days',
    NOW(),
    '{"test_user": true}'::jsonb
  ),
  (
    'lattice_marmot@proton.me',
    'client'::user_role,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    encode(gen_random_bytes(32), 'hex'),
    'pending',
    NOW() + INTERVAL '7 days',
    NOW(),
    '{"test_user": true}'::jsonb
  ),
  (
    'eimrib@pm.me',
    'admin'::user_role,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    encode(gen_random_bytes(32), 'hex'),
    'pending',
    NOW() + INTERVAL '7 days',
    NOW(),
    '{"test_user": true}'::jsonb
  );

-- 6. Display the new invitation links
SELECT '=== NEW INVITATION LINKS ===' as step;
SELECT 
  email,
  role,
  'http://localhost:5174/welcome/' || token as invitation_link,
  expires_at
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND status = 'pending'
ORDER BY email;

-- 7. Final verification
SELECT '=== FINAL STATE AFTER FIXES ===' as step;
SELECT 
  au.email,
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN '✅ Has Password'
    ELSE '⚠️ No Password (use invitation link)'
  END as password_status,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Has Profile'
    ELSE '❌ No Profile'
  END as profile_status,
  CASE 
    WHEN i.token IS NOT NULL THEN '✅ Has Invitation'
    ELSE '❌ No Invitation'
  END as invitation_status,
  u.role,
  u.needs_onboarding
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
LEFT JOIN invitations i ON au.email = i.email AND i.status = 'pending'
WHERE au.email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY au.email;

-- 8. Instructions for users without passwords
SELECT '=== INSTRUCTIONS ===' as step;
SELECT 
  'For users without passwords:' as instruction_1,
  '1. Use the invitation link above to set a password' as instruction_2,
  '2. OR use "Forgot Password" on the login page' as instruction_3,
  '3. After setting password, you can log in normally' as instruction_4;

-- 9. Clean up any duplicate profiles (keeping the one linked to auth.users)
SELECT '=== CLEANING UP DUPLICATES ===' as step;
DELETE FROM public.users
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND id NOT IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = users.email
  );