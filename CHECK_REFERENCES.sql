-- Check for any foreign key relationships
SELECT 
    conname AS constraint_name,
    contype AS type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'deliverables'::regclass
   OR confrelid = 'deliverables'::regclass;

-- Check if there are any views that might be involved
SELECT 
    viewname,
    definition
FROM pg_views
WHERE definition LIKE '%deliverables%'
  AND schemaname = 'public';

-- Check if there are any functions that might be triggered
SELECT 
    proname AS function_name,
    prosrc AS source_code
FROM pg_proc
WHERE prosrc LIKE '%pending_approval%'
   OR prosrc LIKE '%deliverables%'
LIMIT 10;

-- Get the exact error context - try a direct SQL update
-- This will help us see if it's a database-level issue or app-level
UPDATE deliverables 
SET status = 'not_started'::deliverable_status
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- If the above works, check what the status is now
SELECT id, name, status::text 
FROM deliverables 
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';