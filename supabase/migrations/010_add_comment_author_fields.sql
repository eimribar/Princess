-- Add missing author fields to comments table for system comments
-- These fields are needed for comments created by the system without a user_id

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS author_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT NOW();

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_comments_stage_id ON comments(stage_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);

-- Update existing comments to use comment_text as content
UPDATE comments 
SET content = comment_text 
WHERE content IS NULL AND comment_text IS NOT NULL;