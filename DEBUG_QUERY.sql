-- Check the specific deliverable that's failing
SELECT 
    id,
    name,
    status,
    feedback,
    iteration_history
FROM deliverables
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- Check if iteration_history might contain old status values
SELECT 
    id,
    name,
    iteration_history::text
FROM deliverables
WHERE iteration_history IS NOT NULL
  AND iteration_history::text LIKE '%pending_approval%'
LIMIT 5;

-- Check feedback column for old values
SELECT 
    id,
    name,
    feedback
FROM deliverables
WHERE feedback LIKE '%pending_approval%'
LIMIT 5;