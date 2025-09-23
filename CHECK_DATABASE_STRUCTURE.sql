-- ============================================================================
-- CHECK DATABASE STRUCTURE
-- ============================================================================
-- This script checks what columns actually exist in the tables
-- ============================================================================

-- STEP 1: Check if deliverables table exists and what columns it has
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'deliverables'
ORDER BY ordinal_position;

-- STEP 2: Check if deliverable_versions table exists and what columns it has
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'deliverable_versions'
ORDER BY ordinal_position;

-- STEP 3: Check what enum types exist in the database
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'deliverable_status'
ORDER BY e.enumsortorder;

-- STEP 4: Try to check deliverables data (without assuming column names)
SELECT * FROM deliverables LIMIT 1;

-- STEP 5: Try to check deliverable_versions data (without assuming column names)
SELECT * FROM deliverable_versions LIMIT 1;