-- ============================================================================
-- COMPLETE FIX FOR DELIVERABLE STATUS ISSUES
-- ============================================================================
-- This script fixes all remaining issues with deliverable status updates
-- ============================================================================

-- STEP 1: Fix iteration_history JSONB fields containing old status values
UPDATE deliverables
SET iteration_history = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'iteration', COALESCE((elem->>'iteration')::int, 0),
            'status', CASE 
                WHEN elem->>'status' = 'pending_approval' THEN 'submitted'
                WHEN elem->>'status' = 'draft' THEN 'not_started'
                WHEN elem->>'status' = 'wip' THEN 'in_progress'
                ELSE elem->>'status'
            END,
            'date', elem->>'date',
            'feedback', elem->>'feedback',
            'user', elem->>'user'
        )
    )
    FROM jsonb_array_elements(COALESCE(iteration_history, '[]'::jsonb)) AS elem
)
WHERE iteration_history IS NOT NULL 
  AND iteration_history::text LIKE ANY(ARRAY['%pending_approval%', '%draft%', '%wip%']);

-- Show how many records were updated
SELECT 'Updated iteration_history for ' || COUNT(*) || ' deliverables' as result
FROM deliverables
WHERE iteration_history IS NOT NULL 
  AND iteration_history::text LIKE ANY(ARRAY['%pending_approval%', '%draft%', '%wip%']);

-- STEP 2: Fix feedback field if it contains old status values (unlikely but check)
UPDATE deliverables
SET feedback = REPLACE(
    REPLACE(
        REPLACE(feedback, 'pending_approval', 'submitted'),
        'draft', 'not_started'
    ),
    'wip', 'in_progress'
)
WHERE feedback LIKE '%pending_approval%' 
   OR feedback LIKE '%draft%' 
   OR feedback LIKE '%wip%';

-- STEP 3: Alter version_number column to allow longer values
ALTER TABLE deliverable_versions 
ALTER COLUMN version_number TYPE VARCHAR(50);

-- STEP 4: Verify the changes
SELECT 'Version number column updated to VARCHAR(50)' as status;

-- STEP 5: Double-check all deliverables have valid status values
SELECT status::text, COUNT(*) as count
FROM deliverables
GROUP BY status::text
ORDER BY count DESC;

-- STEP 6: Check if any iteration_history still contains old values
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: No iteration_history contains old status values'
        ELSE 'WARNING: ' || COUNT(*) || ' records still contain old values'
    END as check_result
FROM deliverables
WHERE iteration_history IS NOT NULL 
  AND (iteration_history::text LIKE '%pending_approval%'
       OR iteration_history::text LIKE '%draft%'
       OR iteration_history::text LIKE '%wip%');

-- STEP 7: Show sample of fixed data
SELECT 
    id,
    name,
    status::text as status,
    CASE 
        WHEN iteration_history IS NULL THEN 'NULL'
        ELSE LEFT(iteration_history::text, 100) || '...'
    END as iteration_history_preview
FROM deliverables
LIMIT 5;