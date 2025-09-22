-- Seed Initial Admin User
-- Run this after the invitation system migration
-- Replace the email and name with your actual admin details

-- Option 1: Create admin directly (for initial setup only)
-- First, you need to create an auth user via Supabase Dashboard or API
-- Then run this to create the corresponding user profile:

DO $$
DECLARE
    v_admin_email VARCHAR := 'eimribar@gmail.com'; -- Your admin email
    v_admin_name VARCHAR := 'Admin'; -- Your name
    v_admin_id UUID;
    v_org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Default org from seed data
BEGIN
    -- Check if organization exists
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = v_org_id) THEN
        INSERT INTO organizations (id, name, subdomain, primary_color, secondary_color)
        VALUES (
            v_org_id,
            'Deutsch & Co.',
            'deutsch',
            '#2563eb',
            '#10b981'
        );
    END IF;
    
    -- Check if admin already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = v_admin_email) THEN
        RAISE NOTICE 'Admin user already exists';
        RETURN;
    END IF;
    
    -- Get the auth user ID (must exist in auth.users first)
    SELECT id INTO v_admin_id 
    FROM auth.users 
    WHERE email = v_admin_email;
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found. Please create user in Supabase Auth first with email: %', v_admin_email;
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
    
    RAISE NOTICE 'Admin user created successfully';
END $$;

-- Option 2: Quick setup for development
-- This creates a default admin for testing
-- Email: admin@deutschco.com
-- You'll need to reset the password via Supabase Dashboard

/*
Steps to set up admin user:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" > "Create new user"
3. Enter:
   - Email: admin@deutschco.com (or your preferred email)
   - Password: (set a secure password)
   - Uncheck "Auto Confirm Email" if you want to test email confirmation
4. Click "Create user"
5. Run this SQL script to create the user profile
6. You can now login as admin

Alternative: Use Supabase CLI or API to create the user programmatically
*/