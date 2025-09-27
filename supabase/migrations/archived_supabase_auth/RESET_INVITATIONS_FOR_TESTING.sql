-- ============================================================
-- RESET INVITATIONS FOR TESTING
-- ============================================================
-- This script resets invitations to pending status for testing
-- ============================================================

-- Show current invitation status
SELECT '=== CURRENT INVITATION STATUS ===' as status;
SELECT 
    email,
    role,
    status,
    token,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        ELSE 'VALID'
    END as validity,
    created_at
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY created_at DESC;

-- Reset invitations to pending and extend expiration
UPDATE invitations
SET 
    status = 'pending',
    expires_at = NOW() + INTERVAL '7 days'
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
RETURNING email, status, expires_at;

-- Show updated status
SELECT '=== UPDATED INVITATION STATUS ===' as status;
SELECT 
    email,
    role,
    status,
    token,
    expires_at,
    'Ready for testing' as note
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY created_at DESC;

-- Show invitation links for easy testing
SELECT '=== TEST LINKS ===' as links;
SELECT 
    email,
    'http://localhost:5174/welcome/' || token as invitation_link
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
ORDER BY email;