-- ============================================================
-- FIX EXISTING USERS CREATED BY inviteUserByEmail
-- ============================================================
-- This script fixes users who were created without passwords
-- and confirms their emails so they can sign in
-- ============================================================

-- 1. Identify broken users (created by inviteUserByEmail without passwords)
SELECT '=== IDENTIFYING BROKEN USERS ===' as step;
SELECT 
  id,
  email,
  created_at,
  CASE 
    WHEN encrypted_password IS NULL OR encrypted_password = '' THEN '❌ NO PASSWORD - Cannot sign in'
    ELSE '✅ Has password'
  END as password_status,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email not confirmed'
    ELSE '✅ Email confirmed'
  END as email_status,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '❌ Never signed in'
    ELSE '✅ Has signed in before'
  END as signin_status
FROM auth.users
WHERE (encrypted_password IS NULL OR encrypted_password = '')
   OR email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. Fix email confirmation for ALL users (safe operation)
SELECT '=== CONFIRMING ALL EMAILS ===' as step;
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL
RETURNING 
  email,
  '✅ Email confirmed' as status;

-- 3. Delete orphaned auth users without passwords (CAREFUL!)
-- These are users created by inviteUserByEmail that can't sign in
-- They should re-register with the invitation link
SELECT '=== CLEANING UP BROKEN USERS ===' as step;
WITH broken_users AS (
  SELECT id, email
  FROM auth.users
  WHERE (encrypted_password IS NULL OR encrypted_password = '')
    AND last_sign_in_at IS NULL  -- Never successfully signed in
    AND created_at < NOW() - INTERVAL '1 hour'  -- Not just created
)
SELECT 
  email,
  '⚠️ Cannot be fixed - user must re-register with invitation' as status
FROM broken_users;

-- NOTE: To actually delete broken users, uncomment below
-- DELETE FROM auth.users
-- WHERE (encrypted_password IS NULL OR encrypted_password = '')
--   AND last_sign_in_at IS NULL
--   AND created_at < NOW() - INTERVAL '1 hour';

-- 4. Check current invitations
SELECT '=== ACTIVE INVITATIONS ===' as step;
SELECT 
  email,
  status,
  CASE 
    WHEN expires_at < NOW() THEN '❌ Expired'
    ELSE '✅ Valid until ' || to_char(expires_at, 'MM/DD HH24:MI')
  END as validity,
  'http://localhost:5174/welcome/' || token as invitation_link
FROM invitations
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Regenerate invitations for broken users
SELECT '=== REGENERATING INVITATIONS FOR BROKEN USERS ===' as step;
WITH broken_user_emails AS (
  SELECT DISTINCT email
  FROM auth.users
  WHERE (encrypted_password IS NULL OR encrypted_password = '')
    AND last_sign_in_at IS NULL
)
INSERT INTO invitations (email, role, organization_id, token, status, expires_at)
SELECT 
  email,
  'client',  -- Default role
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Default org
  encode(gen_random_bytes(32), 'hex'),
  'pending',
  NOW() + INTERVAL '7 days'
FROM broken_user_emails
WHERE NOT EXISTS (
  SELECT 1 FROM invitations i 
  WHERE i.email = broken_user_emails.email 
    AND i.status = 'pending'
    AND i.expires_at > NOW()
)
RETURNING 
  email,
  'http://localhost:5174/welcome/' || token as new_invitation_link;

-- 6. Summary
SELECT '=== SUMMARY ===' as step;
SELECT 
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  (SELECT COUNT(*) FROM auth.users WHERE encrypted_password IS NULL OR encrypted_password = '') as users_without_passwords,
  (SELECT COUNT(*) FROM invitations WHERE status = 'pending' AND expires_at > NOW()) as active_invitations,
  (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at IS NOT NULL) as users_who_have_signed_in;

-- 7. Instructions
SELECT '=== NEXT STEPS ===' as step;
SELECT 
  '1. Users WITHOUT passwords must use their invitation link to set a password' as step_1,
  '2. All emails have been confirmed so users WITH passwords can sign in' as step_2,
  '3. Share the new invitation links with affected users' as step_3,
  '4. Consider deleting broken auth users to force clean re-registration' as step_4;