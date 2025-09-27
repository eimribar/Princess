-- ============================================================
-- VERIFY EMAIL CONFIRMATION IS DISABLED
-- ============================================================

-- 1. Check recent users and their confirmation status
SELECT '=== RECENT USERS (LAST HOUR) ===' as check;
SELECT 
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 
      '✅ Confirmed at: ' || to_char(email_confirmed_at, 'HH24:MI:SS')
    ELSE 
      '❌ NOT CONFIRMED'
  END as confirmation_status,
  CASE 
    WHEN email_confirmed_at IS NOT NULL AND 
         email_confirmed_at = created_at THEN 
      '✅ Auto-confirmed (setting is OFF)'
    WHEN email_confirmed_at IS NOT NULL AND 
         email_confirmed_at > created_at THEN 
      '⚠️ Manually confirmed'
    ELSE 
      '❌ Confirmation required (setting is ON)'
  END as email_setting_status
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 2. Quick fix - Confirm ALL unconfirmed users
SELECT '=== CONFIRMING ALL UNCONFIRMED USERS ===' as check;
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL
RETURNING 
  email,
  '✅ Email confirmed - can now sign in' as status;

-- 3. Test if new users are auto-confirmed
SELECT '=== EMAIL CONFIRMATION SETTING STATUS ===' as check;
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      AND email_confirmed_at IS NULL
    ) THEN '⚠️ Email confirmation appears to be ENABLED (users not auto-confirmed)'
    ELSE '✅ Email confirmation appears to be DISABLED (all recent users confirmed)'
  END as setting_status;

-- 4. Instructions
SELECT '=== IF STILL HAVING ISSUES ===' as check;
SELECT 
  '1. Clear your browser cache and cookies' as step_1,
  '2. Try in an incognito/private window' as step_2,
  '3. Wait 5 minutes for settings to propagate' as step_3,
  '4. Try creating a completely new test user' as step_4,
  '5. Check Supabase Dashboard > Auth > Providers > Email > Confirm email is OFF' as step_5;