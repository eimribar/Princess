-- ============================================================
-- VERIFY CURRENT STATE & CREATE TEST INVITATION
-- ============================================================
-- Run this to see the current state and create a test invitation
-- ============================================================

-- 1. Show current test users and their status
SELECT '=== CURRENT TEST USERS STATUS ===' as check;
SELECT 
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ CONFIRMED'
    ELSE '❌ NOT CONFIRMED'
  END as email_status,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ HAS PASSWORD'
    ELSE '❌ NO PASSWORD'
  END as password_status,
  CASE 
    WHEN last_sign_in_at IS NOT NULL THEN 
      '✅ Last login: ' || to_char(last_sign_in_at, 'MM/DD HH24:MI')
    ELSE '❌ NEVER SIGNED IN'
  END as login_status
FROM auth.users
WHERE email IN (
  'frost_persimmon@proton.me',
  'lattice_marmot@proton.me', 
  'eimrib@pm.me',
  'Johnss777@proton.me'
)
OR created_at > NOW() - INTERVAL '4 hours'
ORDER BY created_at DESC;

-- 2. Create a brand new test invitation
SELECT '=== CREATING NEW TEST INVITATION ===' as check;
DELETE FROM invitations WHERE email = 'newtest@example.com';

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
VALUES (
  'newtest@example.com',
  'client'::user_role,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'newtest_' || encode(gen_random_bytes(16), 'hex'),
  'pending',
  NOW() + INTERVAL '7 days',
  NOW(),
  jsonb_build_object('test', true, 'created', NOW()::text)
)
RETURNING 
  email as "Test Email",
  'http://localhost:5174/welcome/' || token as "👉 CLICK THIS LINK TO TEST";

-- 3. Show all active invitations
SELECT '=== ALL ACTIVE INVITATION LINKS ===' as check;
SELECT 
  email,
  'http://localhost:5174/welcome/' || token as invitation_link,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.email = invitations.email
    ) THEN '⚠️ User already exists (will need password reset or use existing password)'
    ELSE '✅ New user (will create account)'
  END as status
FROM invitations
WHERE status = 'pending'
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 5;

-- 4. Quick status check
SELECT '=== SYSTEM STATUS CHECK ===' as check;
SELECT 
  (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours') as "Users created (24h)",
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL) as "Unconfirmed users",
  (SELECT COUNT(*) FROM invitations WHERE status = 'pending' AND expires_at > NOW()) as "Pending invitations",
  (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '1 hour') as "Recent logins (1h)";

-- 5. Testing instructions
SELECT '=== HOW TO TEST THE COMPLETE FLOW ===' as check;
SELECT 
  '1️⃣' as step,
  'Copy the invitation link above for newtest@example.com' as action
UNION ALL SELECT 
  '2️⃣',
  'Open link in incognito/private browser window'
UNION ALL SELECT 
  '3️⃣',
  'Click "Accept Invitation" and set a password'
UNION ALL SELECT 
  '4️⃣',
  'You should go directly to /onboarding (NOT /login)'
UNION ALL SELECT 
  '5️⃣',
  'Complete onboarding and reach dashboard'
UNION ALL SELECT 
  '6️⃣',
  'Log out and try logging back in with same credentials'
ORDER BY 1;

-- 6. If something goes wrong
SELECT '=== TROUBLESHOOTING ===' as check;
SELECT 
  'If redirected to login instead of onboarding:' as issue,
  'Run FIX_EMAIL_CONFIRMATION_CORRECTED.sql to confirm email' as solution
UNION ALL SELECT
  'If login fails after signup:',
  'Check email confirmation setting in Supabase Dashboard'
UNION ALL SELECT
  'If invitation link shows "Invalid":', 
  'Check if invitation expired or already accepted'
ORDER BY 1;