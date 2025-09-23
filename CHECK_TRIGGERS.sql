-- Check for database triggers on deliverables table
SELECT 
    tgname AS trigger_name,
    proname AS function_name,
    tgtype,
    tgenabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'deliverables'::regclass;

-- Check for RLS policies
SELECT 
    polname AS policy_name,
    polcmd AS command,
    polpermissive AS permissive,
    pg_get_expr(polqual, polrelid) AS using_expression,
    pg_get_expr(polwithcheck, polrelid) AS with_check_expression
FROM pg_policy
WHERE polrelid = 'deliverables'::regclass;

-- Check if there are any check constraints
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'deliverables'::regclass
  AND contype = 'c';

-- Check the actual row that's failing - get ALL columns
SELECT * FROM deliverables 
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c' \gx