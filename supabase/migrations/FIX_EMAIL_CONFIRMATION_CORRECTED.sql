-- ============================================================
-- FIX EMAIL CONFIRMATION ISSUES (CORRECTED)
-- ============================================================
-- This script confirms emails for all test users
-- allowing them to sign in immediately
-- NOTE: confirmed_at is a generated column, we only update email_confirmed_at
-- ============================================================

-- 1. Show current unconfirmed users
SELECT '=== USERS NEEDING EMAIL CONFIRMATION ===' as step;
SELECT 
  email,
  created_at,
  email_confirmed_at,
  '❌ Cannot sign in - email not confirmed' as status
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. Confirm ALL test user emails
SELECT '=== CONFIRMING TEST USER EMAILS ===' as step;
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email IN (
  'frost_persimmon@proton.me',
  'lattice_marmot@proton.me', 
  'eimrib@pm.me',
  'Johnss777@proton.me'
)
AND email_confirmed_at IS NULL;

-- 3. Confirm any recently created users (last 24 hours)
SELECT '=== CONFIRMING RECENT SIGNUPS ===' as step;
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND email_confirmed_at IS NULL;

-- 4. Also confirm any users with lowercase variations
SELECT '=== CONFIRMING LOWERCASE VARIATIONS ===' as step;
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE LOWER(email) IN (
  'johnss777@proton.me',
  'frost_persimmon@proton.me',
  'lattice_marmot@proton.me', 
  'eimrib@pm.me'
)
AND email_confirmed_at IS NULL;

-- 5. Verify all users are now confirmed
SELECT '=== VERIFICATION: ALL USERS NOW CONFIRMED ===' as step;
SELECT 
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed - Can sign in'
    ELSE '❌ Still unconfirmed'
  END as status,
  email_confirmed_at,
  confirmed_at,  -- This will be auto-generated based on email_confirmed_at
  last_sign_in_at
FROM auth.users
WHERE LOWER(email) IN (
  'frost_persimmon@proton.me',
  'lattice_marmot@proton.me', 
  'eimrib@pm.me',
  'johnss777@proton.me'
)
OR created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 6. Show which users were just confirmed
SELECT '=== USERS JUST CONFIRMED ===' as step;
SELECT 
  email,
  email_confirmed_at,
  '✅ Email confirmed - User can now sign in!' as status
FROM auth.users
WHERE email_confirmed_at >= NOW() - INTERVAL '5 minutes'
ORDER BY email_confirmed_at DESC;

-- 7. Instructions for permanent fix
SELECT '=== PERMANENT FIX OPTIONS ===' as step;
SELECT 
  '1. DISABLE EMAIL CONFIRMATION (Easiest for testing):' as option_1,
  '   Supabase Dashboard > Authentication > Providers > Email > Turn OFF "Confirm email"' as option_1_how,
  '' as blank_1,
  '2. AUTO-CONFIRM IN CODE (Best for production):' as option_2,  
  '   After signUp, use auth.admin.updateUserById to set email_confirmed_at' as option_2_how,
  '' as blank_2,
  '3. HANDLE CONFIRMATION FLOW (Most secure):' as option_3,
  '   Show "Check your email" message and wait for user to confirm' as option_3_how,
  '' as blank_3,
  '4. FOR INVITED USERS ONLY (Recommended):' as option_4,
  '   Auto-confirm emails only for users who were invited (they are pre-verified)' as option_4_how;