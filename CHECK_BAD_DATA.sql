-- ============================================================================
-- CHECK FOR BAD DATA IN DATABASE
-- ============================================================================

-- Check which deliverable is causing the issue
SELECT 
    id,
    name,
    status::text as status_text
FROM deliverables
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- Check if there are ANY deliverables with old status values still
SELECT 
    status::text as status_value,
    COUNT(*) as count
FROM deliverables
GROUP BY status::text
ORDER BY count DESC;

-- Check for hidden characters or encoding issues
SELECT 
    id,
    name,
    LENGTH(status::text) as status_length,
    status::text as status_value,
    ENCODE(status::bytea, 'hex') as status_hex
FROM deliverables
WHERE status::text IN ('pending_approval', 'draft', 'wip')
   OR id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- Check the enum type definition
SELECT 
    enumlabel as enum_value,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'deliverable_status'
)
ORDER BY enumsortorder;

-- Check if there's something wrong with the specific deliverable
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'deliverables'
AND column_name = 'status';

-- Get raw data for the problematic deliverable
SELECT * FROM deliverables WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c' \gx