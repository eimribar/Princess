-- ============================================================================
-- URGENT: RUN THIS MIGRATION TO FIX 400 ERROR WHEN UPDATING DELIVERABLE STATUS
-- ============================================================================
-- 
-- HOW TO RUN THIS:
-- 1. Go to your Supabase dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Create a new query
-- 4. Copy and paste this entire script
-- 5. Click "Run" button
--
-- This will fix the 400 error you're getting when trying to update
-- deliverable status to "Work in Progress"
-- ============================================================================

-- Check current enum values (for verification)
SELECT unnest(enum_range(NULL::deliverable_status)) AS current_values;

-- Add 'wip' (Work in Progress) to the deliverable_status enum
-- This is the missing status that's causing the 400 error
DO $$
BEGIN
    -- Check if 'wip' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'wip' 
        AND enumtypid = 'deliverable_status'::regtype
    ) THEN
        -- Add 'wip' after 'draft' in the enum
        ALTER TYPE deliverable_status ADD VALUE 'wip' AFTER 'draft';
        RAISE NOTICE 'Successfully added "wip" to deliverable_status enum';
    ELSE
        RAISE NOTICE '"wip" already exists in deliverable_status enum';
    END IF;
END $$;

-- Verify the enum now contains 'wip'
SELECT unnest(enum_range(NULL::deliverable_status)) AS updated_values;

-- ============================================================================
-- EXPECTED OUTPUT:
-- Before: draft, submitted, pending_approval, approved, declined
-- After:  draft, wip, submitted, pending_approval, approved, declined
-- ============================================================================