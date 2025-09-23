-- ============================================================================
-- FIND ALL TRIGGERS WITH OLD ENUM VALUES
-- ============================================================================

-- List ALL trigger functions that might have old enum values
SELECT 
    proname AS function_name,
    CASE 
        WHEN prosrc LIKE '%pending_approval%' THEN 'HAS pending_approval'
        WHEN prosrc LIKE '%draft%' THEN 'HAS draft'
        WHEN prosrc LIKE '%wip%' THEN 'HAS wip'
        ELSE 'Clean'
    END as status,
    LENGTH(prosrc) as code_length
FROM pg_proc
WHERE (prosrc LIKE '%deliverable%' OR prosrc LIKE '%stage%')
  AND prosrc LIKE ANY(ARRAY['%pending_approval%', '%draft%', '%wip%'])
ORDER BY proname;

-- Get the source code of sync_stage_to_deliverable_status
SELECT 
    'sync_stage_to_deliverable_status function:' as info;
    
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'sync_stage_to_deliverable_status';

-- Get all triggers on both deliverables and stages tables
SELECT 
    'Triggers on deliverables table:' as info;
    
SELECT 
    tgname AS trigger_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'deliverables'::regclass
  AND tgname NOT LIKE 'pg_%';

SELECT 
    'Triggers on stages table:' as info;
    
SELECT 
    tgname AS trigger_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'stages'::regclass
  AND tgname NOT LIKE 'pg_%';

-- Count how many functions need fixing
SELECT 
    COUNT(*) as functions_with_old_values
FROM pg_proc
WHERE (prosrc LIKE '%deliverable%' OR prosrc LIKE '%stage%')
  AND prosrc LIKE ANY(ARRAY['%pending_approval%', '%draft%', '%wip%']);