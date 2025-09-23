-- ============================================================================
-- SIMPLE DIAGNOSTIC QUERY
-- ============================================================================
-- Run these queries one by one to understand the database structure
-- ============================================================================

-- Query 1: Show all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Query 2: Show columns in deliverables table (if it exists)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliverables' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Query 3: Show columns in deliverable_versions table (if it exists)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliverable_versions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Query 4: Get first row from deliverables to see actual data
SELECT * FROM deliverables LIMIT 1;

-- Query 5: Get first row from deliverable_versions to see actual data  
SELECT * FROM deliverable_versions LIMIT 1;