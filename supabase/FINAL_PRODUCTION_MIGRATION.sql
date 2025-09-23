-- ============================================================================
-- PRODUCTION-READY MIGRATION: Standardize Deliverable Status Enum
-- ============================================================================
-- Author: Princess Platform Team
-- Date: 2024-12-23
-- Purpose: Establish the 5 standard deliverable statuses for production
-- 
-- Required Statuses:
-- 1. not_started - Deliverable has not been started
-- 2. wip - Work in Progress
-- 3. submitted - Submitted for approval (pending client review)
-- 4. approved - Client approved
-- 5. declined - Client declined, needs revision
-- ============================================================================

-- IMPORTANT: Run these commands ONE AT A TIME in Supabase SQL Editor
-- Each ALTER TYPE must be in its own transaction

-- ============================================================================
-- STEP 1: Add missing enum values
-- ============================================================================

-- Add 'not_started' as the first value (before 'draft')
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'not_started' BEFORE 'draft';

-- ============================================================================
-- STEP 2: Add 'wip' after draft
-- ============================================================================

-- Add 'wip' (Work in Progress) after 'draft'
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'wip' AFTER 'draft';

-- ============================================================================
-- STEP 3: Verify the enum now has all required values
-- ============================================================================

-- This should show: not_started, draft, wip, submitted, pending_approval, approved, declined
SELECT unnest(enum_range(NULL::deliverable_status)) AS status_values
ORDER BY 1;

-- ============================================================================
-- STEP 4: Migrate existing data to use standard values
-- ============================================================================

-- Update any 'draft' deliverables to 'not_started' (more accurate naming)
UPDATE deliverables 
SET status = 'not_started' 
WHERE status = 'draft';

-- Update any 'pending_approval' to 'submitted' (simpler, clearer)
UPDATE deliverables 
SET status = 'submitted' 
WHERE status = 'pending_approval';

-- ============================================================================
-- STEP 5: Verify data migration
-- ============================================================================

-- Check the distribution of statuses after migration
SELECT status, COUNT(*) as count 
FROM deliverables 
GROUP BY status 
ORDER BY status;

-- ============================================================================
-- EXPECTED FINAL STATE:
-- 
-- Enum values in order:
-- 1. not_started (new)
-- 2. draft (legacy - no longer used)
-- 3. wip (new)
-- 4. submitted (active)
-- 5. pending_approval (legacy - no longer used)
-- 6. approved (active)
-- 7. declined (active)
--
-- Active values used by application:
-- - not_started
-- - wip  
-- - submitted
-- - approved
-- - declined
--
-- Note: We keep draft and pending_approval in the enum for backwards compatibility
-- but the application will only use the 5 standard statuses
-- ============================================================================

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed):
-- 
-- Unfortunately, PostgreSQL doesn't allow removing enum values.
-- If you need to rollback:
-- 1. Update deliverables back: 
--    UPDATE deliverables SET status = 'draft' WHERE status = 'not_started';
--    UPDATE deliverables SET status = 'pending_approval' WHERE status = 'submitted';
-- 2. The enum values will remain but won't be used
-- ============================================================================