-- Migration: User Profile and Onboarding Fields
-- Version: 013
-- Date: September 2025
-- Description: Adds missing profile columns and onboarding tracking fields to users table

-- ========================================
-- PART 1: ADD PROFILE COLUMNS
-- ========================================

-- Add profile-related columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS profile_image TEXT,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS department VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- ========================================
-- PART 2: ADD ONBOARDING TRACKING
-- ========================================

-- Add onboarding tracking columns
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS needs_onboarding BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Note: onboarding_progress and onboarding_started_at are already added in migration 002

-- ========================================
-- PART 3: UPDATE EXISTING USERS
-- ========================================

-- Mark existing users as having completed onboarding (they're already in the system)
UPDATE users 
SET onboarding_completed = true,
    onboarding_completed_at = NOW()
WHERE onboarding_completed IS NULL 
  AND created_at < NOW() - INTERVAL '1 day';

-- Mark recently created users who haven't logged in as needing onboarding
UPDATE users 
SET needs_onboarding = true
WHERE onboarding_completed IS false 
  AND created_at >= NOW() - INTERVAL '1 day';

-- ========================================
-- PART 4: CREATE INDEXES
-- ========================================

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_status 
  ON users(needs_onboarding, onboarding_completed);

-- Note: We don't index profile_image as TEXT columns with large data 
-- (base64 images, blob URLs) exceed PostgreSQL's index size limit (8191 bytes)

-- ========================================
-- PART 5: ROW LEVEL SECURITY POLICIES
-- ========================================

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Team members can view organization profiles" ON users;
CREATE POLICY "Team members can view organization profiles"
  ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- ========================================
-- PART 6: FUNCTION TO HANDLE ONBOARDING COMPLETION
-- ========================================

-- Function to mark onboarding as complete
CREATE OR REPLACE FUNCTION complete_user_onboarding(
  p_user_id UUID,
  p_profile_image TEXT DEFAULT NULL,
  p_title VARCHAR DEFAULT NULL,
  p_department VARCHAR DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET 
    profile_image = COALESCE(p_profile_image, profile_image),
    title = COALESCE(p_title, title),
    department = COALESCE(p_department, department),
    bio = COALESCE(p_bio, bio),
    phone = COALESCE(p_phone, phone),
    needs_onboarding = false,
    onboarding_completed = true,
    onboarding_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_user_onboarding TO authenticated;

-- ========================================
-- PART 7: TRIGGER FOR NEW USER SIGNUP
-- ========================================

-- Function to set onboarding flag for new users
CREATE OR REPLACE FUNCTION set_needs_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set for new users (INSERT), not updates
  IF TG_OP = 'INSERT' THEN
    -- Check if user was created through invitation
    IF NEW.invitation_token IS NOT NULL THEN
      NEW.needs_onboarding = true;
      NEW.onboarding_completed = false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS set_onboarding_for_new_users ON users;
CREATE TRIGGER set_onboarding_for_new_users
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_needs_onboarding();

-- ========================================
-- PART 8: VIEW FOR ONBOARDING STATUS
-- ========================================

-- Create view for easy onboarding status check
CREATE OR REPLACE VIEW user_onboarding_status AS
SELECT 
  id,
  email,
  full_name,
  role,
  needs_onboarding,
  onboarding_completed,
  onboarding_started_at,
  onboarding_completed_at,
  CASE 
    WHEN onboarding_completed = true THEN 'completed'
    WHEN needs_onboarding = true AND onboarding_started_at IS NOT NULL THEN 'in_progress'
    WHEN needs_onboarding = true THEN 'pending'
    ELSE 'not_required'
  END as onboarding_status,
  CASE 
    WHEN onboarding_completed_at IS NOT NULL THEN 
      onboarding_completed_at - COALESCE(onboarding_started_at, created_at)
    ELSE NULL
  END as time_to_complete
FROM users;

-- Grant select permission on view
GRANT SELECT ON user_onboarding_status TO authenticated;