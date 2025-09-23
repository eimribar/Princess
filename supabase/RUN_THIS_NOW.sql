-- ============================================================================
-- COPY AND PASTE THIS EXACT SQL INTO SUPABASE SQL EDITOR
-- ============================================================================

-- STEP 1: Run this FIRST and click "Run"
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'not_started' BEFORE 'draft';

-- STEP 2: Clear the editor, paste this, and click "Run"
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'wip' AFTER 'draft';

-- STEP 3: Verify it worked - paste this and click "Run"
SELECT unnest(enum_range(NULL::deliverable_status)) AS status_values ORDER BY 1;

-- That's it. Done.