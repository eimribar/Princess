-- Quick fix for profile_image index issue
-- Run this in Supabase SQL Editor to fix the error

-- Drop the problematic index if it exists
DROP INDEX IF EXISTS idx_users_profile_image;

-- Verify that all the important columns were created successfully
DO $$
BEGIN
  -- Check if all columns exist
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('profile_image', 'title', 'department', 'bio', 'needs_onboarding', 'onboarding_completed')
    GROUP BY table_name
    HAVING COUNT(*) = 6
  ) THEN
    RAISE NOTICE 'All onboarding columns exist successfully!';
  ELSE
    RAISE NOTICE 'Some columns may be missing. Running column creation...';
    
    -- Re-run column creation to ensure all columns exist
    ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_image TEXT,
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS department VARCHAR(255),
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS needs_onboarding BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Show the current columns in the users table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
  'profile_image', 
  'title', 
  'department', 
  'bio', 
  'needs_onboarding', 
  'onboarding_completed',
  'onboarding_completed_at',
  'onboarding_progress',
  'onboarding_started_at'
)
ORDER BY column_name;