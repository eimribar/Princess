-- Row Level Security (RLS) Policies for Princess
-- Version: 1.0.0
-- Date: December 2024

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

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is in project
CREATE OR REPLACE FUNCTION is_user_in_project(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.project_id = $1 
        AND team_members.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

CREATE POLICY "Admins can update their organization"
    ON organizations FOR UPDATE
    USING (id = get_user_organization_id() AND get_user_role() = 'admin');

-- Users policies
CREATE POLICY "Users can view users in their organization"
    ON users FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their organization"
    ON users FOR ALL
    USING (organization_id = get_user_organization_id() AND get_user_role() = 'admin');

-- Projects policies
CREATE POLICY "Users can view projects they are members of"
    ON projects FOR SELECT
    USING (
        is_user_in_project(id) OR
        (organization_id = get_user_organization_id() AND get_user_role() IN ('admin', 'agency'))
    );

CREATE POLICY "Agency and admin users can create projects"
    ON projects FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id() AND 
        get_user_role() IN ('admin', 'agency')
    );

CREATE POLICY "Agency and admin users can update projects"
    ON projects FOR UPDATE
    USING (
        organization_id = get_user_organization_id() AND 
        get_user_role() IN ('admin', 'agency')
    );

CREATE POLICY "Admins can delete projects"
    ON projects FOR DELETE
    USING (
        organization_id = get_user_organization_id() AND 
        get_user_role() = 'admin'
    );

-- Team members policies
CREATE POLICY "Users can view team members in their projects"
    ON team_members FOR SELECT
    USING (is_user_in_project(project_id));

CREATE POLICY "Agency and admin users can manage team members"
    ON team_members FOR ALL
    USING (
        is_user_in_project(project_id) AND 
        get_user_role() IN ('admin', 'agency')
    );

-- Stages policies
CREATE POLICY "Users can view stages in their projects"
    ON stages FOR SELECT
    USING (is_user_in_project(project_id));

CREATE POLICY "Agency users can manage stages"
    ON stages FOR ALL
    USING (
        is_user_in_project(project_id) AND 
        get_user_role() IN ('admin', 'agency')
    );

-- Stage dependencies policies
CREATE POLICY "Users can view dependencies in their projects"
    ON stage_dependencies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stages 
            WHERE stages.id = stage_dependencies.stage_id 
            AND is_user_in_project(stages.project_id)
        )
    );

CREATE POLICY "Agency users can manage dependencies"
    ON stage_dependencies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM stages 
            WHERE stages.id = stage_dependencies.stage_id 
            AND is_user_in_project(stages.project_id)
            AND get_user_role() IN ('admin', 'agency')
        )
    );

-- Deliverables policies
CREATE POLICY "Users can view deliverables in their projects"
    ON deliverables FOR SELECT
    USING (is_user_in_project(project_id));

CREATE POLICY "Agency users can create deliverables"
    ON deliverables FOR INSERT
    WITH CHECK (
        is_user_in_project(project_id) AND 
        get_user_role() IN ('admin', 'agency')
    );

CREATE POLICY "Agency users can update deliverables"
    ON deliverables FOR UPDATE
    USING (
        is_user_in_project(project_id) AND 
        get_user_role() IN ('admin', 'agency')
    );

CREATE POLICY "Client users can update deliverable status"
    ON deliverables FOR UPDATE
    USING (
        is_user_in_project(project_id) AND 
        get_user_role() = 'client'
    )
    WITH CHECK (
        -- Clients can only update status field
        (OLD.status IS DISTINCT FROM NEW.status) AND
        -- All other fields remain unchanged
        OLD.name = NEW.name AND
        OLD.description = NEW.description AND
        OLD.category = NEW.category
    );

-- Deliverable versions policies
CREATE POLICY "Users can view versions in their projects"
    ON deliverable_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM deliverables 
            WHERE deliverables.id = deliverable_versions.deliverable_id 
            AND is_user_in_project(deliverables.project_id)
        )
    );

CREATE POLICY "Agency users can manage versions"
    ON deliverable_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM deliverables 
            WHERE deliverables.id = deliverable_versions.deliverable_id 
            AND is_user_in_project(deliverables.project_id)
            AND get_user_role() IN ('admin', 'agency')
        )
    );

-- Feedback policies
CREATE POLICY "Users can view feedback in their projects"
    ON feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM deliverable_versions dv
            JOIN deliverables d ON d.id = dv.deliverable_id
            WHERE dv.id = feedback.deliverable_version_id
            AND is_user_in_project(d.project_id)
        )
    );

CREATE POLICY "Users can create feedback in their projects"
    ON feedback FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM deliverable_versions dv
            JOIN deliverables d ON d.id = dv.deliverable_id
            WHERE dv.id = deliverable_version_id
            AND is_user_in_project(d.project_id)
        )
    );

-- Comments policies
CREATE POLICY "Users can view non-internal comments in their projects"
    ON comments FOR SELECT
    USING (
        is_user_in_project(project_id) AND
        (NOT is_internal OR get_user_role() IN ('admin', 'agency'))
    );

CREATE POLICY "Users can create comments in their projects"
    ON comments FOR INSERT
    WITH CHECK (
        is_user_in_project(project_id) AND
        user_id = auth.uid()
    );

CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications for any user"
    ON notifications FOR INSERT
    WITH CHECK (true); -- Will be restricted by service role

-- Out of scope requests policies
CREATE POLICY "Users can view out of scope requests in their projects"
    ON out_of_scope_requests FOR SELECT
    USING (
        is_user_in_project(project_id) AND
        get_user_role() IN ('admin', 'agency')
    );

CREATE POLICY "Agency users can create out of scope requests"
    ON out_of_scope_requests FOR INSERT
    WITH CHECK (
        is_user_in_project(project_id) AND
        get_user_role() IN ('admin', 'agency')
    );

CREATE POLICY "Agency users can update out of scope requests"
    ON out_of_scope_requests FOR UPDATE
    USING (
        is_user_in_project(project_id) AND
        get_user_role() IN ('admin', 'agency')
    );

-- Playbook templates policies
CREATE POLICY "Users can view templates in their organization"
    ON playbook_templates FOR SELECT
    USING (
        organization_id = get_user_organization_id() AND
        is_active = true
    );

CREATE POLICY "Admin users can manage templates"
    ON playbook_templates FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        get_user_role() = 'admin'
    );

-- Template versions policies
CREATE POLICY "Users can view template versions"
    ON template_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM playbook_templates
            WHERE playbook_templates.id = template_versions.template_id
            AND playbook_templates.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Admin users can manage template versions"
    ON template_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM playbook_templates
            WHERE playbook_templates.id = template_versions.template_id
            AND playbook_templates.organization_id = get_user_organization_id()
            AND get_user_role() = 'admin'
        )
    );

-- Activity logs policies
CREATE POLICY "Users can view activity in their projects"
    ON activity_logs FOR SELECT
    USING (
        is_user_in_project(project_id) AND
        get_user_role() IN ('admin', 'agency')
    );

CREATE POLICY "System can create activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true); -- Will be restricted by service role

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;