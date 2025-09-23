-- ============================================================================
-- SAFE FIX FOR DELIVERABLE STATUS DATA
-- ============================================================================
-- This script safely checks and fixes the data based on actual table structure
-- ============================================================================

-- First, let's see what tables and columns we actually have
\echo 'Checking deliverables table structure...'
\d deliverables

\echo 'Checking deliverable_versions table structure...'
\d deliverable_versions

-- Check if the problematic deliverable exists
\echo 'Checking for the problematic deliverable...'
SELECT id, name 
FROM deliverables 
WHERE id = 'bc1e0b0b-a158-4c3d-8183-28521a86a75d';

-- Check what columns exist in deliverables table
\echo 'Listing all columns in deliverables table...'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliverables' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what columns exist in deliverable_versions table
\echo 'Listing all columns in deliverable_versions table...'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliverable_versions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- If status column exists in deliverables, check its values
\echo 'Checking deliverables with potential old status values...'
DO $$
BEGIN
    -- Check if status column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliverables' 
          AND column_name = 'status'
          AND table_schema = 'public'
    ) THEN
        -- If it exists, show the data
        RAISE NOTICE 'Status column found in deliverables table';
        
        -- This will only run if the column exists
        EXECUTE 'SELECT status::text as status_value, COUNT(*) as count 
                 FROM deliverables 
                 GROUP BY status::text';
    ELSE
        RAISE NOTICE 'Status column NOT found in deliverables table';
    END IF;
END $$;

-- If status column exists in deliverable_versions, check its values
\echo 'Checking deliverable_versions with potential old status values...'
DO $$
BEGIN
    -- Check if status column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliverable_versions' 
          AND column_name = 'status'
          AND table_schema = 'public'
    ) THEN
        -- If it exists, show the data
        RAISE NOTICE 'Status column found in deliverable_versions table';
        
        -- This will only run if the column exists
        EXECUTE 'SELECT status::text as status_value, COUNT(*) as count 
                 FROM deliverable_versions 
                 GROUP BY status::text';
    ELSE
        RAISE NOTICE 'Status column NOT found in deliverable_versions table';
    END IF;
END $$;