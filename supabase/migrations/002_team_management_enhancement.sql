-- Migration: Enhanced Team Management System
-- Version: 002
-- Date: December 2024
-- Description: Adds agency pool, onboarding tracking, and improved team management

-- ========================================
-- PART 1: ONBOARDING TRACKING
-- ========================================

-- Add onboarding fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Track individual onboarding steps
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  step_name VARCHAR(50) NOT NULL,
  step_order INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_user ON onboarding_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_completed ON onboarding_steps(completed_at);

-- ========================================
-- PART 2: AGENCY POOL MANAGEMENT
-- ========================================

-- Create agency pool table for master list of agency employees
CREATE TABLE IF NOT EXISTS agency_pool (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(100),
  department VARCHAR(100),
  skills JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  availability_percentage INTEGER DEFAULT 100 CHECK (availability_percentage >= 0 AND availability_percentage <= 100),
  is_available BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  expertise_areas TEXT[],
  years_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_pool_organization ON agency_pool(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_pool_availability ON agency_pool(is_available, availability_percentage);
CREATE INDEX IF NOT EXISTS idx_agency_pool_email ON agency_pool(email);

-- Link pool members to projects with allocation tracking
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pool_member_id UUID REFERENCES agency_pool(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  allocation_percentage INTEGER DEFAULT 100 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  role_in_project VARCHAR(100),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  billable_hours DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pool_member_id, project_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_assignments_pool ON project_assignments(pool_member_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_active ON project_assignments(is_active);

-- ========================================
-- PART 3: ENHANCED TEAM MEMBER TRACKING
-- ========================================

-- Add fields to team_members for better tracking
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "in_app": true}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS visible_to_client BOOLEAN DEFAULT true;

-- ========================================
-- PART 4: DECISION MAKER LIMIT ENFORCEMENT
-- ========================================

-- Function to check decision maker limit (max 2 per project)
CREATE OR REPLACE FUNCTION check_decision_maker_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if setting is_decision_maker to true
  IF NEW.is_decision_maker = true THEN
    -- Count existing decision makers for this project
    IF (SELECT COUNT(*) FROM team_members 
        WHERE project_id = NEW.project_id 
        AND is_decision_maker = true
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) >= 2 THEN
      RAISE EXCEPTION 'Maximum 2 decision makers allowed per project';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for decision maker limit
DROP TRIGGER IF EXISTS enforce_decision_maker_limit ON team_members;
CREATE TRIGGER enforce_decision_maker_limit
  BEFORE INSERT OR UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_decision_maker_limit();

-- ========================================
-- PART 5: WORKLOAD TRACKING
-- ========================================

-- View to calculate total allocation per agency member
CREATE OR REPLACE VIEW agency_member_workload AS
SELECT 
  ap.id as pool_member_id,
  ap.name,
  ap.email,
  ap.availability_percentage as max_availability,
  COALESCE(SUM(
    CASE 
      WHEN pa.is_active AND (pa.end_date IS NULL OR pa.end_date >= CURRENT_DATE)
      THEN pa.allocation_percentage 
      ELSE 0 
    END
  ), 0) as current_allocation,
  COUNT(DISTINCT 
    CASE 
      WHEN pa.is_active AND (pa.end_date IS NULL OR pa.end_date >= CURRENT_DATE)
      THEN pa.project_id 
    END
  ) as active_projects,
  ap.is_available
FROM agency_pool ap
LEFT JOIN project_assignments pa ON ap.id = pa.pool_member_id
GROUP BY ap.id, ap.name, ap.email, ap.availability_percentage, ap.is_available;

-- ========================================
-- PART 6: ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on new tables
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- Onboarding steps policies
CREATE POLICY "Users can view their own onboarding steps"
  ON onboarding_steps FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own onboarding steps"
  ON onboarding_steps FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all onboarding steps"
  ON onboarding_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Agency pool policies
CREATE POLICY "Agency and admin can view agency pool"
  ON agency_pool FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'agency')
      AND users.organization_id = agency_pool.organization_id
    )
  );

CREATE POLICY "Admins can manage agency pool"
  ON agency_pool FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND users.organization_id = agency_pool.organization_id
    )
  );

-- Project assignments policies
CREATE POLICY "Users can view assignments in their projects"
  ON project_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.project_id = project_assignments.project_id
      AND tm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'agency')
    )
  );

