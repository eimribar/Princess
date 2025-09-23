-- Deep check for where pending_approval might be hiding

-- 1. Check all columns that might contain the value
SELECT 
    'checking feedback column' as check_type,
    id,
    name,
    feedback
FROM deliverables
WHERE feedback LIKE '%pending_approval%'
LIMIT 5;

-- 2. Check all text columns for the value
SELECT 
    'checking all text/varchar columns' as check_type,
    COUNT(*) as matches
FROM deliverables
WHERE 
    name::text LIKE '%pending_approval%' OR
    description::text LIKE '%pending_approval%' OR
    category::text LIKE '%pending_approval%' OR
    type::text LIKE '%pending_approval%' OR
    feedback::text LIKE '%pending_approval%' OR
    assigned_to::text LIKE '%pending_approval%';

-- 3. Get the EXACT data for the failing deliverable
SELECT 
    id,
    status,
    feedback,
    iteration_history,
    created_by,
    assigned_to,
    approved_by,
    declined_by
FROM deliverables
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- 4. Check if there's a default value set on the column
SELECT 
    column_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'deliverables'
  AND column_name = 'status';

-- 5. Check ALL constraints on the table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'deliverables'::regclass;