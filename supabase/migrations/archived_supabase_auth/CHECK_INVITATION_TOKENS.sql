-- ============================================================
-- CHECK INVITATION TOKENS
-- ============================================================

-- Check all invitations for frost_persimmon
SELECT '=== ALL INVITATIONS FOR frost_persimmon@proton.me ===' as check;
SELECT 
    id,
    email,
    status,
    token,
    LENGTH(token) as token_length,
    expires_at,
    created_at,
    SUBSTRING(token, 1, 20) as token_prefix
FROM invitations
WHERE email = 'frost_persimmon@proton.me'
ORDER BY created_at DESC;

-- Check if the token from the error exists
SELECT '=== CHECKING TOKEN FROM ERROR ===' as check;
SELECT 
    id,
    email,
    status,
    expires_at
FROM invitations
WHERE token = 'ce0a68b08e6fb1bfc6f6848577e291305f6c46eec7dc139343f691fe20037f4f';

-- Check current valid invitation links
SELECT '=== CURRENT VALID INVITATION LINKS ===' as status;
SELECT 
    email,
    status,
    token,
    'http://localhost:5174/welcome/' || token as invitation_link,
    expires_at
FROM invitations
WHERE email IN ('frost_persimmon@proton.me', 'lattice_marmot@proton.me', 'eimrib@pm.me')
  AND status = 'pending'
ORDER BY email, created_at DESC;

-- Check for any duplicate tokens
SELECT '=== CHECKING FOR DUPLICATE TOKENS ===' as check;
SELECT 
    token,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM invitations
GROUP BY token
HAVING COUNT(*) > 1;