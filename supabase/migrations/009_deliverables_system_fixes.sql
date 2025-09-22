-- Migration: Fix Deliverables System Database Schema
-- Date: December 2024
-- Purpose: Add missing fields and fix bidirectional linking for deliverables system

-- ============================================================================
-- PART 1: ADD MISSING FIELDS TO DELIVERABLES TABLE
-- ============================================================================

-- Add approval tracking fields
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES users(id);

-- Add feedback field for decline reasons
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add assignment field
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id);

-- Add iteration history as JSONB for tracking all feedback rounds
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS iteration_history JSONB DEFAULT '[]';

-- ============================================================================
-- PART 2: ADD BIDIRECTIONAL LINKING TO STAGES TABLE
-- ============================================================================

-- Add deliverable_id to stages for bidirectional linking
ALTER TABLE stages
ADD COLUMN IF NOT EXISTS deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_stages_deliverable ON stages(deliverable_id);

-- ============================================================================
-- PART 3: ADD MISSING FIELDS TO DELIVERABLE_VERSIONS TABLE
-- ============================================================================

-- Add declined fields to versions table
ALTER TABLE deliverable_versions
ADD COLUMN IF NOT EXISTS declined_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- ============================================================================
-- PART 4: CREATE DATA MIGRATION FUNCTION
-- ============================================================================

-- Function to migrate existing stages with is_deliverable = true
CREATE OR REPLACE FUNCTION migrate_existing_deliverables()
RETURNS void AS $$
DECLARE
    stage_record RECORD;
    new_deliverable_id UUID;
    existing_deliverable RECORD;
BEGIN
    -- Loop through all stages where is_deliverable = true
    FOR stage_record IN 
        SELECT s.*, p.name as project_name
        FROM stages s
        JOIN projects p ON s.project_id = p.id
        WHERE s.is_deliverable = true
        AND s.deliverable_id IS NULL
    LOOP
        -- Check if a deliverable already exists for this stage
        SELECT * INTO existing_deliverable
        FROM deliverables
        WHERE stage_id = stage_record.id
        LIMIT 1;
        
        IF existing_deliverable.id IS NOT NULL THEN
            -- Deliverable exists, just link it
            UPDATE stages 
            SET deliverable_id = existing_deliverable.id
            WHERE id = stage_record.id;
            
            RAISE NOTICE 'Linked existing deliverable % to stage %', existing_deliverable.id, stage_record.id;
        ELSE
            -- Create new deliverable
            INSERT INTO deliverables (
                project_id,
                stage_id,
                name,
                description,
                category,
                status,
                priority,
                assigned_to,
                original_deadline,
                adjusted_deadline,
                max_iterations,
                current_iteration,
                created_at,
                updated_at
            ) VALUES (
                stage_record.project_id,
                stage_record.id,
                stage_record.name,
                stage_record.description,
                stage_record.category::VARCHAR,
                CASE 
                    WHEN stage_record.status = 'completed' THEN 'approved'::deliverable_status
                    WHEN stage_record.status = 'in_progress' THEN 'pending_approval'::deliverable_status
                    WHEN stage_record.status = 'blocked' THEN 'declined'::deliverable_status
                    ELSE 'draft'::deliverable_status
                END,
                COALESCE(stage_record.blocking_priority, 'medium'),
                stage_record.assigned_to,
                stage_record.end_date,
                stage_record.end_date,
                3, -- default max iterations
                0, -- default current iteration
                stage_record.created_at,
                stage_record.updated_at
            ) RETURNING id INTO new_deliverable_id;
            
            -- Update stage with deliverable_id
            UPDATE stages 
            SET deliverable_id = new_deliverable_id
            WHERE id = stage_record.id;
            
            RAISE NOTICE 'Created deliverable % for stage %', new_deliverable_id, stage_record.id;
            
            -- Create initial version for the deliverable
            INSERT INTO deliverable_versions (
                deliverable_id,
                version_number,
                status,
                created_at,
                updated_at
            ) VALUES (
                new_deliverable_id,
                'V0',
                CASE 
                    WHEN stage_record.status = 'completed' THEN 'approved'::deliverable_status
                    WHEN stage_record.status = 'in_progress' THEN 'pending_approval'::deliverable_status
                    WHEN stage_record.status = 'blocked' THEN 'declined'::deliverable_status
                    ELSE 'draft'::deliverable_status
                END,
                stage_record.created_at,
                stage_record.updated_at
            );
        END IF;
    END LOOP;
    
    -- Update approved deliverables with approval metadata
    UPDATE deliverables d
    SET 
        approved_at = CASE 
            WHEN d.status = 'approved' THEN COALESCE(d.updated_at, NOW())
            ELSE NULL
        END,
        declined_at = CASE
            WHEN d.status = 'declined' THEN COALESCE(d.updated_at, NOW())
            ELSE NULL
        END
    WHERE d.status IN ('approved', 'declined');
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: RUN DATA MIGRATION
-- ============================================================================

