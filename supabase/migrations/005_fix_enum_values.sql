-- Fix missing ENUM values for Princess application
-- Date: December 2024
-- This migration adds missing category values that exist in the application code

-- Add missing stage_category values
-- Note: PostgreSQL doesn't support IF NOT EXISTS for enum values, 
-- so we need to check if they exist first

DO $$ 
BEGIN
    -- Check and add 'employer_branding' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'employer_branding' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stage_category')
    ) THEN
        ALTER TYPE stage_category ADD VALUE 'employer_branding';
    END IF;
    
    -- Check and add 'project_closure' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'project_closure' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stage_category')
    ) THEN
        ALTER TYPE stage_category ADD VALUE 'project_closure';
    END IF;
END $$;

-- Make organization_id optional for development
-- This allows creating projects without an organization context
ALTER TABLE projects 
ALTER COLUMN organization_id DROP NOT NULL;

-- Add comment explaining why organization_id is optional
COMMENT ON COLUMN projects.organization_id IS 
'Organization ID - optional in development, required in production with proper auth/multi-tenancy';

-- Verify the changes
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stage_category')
ORDER BY enumsortorder;