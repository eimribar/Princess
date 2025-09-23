-- Find and display the problematic trigger
SELECT 
    tgname AS trigger_name,
    tgtype,
    tgenabled,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'deliverables'::regclass;

-- Get the full source of the trigger function
SELECT 
    proname AS function_name,
    prosrc AS source_code
FROM pg_proc
WHERE proname = 'sync_deliverable_to_stage_status';

-- Check if there are other triggers with similar issues
SELECT 
    proname AS function_name,
    prosrc AS source_code
FROM pg_proc
WHERE prosrc LIKE '%pending_approval%'
   OR prosrc LIKE '%draft%'
   OR prosrc LIKE '%wip%';