-- Execute the migration function
SELECT migrate_existing_deliverables();

-- ============================================================================
-- PART 6: CREATE CONSISTENCY CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_deliverables_consistency()
RETURNS TABLE(
    issue_type TEXT,
    stage_id UUID,
    deliverable_id UUID,
    details TEXT
) AS $$
BEGIN
    -- Check for stages with is_deliverable=true but no deliverable
    RETURN QUERY
    SELECT 
        'Missing deliverable'::TEXT as issue_type,
        s.id as stage_id,
        NULL::UUID as deliverable_id,
        ('Stage ' || s.number_index || ': ' || s.name || ' has is_deliverable=true but no deliverable')::TEXT as details
    FROM stages s
    WHERE s.is_deliverable = true
    AND s.deliverable_id IS NULL;
    
    -- Check for deliverables without stage connection
    RETURN QUERY
    SELECT 
        'Orphaned deliverable'::TEXT as issue_type,
        NULL::UUID as stage_id,
        d.id as deliverable_id,
        ('Deliverable ' || d.name || ' has no stage connection')::TEXT as details
    FROM deliverables d
    WHERE d.stage_id IS NULL;
    
    -- Check for mismatched status between stage and deliverable
    RETURN QUERY
    SELECT 
        'Status mismatch'::TEXT as issue_type,
        s.id as stage_id,
        d.id as deliverable_id,
        ('Stage status: ' || s.status || ', Deliverable status: ' || d.status)::TEXT as details
    FROM stages s
    JOIN deliverables d ON s.deliverable_id = d.id
    WHERE 
        (s.status = 'completed' AND d.status != 'approved')
        OR (s.status = 'blocked' AND d.status != 'declined')
        OR (s.status = 'in_progress' AND d.status NOT IN ('pending_approval', 'submitted', 'draft'));
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: CREATE TRIGGER FOR AUTO-CREATION
-- ============================================================================

-- Function to auto-create deliverable when stage.is_deliverable is set to true
CREATE OR REPLACE FUNCTION auto_create_deliverable()
RETURNS TRIGGER AS $$
DECLARE
    new_deliverable_id UUID;
