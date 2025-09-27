-- ============================================================
-- COMPLETE AUTH SYSTEM RESET - PREPARE FOR CLERK MIGRATION
-- ============================================================
-- This script removes all Supabase auth remnants
-- Keeps only admin users for reference
-- ============================================================

-- STEP 1: Show what we're about to clean
SELECT '=== CURRENT STATE BEFORE CLEANUP ===' as status;

SELECT COUNT(*) as total_invitations FROM invitations;
SELECT COUNT(*) as total_users FROM public.users;
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- STEP 2: Delete all invitations
DELETE FROM invitations;
SELECT '✅ All invitations deleted' as status;

-- STEP 3: Delete all users except admins
DELETE FROM public.users 
WHERE email NOT IN ('eimri@webloom.ai', 'eimribar@gmail.com');

DELETE FROM auth.users 
WHERE email NOT IN ('eimri@webloom.ai', 'eimribar@gmail.com');

SELECT '✅ Kept only admin users' as status;

-- STEP 4: Drop all invitation-related functions
DROP FUNCTION IF EXISTS accept_invitation CASCADE;
DROP FUNCTION IF EXISTS create_invitation CASCADE;
DROP FUNCTION IF EXISTS process_invitation_signup CASCADE;
DROP FUNCTION IF EXISTS confirm_invited_user_email CASCADE;
DROP FUNCTION IF EXISTS confirm_all_invited_users CASCADE;
DROP FUNCTION IF EXISTS auto_confirm_invited_user CASCADE;
DROP FUNCTION IF EXISTS enforce_invitation_only_signup CASCADE;
DROP FUNCTION IF EXISTS accept_invitation_with_auto_confirm CASCADE;
DROP FUNCTION IF EXISTS toggle_invitation_enforcement CASCADE;
DROP FUNCTION IF EXISTS create_user_directly CASCADE;
DROP FUNCTION IF EXISTS verify_user_password CASCADE;

SELECT '✅ All invitation functions dropped' as status;

-- STEP 5: Drop all invitation-related triggers
DROP TRIGGER IF EXISTS auto_confirm_invited_users_trigger ON auth.users;
DROP TRIGGER IF EXISTS enforce_invitation_only_signup_trigger ON auth.users;

SELECT '✅ All invitation triggers dropped' as status;

-- STEP 6: Drop the invitations table
DROP TABLE IF EXISTS invitations CASCADE;

SELECT '✅ Invitations table dropped' as status;

-- STEP 7: Show final state
SELECT '=== FINAL STATE AFTER CLEANUP ===' as status;

SELECT 'Remaining Users:' as info;
SELECT id, email, role, full_name FROM public.users;

SELECT '=== READY FOR CLERK MIGRATION ===' as status;
SELECT 'Next steps:' as info,
       '1. Archive Supabase auth files' as step1,
       '2. Install Clerk SDK' as step2,
       '3. Configure Clerk dashboard' as step3,
       '4. Implement new auth flow' as step4;