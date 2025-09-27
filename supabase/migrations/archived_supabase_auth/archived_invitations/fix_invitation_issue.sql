-- Debug and Fix Invitation Issues
-- Run this in Supabase SQL Editor to diagnose invitation problems

-- 1. Check if invitations table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'invitations'
) as invitations_table_exists;

-- 2. Check for existing invitations for the email
SELECT 
  id,
  email,
  status,
  created_at,
  expires_at,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    ELSE 'VALID'
  END as validity
FROM invitations 
WHERE email = 'eimribar@gmail.com'
ORDER BY created_at DESC;

-- 3. Check if create_invitation function exists
SELECT 
  proname as function_name,
  pronargs as num_arguments
FROM pg_proc 
WHERE proname = 'create_invitation';

-- 4. Clean up old/expired invitations for this email
-- Uncomment to run:
-- DELETE FROM invitations 
-- WHERE email = 'eimribar@gmail.com' 
-- AND (status = 'pending' OR expires_at < NOW());

-- 5. Test creating an invitation directly
-- Uncomment to test:
-- SELECT create_invitation(
--   'eimribar@gmail.com',
--   'client'::user_role,
--   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, -- default org
--   NULL,
--   '{}'::jsonb
-- );

-- 6. Check for any unique constraint violations
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'invitations'::regclass
AND contype = 'u';

-- 7. View recent invitation attempts (last 10)
SELECT 
  id,
  email,
  role,
  status,
  created_at,
  expires_at
FROM invitations
ORDER BY created_at DESC
LIMIT 10;