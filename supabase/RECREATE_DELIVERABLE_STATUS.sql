-- ============================================================================
-- COMPLETE ENUM RECREATION: Set Your 5 Deliverable Statuses
-- ============================================================================
-- This will give you EXACTLY these 5 statuses:
-- 1. not_started - Not started
-- 2. in_progress - In progress  
-- 3. submitted - Submitted for approval
-- 4. approved - Approved
-- 5. declined - Declined
-- ============================================================================

-- STEP 1: Check current values (for reference)
SELECT DISTINCT status, COUNT(*) 
FROM deliverables 
GROUP BY status
ORDER BY status;

-- STEP 2: Convert column to TEXT temporarily
-- This removes the enum constraint
ALTER TABLE deliverables 
ALTER COLUMN status TYPE TEXT;

-- STEP 3: Update existing values to match new enum
UPDATE deliverables 
SET status = CASE
  WHEN status = 'draft' THEN 'not_started'
  WHEN status = 'pending_approval' THEN 'in_progress'
  WHEN status = 'wip' THEN 'in_progress'
  WHEN status = 'submitted' THEN 'submitted'
  WHEN status = 'approved' THEN 'approved'
  WHEN status = 'declined' THEN 'declined'
  ELSE 'not_started' -- Default fallback
END;

-- STEP 4: Drop the old enum type
DROP TYPE IF EXISTS deliverable_status CASCADE;

-- STEP 5: Create new enum with your exact 5 values
CREATE TYPE deliverable_status AS ENUM (
  'not_started',
  'in_progress', 
  'submitted',
  'approved',
  'declined'
);

-- STEP 6: Convert column back to enum
ALTER TABLE deliverables 
ALTER COLUMN status TYPE deliverable_status 
USING status::deliverable_status;

-- STEP 7: Set default value for new deliverables
ALTER TABLE deliverables 
ALTER COLUMN status SET DEFAULT 'not_started';

-- STEP 8: Add NOT NULL constraint if needed
ALTER TABLE deliverables 
ALTER COLUMN status SET NOT NULL;

-- STEP 9: Verify the new enum values
SELECT unnest(enum_range(NULL::deliverable_status)) AS deliverable_statuses
ORDER BY 1;

-- STEP 10: Check updated data
SELECT status, COUNT(*) 
FROM deliverables 
GROUP BY status
ORDER BY status;

-- ============================================================================
-- EXPECTED RESULT:
-- Your database now has EXACTLY these 5 status values:
-- - not_started
-- - in_progress
-- - submitted
-- - approved
-- - declined
--
-- All existing data has been properly migrated.
-- ============================================================================