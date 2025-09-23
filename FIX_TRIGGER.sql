-- ============================================================================
-- FIX DATABASE TRIGGER WITH OLD ENUM VALUES
-- ============================================================================
-- This script fixes the sync_deliverable_to_stage_status trigger function
-- ============================================================================

-- STEP 1: Drop the existing trigger function (trigger will be dropped automatically)
DROP FUNCTION IF EXISTS sync_deliverable_to_stage_status() CASCADE;

-- STEP 2: Recreate the function with correct enum values
CREATE OR REPLACE FUNCTION sync_deliverable_to_stage_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if there's an associated stage
    IF NEW.stage_id IS NOT NULL THEN
        -- Update stage status based on deliverable status
        -- Using only the 5 valid deliverable statuses: not_started, in_progress, submitted, approved, declined
        UPDATE stages
        SET status = CASE
            WHEN NEW.status = 'approved' THEN 'completed'::stage_status
            WHEN NEW.status = 'declined' THEN 'blocked'::stage_status
            WHEN NEW.status = 'submitted' THEN 'in_progress'::stage_status  -- removed 'pending_approval'
            WHEN NEW.status = 'in_progress' THEN 'in_progress'::stage_status  -- handle in_progress
            WHEN NEW.status = 'not_started' THEN 'not_ready'::stage_status  -- handle not_started
            ELSE 'not_ready'::stage_status
        END
        WHERE id = NEW.stage_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Recreate the trigger
CREATE TRIGGER sync_deliverable_status_to_stage
AFTER INSERT OR UPDATE OF status ON deliverables
FOR EACH ROW
EXECUTE FUNCTION sync_deliverable_to_stage_status();

-- STEP 4: Check if there are any other trigger functions with old values
SELECT 
    'Checking other functions for old values...' as status;

SELECT 
    proname AS function_name,
    CASE 
        WHEN prosrc LIKE '%pending_approval%' THEN 'Contains pending_approval'
        WHEN prosrc LIKE '%draft%' THEN 'Contains draft'
        WHEN prosrc LIKE '%wip%' THEN 'Contains wip'
        ELSE 'Clean'
    END as status
FROM pg_proc
WHERE prosrc LIKE '%deliverable%'
  AND (prosrc LIKE '%pending_approval%' 
       OR prosrc LIKE '%draft%' 
       OR prosrc LIKE '%wip%');

-- STEP 5: Test the fix - try updating the problematic deliverable
UPDATE deliverables 
SET status = 'not_started'::deliverable_status
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- STEP 6: Verify the update worked
SELECT 
    id,
    name,
    status::text as status
FROM deliverables 
WHERE id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';

-- STEP 7: Show all triggers on deliverables table
SELECT 
    'Current triggers on deliverables table:' as info;

SELECT 
    tgname AS trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        ELSE 'Unknown'
    END as status
FROM pg_trigger
WHERE tgrelid = 'deliverables'::regclass
  AND tgname NOT LIKE 'pg_%'
  AND tgname NOT LIKE 'RI_%';

-- STEP 8: Final success message
SELECT 'Trigger fixed! Deliverable status updates should now work without errors.' as result;