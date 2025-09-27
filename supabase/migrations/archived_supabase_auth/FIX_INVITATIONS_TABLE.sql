-- ============================================================
-- FIX INVITATIONS TABLE - ADD MISSING COLUMNS
-- ============================================================

-- Add updated_at column if it doesn't exist
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add accepted_by column if it doesn't exist
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS accepted_by UUID;

-- Now run the direct user creation function again
-- It should work with the updated table structure

-- Show current invitations table structure
SELECT '=== INVITATIONS TABLE STRUCTURE ===' as title;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- Test that we can now update invitations
UPDATE invitations 
SET updated_at = NOW()
WHERE email = 'directtest@example.com';

SELECT '✅ Invitations table fixed! You can now run DIRECT_USER_CREATION.sql' as status;