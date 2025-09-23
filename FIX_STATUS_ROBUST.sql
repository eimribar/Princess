-- ============================================================================
-- ROBUST FIX FOR DELIVERABLE STATUS DATA
-- ============================================================================
-- This script handles the case where status column may or may not exist
-- ============================================================================

-- First, let's check what we're dealing with
\echo '===================================='
\echo 'STEP 1: Checking table structures'
\echo '===================================='

-- Check deliverables columns
\echo 'Columns in deliverables table:'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliverables' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check deliverable_versions columns
\echo ''
\echo 'Columns in deliverable_versions table:'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliverable_versions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Look for the specific problematic deliverable
\echo ''
\echo '===================================='
\echo 'STEP 2: Checking problematic deliverable'
\echo '===================================='
SELECT id, name FROM deliverables WHERE id = 'bc1e0b0b-a158-4c3d-8183-28521a86a75d';

-- Check if status columns exist and fix them if they do
\echo ''
\echo '===================================='
\echo 'STEP 3: Fixing status values (if columns exist)'
\echo '===================================='

-- Fix deliverables table if status column exists
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
        
        -- Show current status distribution
        RAISE NOTICE 'Current status distribution in deliverables:';
        FOR old_count IN 
            EXECUTE 'SELECT COUNT(*) FROM deliverables GROUP BY status::text'
        LOOP
            RAISE NOTICE '  Count: %', old_count;
        END LOOP;
    ELSE
        RAISE NOTICE 'Status column NOT found in deliverables table - skipping';
    END IF;
END $$;

-- Fix deliverable_versions table if status column exists
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
        
        -- Show current status distribution
        RAISE NOTICE 'Current status distribution in deliverable_versions:';
        FOR old_count IN 
            EXECUTE 'SELECT COUNT(*) FROM deliverable_versions GROUP BY status::text'
        LOOP
            RAISE NOTICE '  Count: %', old_count;
        END LOOP;
    ELSE
        RAISE NOTICE 'Status column NOT found in deliverable_versions table - skipping';
    END IF;
END $$;

-- Final verification
\echo ''
\echo '===================================='
\echo 'STEP 4: Final verification'
\echo '===================================='

-- Show a sample of deliverables
\echo 'Sample deliverables (first 3):'
SELECT id, name FROM deliverables LIMIT 3;

-- Show a sample of deliverable_versions
\echo ''
\echo 'Sample deliverable_versions (first 3):'
SELECT id, deliverable_id, version_number FROM deliverable_versions LIMIT 3;

\echo ''
\echo '===================================='
\echo 'Fix complete! If status columns exist, they have been updated.'
\echo 'If status columns do not exist, that may be why you were getting 400 errors.'
\echo '====================================';