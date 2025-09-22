-- Migration to add post_launch to stage_category enum
-- This fixes the issue where stages 81-104 fail to insert

-- First check if post_launch already exists in the enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'post_launch'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stage_category')
    ) THEN
        ALTER TYPE stage_category ADD VALUE 'post_launch';
        RAISE NOTICE 'Added post_launch to stage_category enum';
    ELSE
        RAISE NOTICE 'post_launch already exists in stage_category enum';
    END IF;
END $$;

-- Display all valid stage categories
SELECT enumlabel as valid_stage_categories
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stage_category')
ORDER BY enumsortorder;