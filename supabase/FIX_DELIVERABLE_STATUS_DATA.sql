-- ============================================================================
-- FIX DELIVERABLE STATUS DATA
-- ============================================================================
-- This fixes the actual data in the database that has invalid enum values
-- ============================================================================

-- STEP 1: Check current status of the problematic deliverable
SELECT id, name, status::text as current_status
FROM deliverables 
WHERE id = 'bc1e0b0b-a158-4c3d-8183-28521a86a75d';

-- STEP 2: Check how many deliverables have old status values
SELECT status::text, COUNT(*) as count
FROM deliverables
WHERE status::text IN ('pending_approval', 'draft', 'wip')
GROUP BY status::text;

-- STEP 3: Fix ALL deliverables with old enum values
UPDATE deliverables
SET status = CASE
    WHEN status::text = 'pending_approval' THEN 'submitted'::deliverable_status
    WHEN status::text = 'draft' THEN 'not_started'::deliverable_status  
    WHEN status::text = 'wip' THEN 'in_progress'::deliverable_status
    ELSE status
END
WHERE status::text IN ('pending_approval', 'draft', 'wip');

-- STEP 4: Check how many deliverable_versions have old status values
SELECT status::text, COUNT(*) as count
FROM deliverable_versions
WHERE status::text IN ('pending_approval', 'draft', 'wip')
GROUP BY status::text;

-- STEP 5: Fix ALL deliverable_versions with old enum values
UPDATE deliverable_versions
SET status = CASE
    WHEN status::text = 'pending_approval' THEN 'submitted'::deliverable_status
    WHEN status::text = 'draft' THEN 'not_started'::deliverable_status
    WHEN status::text = 'wip' THEN 'in_progress'::deliverable_status
    ELSE status
END
WHERE status::text IN ('pending_approval', 'draft', 'wip');

-- STEP 6: Verify the fix - check deliverables
SELECT status::text, COUNT(*) as count
FROM deliverables
GROUP BY status::text
ORDER BY status::text;

-- STEP 7: Verify the fix - check deliverable_versions
SELECT status::text, COUNT(*) as count
FROM deliverable_versions
GROUP BY status::text
ORDER BY status::text;

-- STEP 8: Specifically check our problematic deliverable
SELECT id, name, status::text as current_status
FROM deliverables 
WHERE id = 'bc1e0b0b-a158-4c3d-8183-28521a86a75d';

-- ============================================================================
-- EXPECTED RESULT:
-- All deliverables and deliverable_versions should now only have:
-- 'not_started', 'in_progress', 'submitted', 'approved', 'declined'
-- ============================================================================