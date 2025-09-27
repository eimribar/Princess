-- ============================================================
-- COMPREHENSIVE AUTH DIAGNOSIS
-- ============================================================
-- Run this to understand exactly what's happening with auth
-- ============================================================

-- 1. Check ALL auth users and their confirmation status
SELECT '=== ALL AUTH USERS WITH CONFIRMATION STATUS ===' as diagnostic;
SELECT 
  id,
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ EMAIL CONFIRMED'
    ELSE '❌ EMAIL NOT CONFIRMED'
  END as email_status,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ HAS PASSWORD'
    ELSE '❌ NO PASSWORD'
  END as password_status,
  created_at,
  confirmed_at,
  email_confirmed_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NOT NULL THEN '✅ HAS SIGNED IN'
    ELSE '❌ NEVER SIGNED IN'
  END as signin_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check recently created user (Johnss777@proton.me)
SELECT '=== RECENT TEST USER STATUS ===' as diagnostic;
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  encrypted_password IS NOT NULL as has_password,
  raw_user_meta_data,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'Johnss777@proton.me'
OR email LIKE '%johnss%'
OR created_at > NOW() - INTERVAL '1 hour';

-- 3. Check if email confirmation is blocking sign-ins
SELECT '=== UNCONFIRMED USERS WHO CANNOT SIGN IN ===' as diagnostic;
SELECT 
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ BLOCKED - Email not confirmed'
    ELSE '✅ Can sign in'
  END as signin_ability,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_since_creation
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 4. Check invitation status for recent users
SELECT '=== INVITATION STATUS FOR RECENT SIGNUPS ===' as diagnostic;
SELECT 
  i.email,
  i.token,
  i.status as invitation_status,
  i.accepted_at,
  au.email_confirmed_at,
  au.created_at as user_created_at,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ User exists but email not confirmed'
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ User confirmed and ready'
    WHEN au.id IS NULL THEN '❌ No auth user created'
  END as user_status
FROM invitations i
LEFT JOIN auth.users au ON i.email = au.email
WHERE i.created_at > NOW() - INTERVAL '24 hours'
ORDER BY i.created_at DESC;

-- 5. Fix unconfirmed emails (MANUAL CONFIRMATION)
SELECT '=== TO MANUALLY CONFIRM EMAILS, RUN THIS ===' as diagnostic;
SELECT 
  'UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = ''' || email || ''';' as fix_command
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check your Auth settings
SELECT '=== IMPORTANT: CHECK YOUR SUPABASE SETTINGS ===' as diagnostic;
SELECT 
  'Go to Supabase Dashboard > Authentication > Providers > Email' as step_1,
  'Check if "Confirm email" is ENABLED (toggle ON)' as step_2,
  'If ON, users need email confirmation before signin' as step_3,
  'For testing, you can DISABLE it temporarily' as step_4,
  'Or manually confirm emails using the SQL above' as step_5;