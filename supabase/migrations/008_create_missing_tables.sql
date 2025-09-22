-- Create Missing Tables Only
-- Run this after 007_safe_schema_check.sql to create any missing tables
-- This script checks for each table and only creates if it doesn't exist

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table if it doesn't exist
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

-- Create users table if it doesn't exist (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
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

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
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

-- Create team_members table if it doesn't exist
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

-- Create stages table if it doesn't exist
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

-- Create stage_dependencies table if it doesn't exist
CREATE TABLE IF NOT EXISTS stage_dependencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    depends_on_stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stage_id, depends_on_stage_id),
    CHECK (stage_id != depends_on_stage_id)
);

-- Create deliverables table if it doesn't exist
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

-- Create deliverable_versions table if it doesn't exist
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

-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    deliverable_version_id UUID REFERENCES deliverable_versions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    feedback_text TEXT NOT NULL,
    iteration_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table if it doesn't exist
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

-- Create notifications table if it doesn't exist
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

-- Create out_of_scope_requests table if it doesn't exist
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

-- Create playbook_templates table if it doesn't exist
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

-- Create template_versions table if it doesn't exist
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

-- Create activity_logs table if it doesn't exist
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

-- Create indexes if they don't exist
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

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'organizations', 'users', 'projects', 'team_members', 
            'stages', 'deliverables', 'deliverable_versions', 
            'feedback', 'comments', 'out_of_scope_requests', 
            'playbook_templates'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at 
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- Verify all tables exist
SELECT 
    tablename,
    CASE 
        WHEN tablename IS NOT NULL THEN '✅ Created/Verified'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'organizations', 'users', 'projects', 'team_members',
    'stages', 'stage_dependencies', 'deliverables', 'deliverable_versions',
    'feedback', 'comments', 'notifications', 'out_of_scope_requests',
    'playbook_templates', 'template_versions', 'activity_logs'
)
ORDER BY tablename;