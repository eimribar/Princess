-- ============================================================================
-- FIX FOR 400 ERROR: Add 'wip' to deliverable_status enum
-- ============================================================================
-- 
-- HOW TO RUN THIS IN SUPABASE:
-- 1. Go to your Supabase dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Create a new query
-- 4. Copy and paste EACH SECTION SEPARATELY and run them one by one
-- 5. Run Section 1 first, then Section 2
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: Run this FIRST and click "Run"
-- ============================================================================

-- Check if 'wip' already exists in the enum
SELECT 
    EXISTS(
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'wip' 
        AND enumtypid = 'deliverable_status'::regtype
    ) as wip_exists;

-- Add 'wip' to the enum (only if it doesn't exist)
-- This must be in its own transaction
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'wip' AFTER 'draft';

-- ============================================================================
-- SECTION 2: Run this SECOND (after Section 1 completes)
-- ============================================================================

-- Verify the enum now contains 'wip'
SELECT unnest(enum_range(NULL::deliverable_status)) AS deliverable_status_values
ORDER BY 1;

-- Test that we can now use 'wip' value
-- This should return 'wip' without error
SELECT 'wip'::deliverable_status as test_wip_value;

-- ============================================================================
-- EXPECTED OUTPUT after both sections:
-- 
-- deliverable_status_values:
-- - approved
-- - declined  
-- - draft
-- - pending_approval
-- - submitted
-- - wip        <-- This should now appear
-- ============================================================================

-- ============================================================================
-- ALTERNATIVE: If the above doesn't work, try this WORKAROUND
-- ============================================================================
-- 
-- If you still get errors, you may need to:
-- 1. Create a new migration in Supabase Dashboard under "Database" > "Migrations"
-- 2. Add this single line:
--    ALTER TYPE deliverable_status ADD VALUE 'wip' AFTER 'draft';
-- 3. Run the migration
-- 
-- OR use this workaround to update deliverables table to accept text temporarily:
-- 
-- ALTER TABLE deliverables 
-- ALTER COLUMN status TYPE text;
-- 
-- Then after some time, convert back:
-- ALTER TABLE deliverables 
-- ALTER COLUMN status TYPE deliverable_status 
-- USING status::deliverable_status;
-- ============================================================================