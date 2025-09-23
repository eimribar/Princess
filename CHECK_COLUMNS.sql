-- ============================================================================
-- SIMPLE COLUMN CHECK
-- ============================================================================
-- Run this first to see what columns actually exist
-- ============================================================================

-- Check if status column exists in deliverables
SELECT 
    'deliverables' as table_name,
    CASE 
        WHEN MAX(CASE WHEN column_name = 'status' THEN 1 ELSE 0 END) = 1 
        THEN 'YES - status column exists'
        ELSE 'NO - status column does NOT exist'
    END as has_status_column,
    COUNT(*) as total_columns,
    STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as all_columns
FROM information_schema.columns 
WHERE table_name = 'deliverables' 
  AND table_schema = 'public'

UNION ALL

-- Check if status column exists in deliverable_versions
SELECT 
    'deliverable_versions' as table_name,
    CASE 
        WHEN MAX(CASE WHEN column_name = 'status' THEN 1 ELSE 0 END) = 1 
        THEN 'YES - status column exists'
        ELSE 'NO - status column does NOT exist'
    END as has_status_column,
    COUNT(*) as total_columns,
    STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as all_columns
FROM information_schema.columns 
WHERE table_name = 'deliverable_versions' 
  AND table_schema = 'public';