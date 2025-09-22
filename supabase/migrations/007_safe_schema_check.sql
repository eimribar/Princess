-- Safe Schema Check and Fix
-- This script checks what exists and only creates what's missing
-- Run this if you get "type already exists" errors

-- Check if types exist before creating
DO $$ 
BEGIN
    -- Check and create user_role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'agency', 'client', 'viewer');
    END IF;
    
    -- Check and create team_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_type') THEN
        CREATE TYPE team_type AS ENUM ('agency', 'client');
    END IF;
    
    -- Check and create stage_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stage_status') THEN
        CREATE TYPE stage_status AS ENUM ('not_ready', 'in_progress', 'blocked', 'completed');
    END IF;
    
    -- Check and create deliverable_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deliverable_status') THEN
        CREATE TYPE deliverable_status AS ENUM ('draft', 'submitted', 'pending_approval', 'approved', 'declined');
    END IF;
    
    -- Check and create stage_category if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stage_category') THEN
        CREATE TYPE stage_category AS ENUM ('onboarding', 'research', 'strategy', 'brand_building', 'brand_collaterals', 'brand_activation', 'employer_branding', 'project_closure');
    END IF;
    
    -- Check and create deadline_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deadline_type') THEN
        CREATE TYPE deadline_type AS ENUM ('fixed_date', 'relative_to_stage', 'relative_to_previous');
    END IF;
    
    -- Check and create blocking_priority if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blocking_priority') THEN
        CREATE TYPE blocking_priority AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
    
    -- Check and create resource_dependency if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_dependency') THEN
        CREATE TYPE resource_dependency AS ENUM ('none', 'client_materials', 'external_vendor');
    END IF;
    
    -- Check and create notification_level if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_level') THEN
        CREATE TYPE notification_level AS ENUM ('all', 'deliverables_only', 'actions_required');
    END IF;
    
    -- Check and create notification_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'approval_required', 'feedback_required');
    END IF;
END $$;

-- Now check what tables exist
SELECT 
    'Types Created/Verified' as status,
    array_agg(typname ORDER BY typname) as existing_types
FROM pg_type 
WHERE typname IN (
    'user_role', 'team_type', 'stage_status', 'deliverable_status', 
    'stage_category', 'deadline_type', 'blocking_priority', 
    'resource_dependency', 'notification_level', 'notification_type'
);

-- Check which tables exist
SELECT 
    required.tablename,
    CASE 
        WHEN pg_tables.tablename IS NOT NULL THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM (
    VALUES 
        ('organizations'),
        ('users'),
        ('projects'),
        ('team_members'),
        ('stages'),
        ('stage_dependencies'),
        ('deliverables'),
        ('deliverable_versions'),
        ('feedback'),
        ('comments'),
        ('notifications'),
        ('out_of_scope_requests'),
        ('playbook_templates'),
        ('template_versions'),
        ('activity_logs')
) AS required(tablename)
LEFT JOIN pg_tables ON pg_tables.tablename = required.tablename AND pg_tables.schemaname = 'public'
ORDER BY required.tablename;

-- If you need to drop everything and start fresh (BE CAREFUL!):
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;