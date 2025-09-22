-- Disable Row Level Security for Development
-- Date: December 2024
-- WARNING: This should ONLY be used in development environments!
-- Re-enable RLS with proper policies before going to production

-- Disable RLS on all tables to allow operations without authentication
-- This is necessary for development when auth is not configured

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE stage_dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE out_of_scope_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- To re-enable RLS for production, run:
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stage_dependencies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deliverable_versions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE out_of_scope_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE playbook_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;