-- ============================================================================
-- ADD MISSING STATUS COLUMN TO DELIVERABLE_VERSIONS TABLE
-- ============================================================================
-- This script adds the missing status column to deliverable_versions table
-- ============================================================================

-- STEP 1: Add the status column to deliverable_versions table
ALTER TABLE deliverable_versions 
ADD COLUMN IF NOT EXISTS status deliverable_status DEFAULT 'not_started';

-- STEP 2: Set initial status values based on existing data
UPDATE deliverable_versions
SET status = CASE
    -- If it has been approved
    WHEN approved_date IS NOT NULL AND approved_by IS NOT NULL THEN 'approved'::deliverable_status
    -- If it has been declined
    WHEN declined_date IS NOT NULL AND declined_by IS NOT NULL THEN 'declined'::deliverable_status
    -- If it has been submitted
    WHEN submitted_date IS NOT NULL AND submitted_by IS NOT NULL THEN 'submitted'::deliverable_status
    -- Default to not_started
    ELSE 'not_started'::deliverable_status
END
WHERE status IS NULL OR status = 'not_started'::deliverable_status;

-- STEP 3: Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deliverable_versions' 
  AND column_name = 'status'
  AND table_schema = 'public';

-- STEP 4: Show distribution of status values in the new column
SELECT 
    'deliverable_versions status distribution' as info,
    status::text as status_value, 
    COUNT(*) as count
FROM deliverable_versions
GROUP BY status::text
ORDER BY count DESC;

-- STEP 5: Now fix any old status values in the deliverables table
UPDATE deliverables
SET status = CASE
    WHEN status::text = 'pending_approval' THEN 'submitted'::deliverable_status
    WHEN status::text = 'draft' THEN 'not_started'::deliverable_status  
    WHEN status::text = 'wip' THEN 'in_progress'::deliverable_status
    ELSE status
END
WHERE status::text IN ('pending_approval', 'draft', 'wip');

-- STEP 6: Show final status distribution in deliverables
SELECT 
    'deliverables status distribution' as info,
    status::text as status_value, 
    COUNT(*) as count
FROM deliverables
GROUP BY status::text
ORDER BY count DESC;

-- STEP 7: Verify everything looks good
SELECT 'Migration complete!' as status;
SELECT 'Deliverables with versions:' as info;
SELECT 
    d.id,
    d.name,
    d.status as deliverable_status,
    COUNT(v.id) as version_count,
    STRING_AGG(v.status::text, ', ' ORDER BY v.created_at) as version_statuses
FROM deliverables d
LEFT JOIN deliverable_versions v ON d.id = v.deliverable_id
GROUP BY d.id, d.name, d.status
LIMIT 10;