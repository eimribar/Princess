-- ============================================================================
-- WORKING SOLUTION FOR DELIVERABLE STATUS ENUM
-- ============================================================================
-- 
-- PostgreSQL requires enum values to be committed before use.
-- Supabase SQL Editor wraps everything in a transaction, causing the error.
-- 
-- SOLUTION: Run these steps in the EXACT order shown
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT ENUM VALUES
-- Run this FIRST to see what values currently exist
-- ============================================================================
SELECT unnest(enum_range(NULL::deliverable_status)) AS current_status_values
ORDER BY 1;

-- ============================================================================
-- STEP 2: ADD ENUM VALUES
-- Run EACH LINE SEPARATELY - Click "Run" after each one!
-- ============================================================================

-- Run this line and click "Run":
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'not_started' BEFORE 'draft';

-- Then run this line and click "Run":
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'wip' AFTER 'draft';

-- ============================================================================
-- STEP 3: VERIFY ENUM VALUES WERE ADDED
-- Run this to confirm both values were added
-- ============================================================================
SELECT unnest(enum_range(NULL::deliverable_status)) AS updated_status_values
ORDER BY 1;

-- You should now see: not_started, draft, wip, submitted, pending_approval, approved, declined

-- ============================================================================
-- STEP 4: UPDATE EXISTING DATA (OPTIONAL)
-- Only run if you have existing deliverables with old statuses
-- ============================================================================

-- First check what statuses are currently in use:
SELECT status, COUNT(*) as count 
FROM deliverables 
GROUP BY status 
ORDER BY status;

-- If you have 'draft' records, update them to 'not_started':
UPDATE deliverables 
SET status = 'not_started' 
WHERE status = 'draft';

-- If you have 'pending_approval' records, update them to 'submitted':
UPDATE deliverables 
SET status = 'submitted' 
WHERE status = 'pending_approval';

-- ============================================================================
-- ALTERNATIVE SOLUTION IF ABOVE DOESN'T WORK:
-- Use Supabase Migration Feature
-- ============================================================================
-- 
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Database → Migrations
-- 3. Click "Create a new migration"
-- 4. Name it: "add_deliverable_statuses"
-- 5. Add this SQL:
--
-- ALTER TYPE deliverable_status ADD VALUE 'not_started' BEFORE 'draft';
-- ALTER TYPE deliverable_status ADD VALUE 'wip' AFTER 'draft';
--
-- 6. Run the migration
-- 
-- This runs outside of a transaction and will work properly.
-- ============================================================================

-- ============================================================================
-- NUCLEAR OPTION: Recreate the Table (Last Resort)
-- Only use if nothing else works
-- ============================================================================
-- 
-- -- Step 1: Create temporary column
-- ALTER TABLE deliverables ADD COLUMN status_temp TEXT;
-- 
-- -- Step 2: Copy data
-- UPDATE deliverables SET status_temp = status::TEXT;
-- 
-- -- Step 3: Drop the enum column
-- ALTER TABLE deliverables DROP COLUMN status;
-- 
-- -- Step 4: Recreate with new enum
-- DROP TYPE IF EXISTS deliverable_status CASCADE;
-- CREATE TYPE deliverable_status AS ENUM ('not_started', 'wip', 'submitted', 'approved', 'declined');
-- 
-- -- Step 5: Add column back
-- ALTER TABLE deliverables ADD COLUMN status deliverable_status;
-- 
-- -- Step 6: Restore data with mapping
-- UPDATE deliverables 
-- SET status = CASE 
--   WHEN status_temp = 'draft' THEN 'not_started'::deliverable_status
--   WHEN status_temp = 'pending_approval' THEN 'submitted'::deliverable_status
--   WHEN status_temp IN ('not_started', 'wip', 'submitted', 'approved', 'declined') 
--     THEN status_temp::deliverable_status
--   ELSE 'not_started'::deliverable_status
-- END;
-- 
-- -- Step 7: Drop temp column
-- ALTER TABLE deliverables DROP COLUMN status_temp;
-- ============================================================================