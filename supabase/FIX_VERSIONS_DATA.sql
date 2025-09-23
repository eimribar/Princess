-- ============================================================================
-- FIX EXISTING VERSIONS DATA IN DATABASE
-- ============================================================================
-- The versions column contains JSON with old enum values that need to be fixed
-- ============================================================================

-- First, let's check what we have in the versions column
SELECT id, name, 
       jsonb_array_elements(versions) as version_data
FROM deliverables 
WHERE versions IS NOT NULL
  AND jsonb_array_length(versions) > 0
LIMIT 5;

-- Now update all versions to replace old status values
UPDATE deliverables
SET versions = (
    SELECT jsonb_agg(
        CASE 
            WHEN (elem->>'status') = 'pending_approval' THEN 
                elem || jsonb_build_object('status', 'submitted')
            WHEN (elem->>'status') = 'draft' THEN 
                elem || jsonb_build_object('status', 'not_started')
            WHEN (elem->>'status') = 'wip' THEN 
                elem || jsonb_build_object('status', 'in_progress')
            ELSE elem
        END
    )
    FROM jsonb_array_elements(versions) AS elem
)
WHERE versions IS NOT NULL 
  AND jsonb_array_length(versions) > 0;

-- Verify the fix
SELECT id, name, 
       jsonb_array_elements(versions) as version_data
FROM deliverables 
WHERE versions IS NOT NULL
  AND jsonb_array_length(versions) > 0
LIMIT 5;

-- Count how many records were affected
SELECT COUNT(*) as deliverables_with_versions,
       SUM(jsonb_array_length(versions)) as total_versions
FROM deliverables
WHERE versions IS NOT NULL 
  AND jsonb_array_length(versions) > 0;

-- ============================================================================
-- RESULT: All version objects in the JSON column now have valid status values
-- ============================================================================