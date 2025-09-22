-- Combined Team Members Setup for Supabase
-- Run this entire script in Supabase SQL Editor

-- 1. Enable RLS for team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;

-- 3. Create RLS Policies
-- Policy: Anyone authenticated can view team members
CREATE POLICY "Users can view team members"
ON team_members FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert team members
CREATE POLICY "Users can insert team members"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update team members
CREATE POLICY "Users can update team members"
ON team_members FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can delete team members
CREATE POLICY "Users can delete team members"
ON team_members FOR DELETE
TO authenticated
USING (true);

-- 4. Add missing columns if they don't exist
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- 5. Make project_id nullable for now
ALTER TABLE team_members 
ALTER COLUMN project_id DROP NOT NULL;

-- 6. Test that everything is working
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'team_members'
ORDER BY 
  ordinal_position;

-- You should see all columns including the new ones!