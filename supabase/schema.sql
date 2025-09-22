-- Princess Database Schema for Supabase
-- Version: 1.0.0
-- Date: December 2024

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'agency', 'client', 'viewer');
CREATE TYPE team_type AS ENUM ('agency', 'client');
CREATE TYPE stage_status AS ENUM ('not_ready', 'in_progress', 'blocked', 'completed');
CREATE TYPE deliverable_status AS ENUM ('draft', 'submitted', 'pending_approval', 'approved', 'declined');
CREATE TYPE stage_category AS ENUM ('onboarding', 'research', 'strategy', 'brand_building', 'brand_collaterals', 'brand_activation');
CREATE TYPE deadline_type AS ENUM ('fixed_date', 'relative_to_stage', 'relative_to_previous');
CREATE TYPE blocking_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE resource_dependency AS ENUM ('none', 'client_materials', 'external_vendor');
CREATE TYPE notification_level AS ENUM ('all', 'deliverables_only', 'actions_required');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'approval_required', 'feedback_required');

-- Organizations table (for multi-tenancy)
CREATE TABLE organizations (
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
CREATE TABLE users (
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
CREATE TABLE projects (
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
CREATE TABLE team_members (
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
CREATE TABLE stages (
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
    estimated_duration INTEGER, -- in days
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

-- Stage dependencies table
CREATE TABLE stage_dependencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    depends_on_stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stage_id, depends_on_stage_id),
    CHECK (stage_id != depends_on_stage_id)
);

-- Deliverables table
CREATE TABLE deliverables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    type VARCHAR(50), -- 'research', 'strategy', 'creative'
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

-- Deliverable versions table
CREATE TABLE deliverable_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    deliverable_id UUID REFERENCES deliverables(id) ON DELETE CASCADE,
    version_number VARCHAR(10) NOT NULL, -- 'V0', 'V1', 'V2'
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

-- Feedback table
CREATE TABLE feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    deliverable_version_id UUID REFERENCES deliverable_versions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    feedback_text TEXT NOT NULL,
    iteration_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id),
    deliverable_id UUID REFERENCES deliverables(id),
    user_id UUID REFERENCES users(id),
    parent_comment_id UUID REFERENCES comments(id),
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Hide from clients
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
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

-- Out of scope requests table
CREATE TABLE out_of_scope_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    urgency blocking_priority DEFAULT 'medium',
    estimated_cost DECIMAL(10, 2),
    timeline_impact INTEGER, -- in days
    status VARCHAR(50) DEFAULT 'pending',
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playbook templates table
CREATE TABLE playbook_templates (
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

-- Template versions table
CREATE TABLE template_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES playbook_templates(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    stages_data JSONB NOT NULL,
    dependencies_data JSONB,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table (for audit trail)
CREATE TABLE activity_logs (
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
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_team_members_project ON team_members(project_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_stages_project ON stages(project_id);
CREATE INDEX idx_stages_status ON stages(status);
CREATE INDEX idx_deliverables_project ON deliverables(project_id);
CREATE INDEX idx_deliverables_stage ON deliverables(stage_id);
CREATE INDEX idx_deliverable_versions_deliverable ON deliverable_versions(deliverable_id);
CREATE INDEX idx_feedback_version ON feedback(deliverable_version_id);
CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_stage ON comments(stage_id);
CREATE INDEX idx_comments_deliverable ON comments(deliverable_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_project ON notifications(project_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_project ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverable_versions_updated_at BEFORE UPDATE ON deliverable_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_out_of_scope_requests_updated_at BEFORE UPDATE ON out_of_scope_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_templates_updated_at BEFORE UPDATE ON playbook_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();