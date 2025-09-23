-- ============================================================================
-- SUPABASE-COMPATIBLE FIX FOR DELIVERABLE STATUS DATA
-- ============================================================================
-- This script is designed to work in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Check what columns exist in deliverables table
SELECT 'CHECKING DELIVERABLES TABLE STRUCTURE' as step;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliverables' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Check what columns exist in deliverable_versions table
SELECT 'CHECKING DELIVERABLE_VERSIONS TABLE STRUCTURE' as step;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliverable_versions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 3: Check for the problematic deliverable
SELECT 'CHECKING PROBLEMATIC DELIVERABLE' as step;
SELECT id, name FROM deliverables WHERE id = 'bc1e0b0b-a158-4c3d-8183-28521a86a75d';

-- STEP 4: Fix deliverables table if status column exists
DO $$
DECLARE
    status_exists boolean;
    old_count integer;
    fixed_count integer;
BEGIN
    -- Check if status column exists in deliverables
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliverables' 
          AND column_name = 'status'
          AND table_schema = 'public'
    ) INTO status_exists;
    
    IF status_exists THEN
        RAISE NOTICE 'Status column found in deliverables table';
        
        -- Count records with old status values
        EXECUTE 'SELECT COUNT(*) FROM deliverables WHERE status::text IN (''pending_approval'', ''draft'', ''wip'')' 
        INTO old_count;
        
        IF old_count > 0 THEN
            RAISE NOTICE 'Found % deliverables with old status values', old_count;
            
            -- Fix the status values
            EXECUTE '
                UPDATE deliverables
                SET status = CASE
                    WHEN status::text = ''pending_approval'' THEN ''submitted''::deliverable_status
                    WHEN status::text = ''draft'' THEN ''not_started''::deliverable_status  
                    WHEN status::text = ''wip'' THEN ''in_progress''::deliverable_status
                    ELSE status
                END
                WHERE status::text IN (''pending_approval'', ''draft'', ''wip'')';
            
            GET DIAGNOSTICS fixed_count = ROW_COUNT;
            RAISE NOTICE 'Fixed % deliverable records', fixed_count;
        ELSE
            RAISE NOTICE 'No deliverables with old status values found';
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: Status column NOT found in deliverables table';
    END IF;
END $$;

-- STEP 5: Fix deliverable_versions table if status column exists
DO $$
DECLARE
    status_exists boolean;
    old_count integer;
    fixed_count integer;
BEGIN
    -- Check if status column exists in deliverable_versions
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliverable_versions' 
          AND column_name = 'status'
          AND table_schema = 'public'
    ) INTO status_exists;
    
    IF status_exists THEN
        RAISE NOTICE 'Status column found in deliverable_versions table';
        
        -- Count records with old status values
        EXECUTE 'SELECT COUNT(*) FROM deliverable_versions WHERE status::text IN (''pending_approval'', ''draft'', ''wip'')' 
        INTO old_count;
        
        IF old_count > 0 THEN
            RAISE NOTICE 'Found % deliverable_versions with old status values', old_count;
            
            -- Fix the status values
            EXECUTE '
                UPDATE deliverable_versions
                SET status = CASE
                    WHEN status::text = ''pending_approval'' THEN ''submitted''::deliverable_status
                    WHEN status::text = ''draft'' THEN ''not_started''::deliverable_status
                    WHEN status::text = ''wip'' THEN ''in_progress''::deliverable_status
                    ELSE status
                END
                WHERE status::text IN (''pending_approval'', ''draft'', ''wip'')';
            
            GET DIAGNOSTICS fixed_count = ROW_COUNT;
            RAISE NOTICE 'Fixed % deliverable_version records', fixed_count;
        ELSE
            RAISE NOTICE 'No deliverable_versions with old status values found';
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: Status column NOT found in deliverable_versions table';
    END IF;
END $$;

-- STEP 6: Show current status distribution if columns exist
SELECT 'FINAL STATUS CHECK - DELIVERABLES' as step;
SELECT 
    CASE 
        WHEN column_name IS NOT NULL THEN 'Status column exists'
        ELSE 'Status column does NOT exist'
    END as status_column_check
FROM information_schema.columns 
WHERE table_name = 'deliverables' 
  AND column_name = 'status'
  AND table_schema = 'public';

-- STEP 7: Show sample data
SELECT 'SAMPLE DELIVERABLES' as step;
SELECT id, name FROM deliverables LIMIT 5;

SELECT 'SAMPLE DELIVERABLE_VERSIONS' as step;
SELECT id, deliverable_id, version_number FROM deliverable_versions LIMIT 5;

-- STEP 8: If you want to see status distribution (run separately if status exists)
-- SELECT status::text as status_value, COUNT(*) as count 
-- FROM deliverables 
-- GROUP BY status::text
-- ORDER BY count DESC;