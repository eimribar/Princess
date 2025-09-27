-- ============================================================================
-- FIX CLERK INTEGRATION - Remove Supabase Auth Dependencies
-- ============================================================================
-- This migration fixes the users table to work with Clerk authentication
-- instead of Supabase Auth by removing foreign key constraints and adding
-- necessary columns for Clerk integration.
-- ============================================================================

-- Step 1: Remove the foreign key constraint to auth.users
-- This constraint was from when we used Supabase Auth, now we use Clerk
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 2: Add clerk_user_id column to track Clerk users
-- This column will store the Clerk user ID for linking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Step 3: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Step 4: Add any missing columns that ClerkUserContext expects
-- These columns are referenced in ClerkUserContext.jsx
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS needs_onboarding BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invited_by UUID;

-- Step 5: Update any existing users to have needs_onboarding = false
-- This ensures existing users don't get redirected to onboarding
UPDATE users 
SET needs_onboarding = false,
    onboarding_completed = true
WHERE email IN ('eimri@webloom.ai', 'eimribar@gmail.com');

-- Step 6: Add a comment to document the change
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk user ID for authentication integration';
COMMENT ON COLUMN users.id IS 'Internal UUID - no longer references auth.users';

-- ============================================================================
-- IMPORTANT: After running this migration, ensure that:
-- 1. ClerkUserContext.jsx properly stores clerk_user_id
-- 2. All queries can handle users with or without clerk_user_id
-- 3. The application can handle the sync between Clerk and Supabase
-- ============================================================================