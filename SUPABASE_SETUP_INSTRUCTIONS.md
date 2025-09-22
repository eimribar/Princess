# 🚀 Supabase Setup Instructions

## Prerequisites
You have Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=https://orpmntxrcdongxmetbrk.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
```

## 📋 Step-by-Step Setup

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Sign in to your account
3. Select your project: `orpmntxrcdongxmetbrk`

### 2. Run Database Migrations

Navigate to **SQL Editor** in the Supabase dashboard and run these scripts in order:

#### Step 2.1: Check What Exists (IMPORTANT - Run First!)
Run `/supabase/migrations/007_safe_schema_check.sql` to see what types and tables already exist.

#### Step 2.2: Create Missing Tables
Run `/supabase/migrations/008_create_missing_tables.sql` to create any missing tables and types safely.

#### Step 2.3: Add Missing ENUM Values
Run `/supabase/migrations/005_fix_enum_values.sql` to add:
- `employer_branding` category
- `project_closure` category
- Make `organization_id` optional

#### Step 2.4: Disable RLS for Development
Run `/supabase/migrations/006_disable_rls_development.sql` to disable Row Level Security.

**⚠️ WARNING**: This is for development only! Re-enable RLS before production.

### 3. Verify Setup

Run this query to verify everything is configured:

```sql
-- Check ENUM values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stage_category')
ORDER BY enumsortorder;

-- Check RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check organization_id is optional
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'organization_id';
```

Expected results:
- ✅ 8 stage categories (including employer_branding, project_closure)
- ✅ All tables show `rowsecurity = false`
- ✅ organization_id shows `is_nullable = YES`

### 4. Test Project Creation

1. Navigate to `/project-initiation` in your app
2. Complete the wizard:
   - Select template
   - Fill project details
   - Select team members
   - Launch project
3. Check Supabase dashboard → Table Editor:
   - `projects` table should have new entry
   - `stages` table should have 104 entries
   - `deliverables` table should have entries

## 🔍 Troubleshooting

### Issue: 401 Unauthorized
**Solution**: RLS is still enabled. Run migration 006.

### Issue: "null value in column organization_id"
**Solution**: Run migration 005 to make organization_id optional.

### Issue: "invalid input value for enum stage_category"
**Solution**: Run migration 005 to add missing ENUM values.

### Issue: Field name errors
**Solution**: The app now handles field mapping automatically:
- `created_date` ↔ `created_at`
- `updated_date` ↔ `updated_at`
- `not_started` → `not_ready`

## 📊 What's Working Now

After setup, the system supports:
- ✅ Creating projects with 104 stages
- ✅ Storing in Supabase database
- ✅ Loading projects by ID
- ✅ Project selector for multiple projects
- ✅ Automatic field name mapping
- ✅ Fallback to localStorage if Supabase fails

## 🔒 Production Checklist

Before going to production:
1. [ ] Re-enable RLS on all tables
2. [ ] Implement proper authentication
3. [ ] Set organization_id from auth context
4. [ ] Configure RLS policies properly
5. [ ] Remove development-only migrations
6. [ ] Set up proper backup strategy

## 📝 Quick Reference

### Connection Test
```bash
curl -H "apikey: YOUR_ANON_KEY" \
     https://orpmntxrcdongxmetbrk.supabase.co/rest/v1/projects
```

### Reset Everything
```sql
-- Drop all tables and types (CAUTION!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then re-run schema.sql
```

### Re-enable RLS
```sql
-- Run this before production
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ... (for all tables)
```