CREATE POLICY "Agency and admin can manage assignments"
  ON project_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'agency')
    )
  );

-- ========================================
-- PART 7: HELPFUL FUNCTIONS
-- ========================================

-- Function to get available agency members for a project
CREATE OR REPLACE FUNCTION get_available_agency_members(p_project_id UUID)
RETURNS TABLE (
  pool_member_id UUID,
  name VARCHAR,
  email VARCHAR,
  role VARCHAR,
  current_allocation INTEGER,
  max_availability INTEGER,
  can_allocate INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.name,
    ap.email,
    ap.role,
    COALESCE(SUM(pa.allocation_percentage), 0)::INTEGER as current_allocation,
    ap.availability_percentage,
    (ap.availability_percentage - COALESCE(SUM(pa.allocation_percentage), 0))::INTEGER as can_allocate
  FROM agency_pool ap
  LEFT JOIN project_assignments pa ON ap.id = pa.pool_member_id 
    AND pa.is_active = true 
    AND (pa.end_date IS NULL OR pa.end_date >= CURRENT_DATE)
  WHERE ap.is_available = true
  GROUP BY ap.id, ap.name, ap.email, ap.role, ap.availability_percentage
  HAVING ap.availability_percentage > COALESCE(SUM(pa.allocation_percentage), 0)
  ORDER BY can_allocate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign agency member to project
CREATE OR REPLACE FUNCTION assign_to_project(
  p_pool_member_id UUID,
  p_project_id UUID,
  p_allocation INTEGER DEFAULT 100,
  p_role VARCHAR DEFAULT NULL
)
RETURNS project_assignments AS $$
DECLARE
  v_assignment project_assignments;
  v_current_allocation INTEGER;
  v_max_availability INTEGER;
  v_team_member team_members;
BEGIN
  -- Check current allocation
  SELECT 
    COALESCE(SUM(allocation_percentage), 0),
    MAX(ap.availability_percentage)
  INTO v_current_allocation, v_max_availability
  FROM agency_pool ap
  LEFT JOIN project_assignments pa ON ap.id = pa.pool_member_id 
    AND pa.is_active = true 
    AND (pa.end_date IS NULL OR pa.end_date >= CURRENT_DATE)
  WHERE ap.id = p_pool_member_id
  GROUP BY ap.id;

  -- Check if allocation would exceed availability
  IF v_current_allocation + p_allocation > v_max_availability THEN
    RAISE EXCEPTION 'Allocation would exceed availability. Current: %, Requested: %, Max: %', 
      v_current_allocation, p_allocation, v_max_availability;
  END IF;

  -- Create team member entry if doesn't exist
  SELECT * INTO v_team_member
  FROM team_members
  WHERE project_id = p_project_id
    AND email = (SELECT email FROM agency_pool WHERE id = p_pool_member_id);

  IF v_team_member.id IS NULL THEN
    INSERT INTO team_members (
      project_id,
      name,
      email,
      role,
      team_type,
      is_decision_maker,
      created_at
    )
    SELECT
      p_project_id,
      ap.name,
      ap.email,
      COALESCE(p_role, ap.role),
      'agency'::team_type,
      false,
      NOW()
    FROM agency_pool ap
    WHERE ap.id = p_pool_member_id
    RETURNING * INTO v_team_member;
  END IF;

  -- Create or update assignment
  INSERT INTO project_assignments (
    pool_member_id,
    project_id,
    team_member_id,
    allocation_percentage,
    role_in_project,
    start_date,
    is_active
  ) VALUES (
    p_pool_member_id,
    p_project_id,
    v_team_member.id,
    p_allocation,
    COALESCE(p_role, v_team_member.role),
    CURRENT_DATE,
    true
  )
  ON CONFLICT (pool_member_id, project_id) 
  DO UPDATE SET
    allocation_percentage = EXCLUDED.allocation_percentage,
    role_in_project = EXCLUDED.role_in_project,
    is_active = true,
    updated_at = NOW()
  RETURNING * INTO v_assignment;

  RETURN v_assignment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PART 8: TRIGGERS FOR AUTO-UPDATE
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to new tables
CREATE TRIGGER update_agency_pool_updated_at
  BEFORE UPDATE ON agency_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_project_assignments_updated_at
  BEFORE UPDATE ON project_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();