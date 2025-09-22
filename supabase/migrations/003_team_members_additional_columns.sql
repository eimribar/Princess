-- Add missing columns to team_members table if they don't exist
-- These columns are used by the application but might not be in the initial schema

-- Add phone column if it doesn't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add department column if it doesn't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Add location column if it doesn't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Update the project_id to be nullable for now (since we're using default-project)
ALTER TABLE team_members 
ALTER COLUMN project_id DROP NOT NULL;

-- Set a default project_id for existing records
UPDATE team_members 
SET project_id = 'default-project'::UUID 
WHERE project_id IS NULL;

-- Note: In production, you would create a proper default project first