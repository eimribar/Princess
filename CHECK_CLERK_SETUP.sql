-- ============================================================================
-- CHECK CLERK INTEGRATION SETUP
-- ============================================================================

-- 1. Check if users table has all Clerk columns
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'clerk_user_id', 
    'onboarding_completed', 
    'needs_onboarding',
    'onboarding_progress',
    'onboarding_started_at',
    'onboarding_completed_at',
    'profile_image',
    'title',
    'department',
    'bio',
    'invitation_token',
    'invited_by'
)
ORDER BY column_name;

-- 2. Check if invitation_tracking table has all columns
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invitation_tracking'
ORDER BY ordinal_position;

-- 3. Check for any foreign key constraint to auth.users (should return nothing)
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
AND constraint_name = 'users_id_fkey';

-- 4. Check indexes on users table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND indexname IN ('idx_users_clerk_user_id', 'idx_users_email');

-- 5. Check indexes on invitation_tracking table  
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'invitation_tracking';

-- 6. Quick data check - see if we have any Clerk users
SELECT 
    id,
    email,
    clerk_user_id,
    onboarding_completed,
    needs_onboarding
FROM users
LIMIT 5;

-- 7. Check invitation_tracking data
SELECT 
    clerk_invitation_id,
    email,
    status,
    created_at
FROM invitation_tracking
ORDER BY created_at DESC
LIMIT 5;