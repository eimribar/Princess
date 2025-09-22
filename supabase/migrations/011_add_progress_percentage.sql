-- Add progress_percentage column to projects table
-- This is a core business metric that tracks overall project completion
-- Enterprise-grade solution with proper constraints

-- Add the progress_percentage column with constraints
ALTER TABLE projects 
ADD COLUMN progress_percentage INTEGER DEFAULT 0 
CONSTRAINT valid_progress_percentage CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Add comment for documentation
COMMENT ON COLUMN projects.progress_percentage IS 'Overall project completion percentage (0-100). Calculated based on weighted stage completion.';

-- Create an index for faster queries when filtering by progress
CREATE INDEX idx_projects_progress ON projects(progress_percentage);

-- Initialize existing projects with calculated progress (optional)
-- This ensures existing projects have accurate progress values
UPDATE projects 
SET progress_percentage = 0 
WHERE progress_percentage IS NULL;

-- Add a trigger to ensure updated_at is always current when progress changes
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at_trigger
BEFORE UPDATE ON projects
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION update_projects_updated_at();