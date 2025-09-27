-- ============================================================
-- SIMPLE EMAIL CONFIRMATION FOR INVITED USERS
-- ============================================================
-- This is a simpler version that just confirms emails directly
-- ============================================================

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS confirm_invited_user_email(VARCHAR);

-- Create the simplified function
CREATE OR REPLACE FUNCTION confirm_invited_user_email(p_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Simple and direct: just confirm the email
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE email = p_email
    AND email_confirmed_at IS NULL;
  
  -- Return true if we updated something
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION confirm_invited_user_email(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION confirm_invited_user_email(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_invited_user_email(VARCHAR) TO service_role;

-- Also create a version that works with user ID
CREATE OR REPLACE FUNCTION confirm_user_email_by_id(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id
    AND email_confirmed_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION confirm_user_email_by_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION confirm_user_email_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_user_email_by_id(UUID) TO service_role;

-- Test the function
SELECT '=== TESTING EMAIL CONFIRMATION FUNCTION ===' as test;
SELECT confirm_invited_user_email('test@example.com') as test_result;

-- Show any unconfirmed users
SELECT '=== UNCONFIRMED USERS ===' as test;
SELECT 
  email,
  created_at,
  '❌ Cannot sign in - email not confirmed' as status
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Confirm ALL recent test users
SELECT '=== AUTO-CONFIRMING RECENT TEST USERS ===' as test;
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND email_confirmed_at IS NULL
RETURNING email, '✅ Email confirmed' as status;