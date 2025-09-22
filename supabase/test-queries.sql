-- Test Queries for Team Members in Supabase

-- 1. Count total team members
SELECT COUNT(*) as total_members FROM team_members;

-- 2. View all team members with key fields
SELECT 
  id,
  name,
  email,
  role,
  team_type,
  is_decision_maker,
  created_at
FROM team_members
ORDER BY created_at DESC;

-- 3. Check for recent additions (last 24 hours)
SELECT 
  name,
  email,
  role,
  created_at
FROM team_members
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 4. View decision makers
SELECT 
  name,
  email,
  role,
  team_type
FROM team_members
WHERE is_decision_maker = true;

-- 5. Group by team type
SELECT 
  team_type,
  COUNT(*) as count
FROM team_members
GROUP BY team_type;

-- 6. Check for any profile images
SELECT 
  name,
  email,
  CASE 
    WHEN profile_image IS NOT NULL THEN 'Has Image'
    ELSE 'No Image'
  END as image_status
FROM team_members;