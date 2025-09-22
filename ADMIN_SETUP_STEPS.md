# Setting Up Your Admin User - Step by Step

## The Error You're Seeing
```
ERROR: P0001: Auth user not found. Please create user in Supabase Auth first with email: eimribar@gmail.com
```

This means the auth user doesn't exist yet. You need to create it first in Supabase Auth, THEN run the seed script.

## ✅ Correct Order of Steps

### Step 1: Create the Auth User FIRST
1. Go to your Supabase Dashboard:
   [https://supabase.com/dashboard/project/orpmntxrcdongxmetbrk/auth/users](https://supabase.com/dashboard/project/orpmntxrcdongxmetbrk/auth/users)

2. Click the **"Add user"** button → **"Create new user"**

3. Fill in:
   - **Email**: `eimribar@gmail.com`
   - **Password**: Choose a secure password (save this!)
   - **Auto Confirm Email**: ✅ Check this box (important!)

4. Click **"Create user"**

5. You should see the user appear in the list with a UUID (copy this ID if shown)

### Step 2: Run the Updated Seed Script
1. Go to SQL Editor:
   [https://supabase.com/dashboard/project/orpmntxrcdongxmetbrk/sql/new](https://supabase.com/dashboard/project/orpmntxrcdongxmetbrk/sql/new)

2. Copy and paste this exact script:

```sql
-- Create Admin Profile for eimribar@gmail.com
DO $$
DECLARE
    v_admin_email VARCHAR := 'eimribar@gmail.com';
    v_admin_name VARCHAR := 'Admin';
    v_admin_id UUID;
    v_org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
    -- Check if organization exists, create if not
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = v_org_id) THEN
        INSERT INTO organizations (id, name, subdomain, primary_color, secondary_color)
        VALUES (
            v_org_id,
            'Deutsch & Co.',
            'deutsch',
            '#2563eb',
            '#10b981'
        );
        RAISE NOTICE 'Organization created';
    END IF;
    
    -- Check if admin profile already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = v_admin_email) THEN
        RAISE NOTICE 'Admin user profile already exists';
        RETURN;
    END IF;
    
    -- Get the auth user ID (MUST exist from Step 1)
    SELECT id INTO v_admin_id 
    FROM auth.users 
    WHERE email = v_admin_email;
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found. Please create user in Supabase Auth first!';
    END IF;
    
    -- Create admin profile
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        organization_id,
        is_active,
        notification_preferences
    ) VALUES (
        v_admin_id,
        v_admin_email,
        v_admin_name,
        'admin',
        v_org_id,
        true,
        '{"email": true, "sms": false, "level": "all"}'::jsonb
    );
    
    RAISE NOTICE 'Admin user profile created successfully!';
END $$;
```

3. Click **"Run"**

4. You should see: `"Admin user profile created successfully!"`

### Step 3: Test Your Admin Login
1. Go to http://localhost:5173
2. Login with:
   - Email: `eimribar@gmail.com`
   - Password: (the one you set in Step 1)
3. You should be logged in as Admin!

## 🔍 Troubleshooting

### If you still get "Auth user not found"
- Make sure you completed Step 1 (creating auth user)
- Check the email matches exactly: `eimribar@gmail.com`
- Verify the user shows in Authentication > Users

### If login doesn't work
- Make sure "Auto Confirm Email" was checked when creating user
- Try resetting password in Supabase Dashboard
- Check browser console for specific errors

### To verify everything is set up
Run this query in SQL Editor:
```sql
-- Check if your admin exists
SELECT 
    u.email,
    u.role,
    u.full_name,
    o.name as organization
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'eimribar@gmail.com';
```

You should see your admin user with role 'admin'.

## 🎯 What Happens Next
Once logged in as admin, you can:
1. Go to Team page
2. Click "Invite Team Member"
3. Invite agency members or viewers
4. They'll receive invitation links
5. No one can sign up without an invitation!

---
**Important**: Never share your admin credentials. As the admin, you control who can access the system.