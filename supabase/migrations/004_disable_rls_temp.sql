-- Temporarily disable RLS for testing
-- WARNING: Only use this for development/testing!

-- Disable RLS on team_members table
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- This allows all operations without authentication
-- Remember to re-enable RLS with proper policies for production!

-- To re-enable later:
-- ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;