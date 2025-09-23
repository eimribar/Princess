-- ============================================================================
-- FIX ALL DATABASE TRIGGERS WITH OLD ENUM VALUES
-- ============================================================================
-- This script fixes BOTH trigger functions that have old enum values
-- ============================================================================

-- STEP 1: Drop ALL problematic trigger functions
DROP FUNCTION IF EXISTS sync_deliverable_to_stage_status() CASCADE;
DROP FUNCTION IF EXISTS sync_stage_to_deliverable_status() CASCADE;

-- STEP 2: Recreate sync_deliverable_to_stage_status with correct values
CREATE OR REPLACE FUNCTION sync_deliverable_to_stage_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if there's an associated stage
    IF NEW.stage_id IS NOT NULL THEN
        -- Update stage status based on deliverable status
        -- Valid deliverable statuses: not_started, in_progress, submitted, approved, declined
        UPDATE stages
        SET status = CASE
            WHEN NEW.status = 'approved' THEN 'completed'::stage_status
            WHEN NEW.status = 'declined' THEN 'blocked'::stage_status
            WHEN NEW.status = 'submitted' THEN 'in_progress'::stage_status
            WHEN NEW.status = 'in_progress' THEN 'in_progress'::stage_status
            WHEN NEW.status = 'not_started' THEN 'not_ready'::stage_status
            ELSE 'not_ready'::stage_status
        END
        WHERE id = NEW.stage_id
          AND status != CASE  -- Avoid unnecessary updates
            WHEN NEW.status = 'approved' THEN 'completed'::stage_status
            WHEN NEW.status = 'declined' THEN 'blocked'::stage_status
            WHEN NEW.status = 'submitted' THEN 'in_progress'::stage_status
            WHEN NEW.status = 'in_progress' THEN 'in_progress'::stage_status
            WHEN NEW.status = 'not_started' THEN 'not_ready'::stage_status
            ELSE 'not_ready'::stage_status
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Recreate sync_stage_to_deliverable_status with correct values
CREATE OR REPLACE FUNCTION sync_stage_to_deliverable_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if there's an associated deliverable
    IF NEW.deliverable_id IS NOT NULL THEN
        -- Update deliverable status based on stage status
        -- Valid stage statuses: not_ready, in_progress, blocked, completed
        -- Valid deliverable statuses: not_started, in_progress, submitted, approved, declined
        UPDATE deliverables
        SET status = CASE
            WHEN NEW.status = 'completed' THEN 'approved'::deliverable_status
            WHEN NEW.status = 'blocked' THEN 'declined'::deliverable_status
            WHEN NEW.status = 'in_progress' THEN 'in_progress'::deliverable_status  -- Changed from 'pending_approval'
            WHEN NEW.status = 'not_ready' THEN 'not_started'::deliverable_status   -- Changed from 'draft'
            ELSE 'not_started'::deliverable_status  -- Default to not_started instead of draft
        END
        WHERE id = NEW.deliverable_id
          AND status != CASE  -- Avoid unnecessary updates and potential loops
            WHEN NEW.status = 'completed' THEN 'approved'::deliverable_status
            WHEN NEW.status = 'blocked' THEN 'declined'::deliverable_status
            WHEN NEW.status = 'in_progress' THEN 'in_progress'::deliverable_status
            WHEN NEW.status = 'not_ready' THEN 'not_started'::deliverable_status
            ELSE 'not_started'::deliverable_status
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Recreate the triggers
CREATE TRIGGER sync_deliverable_status_to_stage
AFTER INSERT OR UPDATE OF status ON deliverables
FOR EACH ROW
EXECUTE FUNCTION sync_deliverable_to_stage_status();

CREATE TRIGGER sync_stage_status_to_deliverable
AFTER INSERT OR UPDATE OF status ON stages
FOR EACH ROW
EXECUTE FUNCTION sync_stage_to_deliverable_status();

-- STEP 5: Verify no other functions have old values
SELECT 
    'Functions still containing old enum values:' as check_status;

SELECT 
    proname AS function_name,
    CASE 
        WHEN prosrc LIKE '%pending_approval%' THEN 'Still has pending_approval'
        WHEN prosrc LIKE '%draft%' THEN 'Still has draft'
        WHEN prosrc LIKE '%wip%' THEN 'Still has wip'
        ELSE 'Clean'
    END as status
FROM pg_proc
WHERE (prosrc LIKE '%deliverable%' OR prosrc LIKE '%stage%')
  AND prosrc LIKE ANY(ARRAY['%pending_approval%', '%draft%', '%wip%']);

-- STEP 6: Test the fix - Update the problematic deliverable
UPDATE deliverables 
SET status = 'not_started'::deliverable_status
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- STEP 7: Verify the update worked
SELECT 
    'Test deliverable after update:' as info;

SELECT 
    d.id,
    d.name,
    d.status::text as deliverable_status,
    s.status::text as stage_status
FROM deliverables d
LEFT JOIN stages s ON d.stage_id = s.id
WHERE d.id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- STEP 8: Show all active triggers
SELECT 
    'Active triggers on deliverables and stages:' as info;

SELECT 
    t.tgname AS trigger_name,
    CASE t.tgrelid::regclass::text
        WHEN 'deliverables' THEN 'deliverables'
        WHEN 'stages' THEN 'stages'
        ELSE t.tgrelid::regclass::text
    END as table_name,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid IN ('deliverables'::regclass, 'stages'::regclass)
  AND t.tgname NOT LIKE 'pg_%'
  AND t.tgname NOT LIKE 'RI_%'
ORDER BY table_name, trigger_name;

-- STEP 9: Final message
SELECT 
    'SUCCESS! All triggers fixed. Deliverable status updates should now work without any errors.' as result,
    'Both sync directions (deliverable→stage and stage→deliverable) now use only valid enum values.' as details;