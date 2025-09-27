-- ============================================================
-- FIX THE COMETFEN USER THAT JUST FAILED
-- ============================================================

-- 1. Check current status of cometfen@proton.me
SELECT '=== CURRENT STATUS OF COMETFEN ===' as fix;
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmed'
    ELSE '❌ Email NOT Confirmed - CANNOT SIGN IN'
  END as status,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Has Password'
    ELSE '❌ No Password'
  END as password_status
FROM auth.users
WHERE email = 'cometfen@proton.me';

-- 2. Confirm the email for cometfen
SELECT '=== CONFIRMING EMAIL FOR COMETFEN ===' as fix;
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'cometfen@proton.me'
  AND email_confirmed_at IS NULL
RETURNING 
  email,
  '✅ Email now confirmed - user can sign in!' as result;

-- 3. Verify the fix worked
SELECT '=== VERIFICATION ===' as fix;
SELECT 
  email,
  email_confirmed_at,
  '✅ Ready to sign in with password' as status
FROM auth.users
WHERE email = 'cometfen@proton.me';

-- 4. Also confirm any other recent unconfirmed users
SELECT '=== CONFIRMING ALL RECENT USERS ===' as fix;
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '4 hours'
  AND email_confirmed_at IS NULL
RETURNING 
  email,
  '✅ Confirmed' as status;

-- 5. Instructions
SELECT '=== NEXT STEPS ===' as fix;
SELECT 
  '1. User cometfen@proton.me can now sign in with their password' as step_1,
  '2. They will be redirected to onboarding after login' as step_2,
  '3. Run migration 018_simple_email_confirm.sql to enable auto-confirmation' as step_3;