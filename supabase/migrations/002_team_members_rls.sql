-- Enable RLS for team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;

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

-- Note: In production, you would want more restrictive policies based on:
-- - User's organization_id matching team member's project's organization
-- - User's role (admin, agency can edit; client can only view)
-- - Project membership