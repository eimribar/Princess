-- Fix invitations table foreign key reference
-- This fixes the issue with users!invitations_invited_by_fkey

-- First, check if the foreign key constraint exists with the wrong name
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'invitations_invited_by_fkey'
    ) THEN
        ALTER TABLE invitations DROP CONSTRAINT invitations_invited_by_fkey;
    END IF;

    -- Add the correct foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'invitations_invited_by_users_fkey'
    ) THEN
        ALTER TABLE invitations 
        ADD CONSTRAINT invitations_invited_by_users_fkey 
        FOREIGN KEY (invited_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Update the Welcome page query to use proper join syntax
-- Note: The application code needs to be updated to use:
-- LEFT JOIN users ON invitations.invited_by = users.id
-- Instead of the foreign key notation

-- Verify the structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'invitations'
ORDER BY ordinal_position;