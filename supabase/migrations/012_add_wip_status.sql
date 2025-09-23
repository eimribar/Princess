-- Migration: Add 'wip' (Work in Progress) status to deliverable_status enum
-- Date: 2024-12-23
-- Purpose: Fix 400 error when updating deliverable status to 'wip'
-- 
-- The frontend uses 'wip' as a valid deliverable status but it was missing
-- from the database enum, causing 400 errors when trying to update status.

-- Add 'wip' value to the deliverable_status enum
-- It will be added after 'draft' in the enum order
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'wip' AFTER 'draft';

-- Note: This is a safe operation that won't affect existing data
-- All existing deliverables will retain their current status values