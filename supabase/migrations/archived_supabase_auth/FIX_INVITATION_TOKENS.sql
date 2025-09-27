-- ============================================================
-- FIX INVITATION TOKENS - COMPLETE SOLUTION
-- ============================================================
-- This script diagnoses and fixes all invitation token issues
-- ============================================================

-- 1. Check current invitation status for all test users
SELECT '=== CURRENT INVITATION STATUS ===' as step;
SELECT 
    email,
    role,
    status,
    SUBSTRING(token, 1, 10) || '...' as token_preview,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        ELSE 'VALID'
    END as validity,
    expires_at,
    created_at
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY email, created_at DESC;

-- 2. Check if the problematic token exists
SELECT '=== CHECKING PROBLEMATIC TOKEN ===' as step;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Token EXISTS in database'
        ELSE 'Token NOT FOUND - User has old/invalid link'
    END as diagnosis
FROM invitations
WHERE token = 'ce0a68b08e6fb1bfc6f6848577e291305f6c46eec7dc139343f691fe20037f4f';

-- 3. Delete any old/duplicate invitations (keep only the most recent)
DELETE FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND id NOT IN (
    SELECT DISTINCT ON (email) id
    FROM invitations
    WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
    ORDER BY email, created_at DESC
  );

-- 4. Reset the remaining invitations to pending with new expiration
UPDATE invitations
SET 
    status = 'pending',
    expires_at = NOW() + INTERVAL '7 days'
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
RETURNING email, status, expires_at;

-- 5. If frost_persimmon has no invitation, create a new one
INSERT INTO invitations (email, role, status, token, expires_at, created_at)
SELECT 
    'frost_persimmon@proton.me',
    'client',
    'pending',
    REPLACE(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), -- Generate new token without dashes
    NOW() + INTERVAL '7 days',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM invitations WHERE email = 'frost_persimmon@proton.me'
)
RETURNING email, 'CREATED NEW INVITATION' as action;

-- 6. Show the final valid invitation links
SELECT '=== VALID INVITATION LINKS TO USE ===' as step;
SELECT 
    email,
    role,
    status,
    'http://localhost:5174/welcome/' || token as invitation_link,
    expires_at
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND status = 'pending'
ORDER BY email;

-- 7. Summary of fixes applied
SELECT '=== SUMMARY ===' as step;
SELECT 
    COUNT(*) as total_invitations,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invitations,
    SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as valid_invitations,
    'All invitations reset and ready for testing' as status
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me');