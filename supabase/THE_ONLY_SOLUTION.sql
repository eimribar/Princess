-- ============================================================================
-- THE ONLY PROPER SOLUTION - NO WORKAROUNDS
-- ============================================================================

-- OPTION 1: RUN THESE SEPARATELY IN SQL EDITOR
-- Click "Run" after EACH line:

ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'not_started' BEFORE 'draft';

-- Wait for it to complete, then run:

ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'wip' AFTER 'draft';

-- ============================================================================

-- OPTION 2: USE SUPABASE MIGRATIONS TAB
-- 
-- 1. Go to Database → Migrations
-- 2. Click "Create a new migration"  
-- 3. Name: "add_deliverable_statuses"
-- 4. Paste this:

ALTER TYPE deliverable_status ADD VALUE 'not_started' BEFORE 'draft';
ALTER TYPE deliverable_status ADD VALUE 'wip' AFTER 'draft';

-- 5. Run the migration

-- ============================================================================

-- OPTION 3: USE SUPABASE CLI
-- 
-- Run locally:

npx supabase migration new add_deliverable_statuses
# Add the ALTER TYPE commands to the created file
npx supabase db push

-- ============================================================================

-- OPTION 4: NUCLEAR - RECREATE THE ENUM
-- 
-- If all else fails, recreate the enum properly:

-- Save existing data
ALTER TABLE deliverables ALTER COLUMN status TYPE TEXT;

-- Drop and recreate enum
DROP TYPE deliverable_status;
CREATE TYPE deliverable_status AS ENUM ('not_started', 'wip', 'submitted', 'approved', 'declined');

-- Restore column with new enum
ALTER TABLE deliverables ALTER COLUMN status TYPE deliverable_status USING status::deliverable_status;

-- ============================================================================

PICK ONE OPTION AND DO IT. NO WORKAROUNDS.