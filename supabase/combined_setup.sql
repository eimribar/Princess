-- Princess Database Complete Setup
-- Run this entire script in your Supabase SQL Editor
-- Version: 1.0.0
-- Date: December 2024

-- ========================================
-- PART 1: DATABASE SCHEMA
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'agency', 'client', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE team_type AS ENUM ('agency', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stage_status AS ENUM ('not_ready', 'in_progress', 'blocked', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deliverable_status AS ENUM ('draft', 'submitted', 'pending_approval', 'approved', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stage_category AS ENUM ('onboarding', 'research', 'strategy', 'brand_building', 'brand_collaterals', 'brand_activation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deadline_type AS ENUM ('fixed_date', 'relative_to_stage', 'relative_to_previous');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE blocking_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_dependency AS ENUM ('none', 'client_materials', 'external_vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_level AS ENUM ('all', 'deliverables_only', 'actions_required');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'approval_required', 'feedback_required');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organizations table (for multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role user_role DEFAULT 'viewer',
    avatar_url TEXT,
    phone VARCHAR(20),
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "level": "all"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    template_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    team_type team_type NOT NULL,
    is_decision_maker BOOLEAN DEFAULT false,
    profile_image TEXT,
    linkedin_url TEXT,
    bio TEXT,
    short_bio TEXT,
    expertise TEXT,
    personal TEXT,
    capacity_percentage INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stages table
CREATE TABLE IF NOT EXISTS stages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    number_index INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    formal_name VARCHAR(255),
    is_deliverable BOOLEAN DEFAULT false,
    category stage_category,
    status stage_status DEFAULT 'not_ready',
    description TEXT,
    wireframe_example TEXT,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    start_date DATE,
    end_date DATE,
    deadline_type deadline_type,
    deadline_value TEXT,
    assigned_to UUID REFERENCES team_members(id),
    client_facing BOOLEAN DEFAULT true,
    blocking_priority blocking_priority DEFAULT 'medium',
    resource_dependency resource_dependency DEFAULT 'none',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, number_index)
);

-- Continue with remaining tables...
CREATE TABLE IF NOT EXISTS stage_dependencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    depends_on_stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stage_id, depends_on_stage_id),
    CHECK (stage_id != depends_on_stage_id)
);

CREATE TABLE IF NOT EXISTS deliverables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    type VARCHAR(50),
    priority blocking_priority DEFAULT 'medium',
    status deliverable_status DEFAULT 'draft',
    max_iterations INTEGER DEFAULT 3,
    current_iteration INTEGER DEFAULT 0,
    original_deadline DATE,
    adjusted_deadline DATE,
    deadline_impact_total INTEGER DEFAULT 0,
    is_final BOOLEAN DEFAULT false,
    include_in_brandbook BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliverable_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    deliverable_id UUID REFERENCES deliverables(id) ON DELETE CASCADE,
    version_number VARCHAR(10) NOT NULL,
    status deliverable_status DEFAULT 'draft',
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(100),
    notes TEXT,
    submitted_date TIMESTAMPTZ,
    submitted_by UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    deliverable_version_id UUID REFERENCES deliverable_versions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    feedback_text TEXT NOT NULL,
    iteration_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id),
    deliverable_id UUID REFERENCES deliverables(id),
    user_id UUID REFERENCES users(id),
    parent_comment_id UUID REFERENCES comments(id),
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS out_of_scope_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    urgency blocking_priority DEFAULT 'medium',
    estimated_cost DECIMAL(10, 2),
    timeline_impact INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playbook_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    stages_data JSONB NOT NULL,
    dependencies_data JSONB,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES playbook_templates(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    stages_data JSONB NOT NULL,
    dependencies_data JSONB,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    entity_type VARCHAR(50),
    entity_id UUID,
    action VARCHAR(50),
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_project ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_stages_project ON stages(project_id);
CREATE INDEX IF NOT EXISTS idx_stages_status ON stages(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_project ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_stage ON deliverables(stage_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_versions_deliverable ON deliverable_versions(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_feedback_version ON feedback(deliverable_version_id);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_stage ON comments(stage_id);
CREATE INDEX IF NOT EXISTS idx_comments_deliverable ON comments(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- ========================================
-- PART 2: SEED DATA
-- ========================================

-- Create a default organization for development
INSERT INTO organizations (id, name, subdomain, logo_url, primary_color, secondary_color)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Deutsch & Co.',
    'deutsch',
    '/logo.png',
    '#2563eb',
    '#10b981'
) ON CONFLICT (id) DO NOTHING;

-- Create default playbook template
INSERT INTO playbook_templates (
    id,
    organization_id,
    name,
    description,
    category,
    stages_data,
    dependencies_data,
    version,
    is_active
) VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Standard Brand Development',
    'Complete 104-step brand development process',
    'Standard',
    '[]'::jsonb,
    '[]'::jsonb,
    '1.0.0',
    true
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PART 3: ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE out_of_scope_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (simplified for initial setup)
-- Note: You should run the full rls_policies.sql for production

-- Allow authenticated users to read their own user record
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to update their own user record
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow new users to create their profile
CREATE POLICY "Users can create profile on signup" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Basic organization access
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = organizations.id
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
-- If you see this comment, the setup completed successfully!
-- Next steps:
-- 1. Go to Authentication > Providers and enable Email and optionally Google
-- 2. Create a test user account through the signup page
-- 3. Check the application at http://localhost:5173