BEGIN
    -- Only proceed if is_deliverable changed to true and no deliverable exists
    IF NEW.is_deliverable = true AND OLD.is_deliverable = false AND NEW.deliverable_id IS NULL THEN
        -- Create the deliverable
        INSERT INTO deliverables (
            project_id,
            stage_id,
            name,
            description,
            category,
            status,
            priority,
            assigned_to,
            original_deadline,
            adjusted_deadline,
            max_iterations,
            current_iteration
        ) VALUES (
            NEW.project_id,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.category::VARCHAR,
            'draft'::deliverable_status,
            COALESCE(NEW.blocking_priority, 'medium'),
            NEW.assigned_to,
            NEW.end_date,
            NEW.end_date,
            3,
            0
        ) RETURNING id INTO new_deliverable_id;
        
        -- Update the stage with the deliverable_id
        NEW.deliverable_id := new_deliverable_id;
        
        -- Create initial version
        INSERT INTO deliverable_versions (
            deliverable_id,
            version_number,
            status
        ) VALUES (
            new_deliverable_id,
            'V0',
            'draft'::deliverable_status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_create_deliverable_trigger ON stages;
CREATE TRIGGER auto_create_deliverable_trigger
BEFORE UPDATE ON stages
FOR EACH ROW
EXECUTE FUNCTION auto_create_deliverable();

-- ============================================================================
-- PART 8: CREATE STATUS SYNC TRIGGERS
-- ============================================================================

-- Function to sync deliverable status to stage
CREATE OR REPLACE FUNCTION sync_deliverable_to_stage_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if this is a recursive update
    IF current_setting('app.skip_sync', true) = 'true' THEN
        RETURN NEW;
    END IF;
    
    -- Update the associated stage status when deliverable status changes
    IF NEW.status != OLD.status AND NEW.stage_id IS NOT NULL THEN
        -- Set flag to prevent recursive updates
        PERFORM set_config('app.skip_sync', 'true', true);
        
        UPDATE stages
        SET status = CASE
            WHEN NEW.status = 'approved' THEN 'completed'::stage_status
            WHEN NEW.status = 'declined' THEN 'blocked'::stage_status
            WHEN NEW.status IN ('pending_approval', 'submitted') THEN 'in_progress'::stage_status
            ELSE 'not_ready'::stage_status
        END
        WHERE id = NEW.stage_id;
        
        -- Reset flag
        PERFORM set_config('app.skip_sync', 'false', true);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync stage status to deliverable
CREATE OR REPLACE FUNCTION sync_stage_to_deliverable_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if this is a recursive update
    IF current_setting('app.skip_sync', true) = 'true' THEN
        RETURN NEW;
    END IF;
    
    -- Update the associated deliverable status when stage status changes
    IF NEW.status != OLD.status AND NEW.deliverable_id IS NOT NULL THEN
        -- Set flag to prevent recursive updates
        PERFORM set_config('app.skip_sync', 'true', true);
        
        UPDATE deliverables
        SET status = CASE
            WHEN NEW.status = 'completed' THEN 'approved'::deliverable_status
            WHEN NEW.status = 'blocked' THEN 'declined'::deliverable_status
            WHEN NEW.status = 'in_progress' THEN 'pending_approval'::deliverable_status
            ELSE 'draft'::deliverable_status
        END
        WHERE id = NEW.deliverable_id;
        
        -- Reset flag
        PERFORM set_config('app.skip_sync', 'false', true);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the sync triggers
DROP TRIGGER IF EXISTS sync_deliverable_to_stage_trigger ON deliverables;
CREATE TRIGGER sync_deliverable_to_stage_trigger
AFTER UPDATE ON deliverables
FOR EACH ROW
EXECUTE FUNCTION sync_deliverable_to_stage_status();

DROP TRIGGER IF EXISTS sync_stage_to_deliverable_trigger ON stages;
CREATE TRIGGER sync_stage_to_deliverable_trigger
AFTER UPDATE ON stages
FOR EACH ROW
EXECUTE FUNCTION sync_stage_to_deliverable_status();

-- ============================================================================
-- PART 9: VERIFICATION QUERIES
-- ============================================================================

-- Show migration results
SELECT 'Migration Complete!' as status;

-- Count stages with deliverables
SELECT 
    COUNT(*) FILTER (WHERE is_deliverable = true) as deliverable_stages,
    COUNT(*) FILTER (WHERE is_deliverable = true AND deliverable_id IS NOT NULL) as linked_stages,
    COUNT(*) FILTER (WHERE is_deliverable = true AND deliverable_id IS NULL) as unlinked_stages
FROM stages;

-- Count deliverables
SELECT 
    COUNT(*) as total_deliverables,
    COUNT(*) FILTER (WHERE stage_id IS NOT NULL) as linked_deliverables,
    COUNT(*) FILTER (WHERE stage_id IS NULL) as orphaned_deliverables
FROM deliverables;

-- Run consistency check
SELECT * FROM check_deliverables_consistency();

-- ============================================================================
-- PART 10: ROLLBACK SCRIPT (COMMENT OUT UNLESS NEEDED)
-- ============================================================================

-- To rollback this migration, uncomment and run:
/*
-- Remove triggers
DROP TRIGGER IF EXISTS auto_create_deliverable_trigger ON stages;
DROP TRIGGER IF EXISTS sync_deliverable_to_stage_trigger ON deliverables;
DROP TRIGGER IF EXISTS sync_stage_to_deliverable_trigger ON stages;

-- Remove functions
DROP FUNCTION IF EXISTS auto_create_deliverable();
DROP FUNCTION IF EXISTS sync_deliverable_to_stage_status();
DROP FUNCTION IF EXISTS sync_stage_to_deliverable_status();
DROP FUNCTION IF EXISTS migrate_existing_deliverables();
DROP FUNCTION IF EXISTS check_deliverables_consistency();

-- Remove columns
ALTER TABLE deliverables 
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS declined_at,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS declined_by,
DROP COLUMN IF EXISTS feedback,
DROP COLUMN IF EXISTS assigned_to,
DROP COLUMN IF EXISTS iteration_history;

ALTER TABLE stages
DROP COLUMN IF EXISTS deliverable_id;

ALTER TABLE deliverable_versions
DROP COLUMN IF EXISTS declined_date,
DROP COLUMN IF EXISTS declined_by,
DROP COLUMN IF EXISTS feedback;

-- Drop index
DROP INDEX IF EXISTS idx_stages_deliverable;
*/