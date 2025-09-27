# 🚨 URGENT: Run This Database Migration NOW

## Why This is Critical
Your sign-up is broken because the database has a foreign key constraint to `auth.users` (from old Supabase Auth) that doesn't exist with Clerk.

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `/supabase/migrations/fix_clerk_integration.sql`
4. Click **Run**
5. You should see "Success" message

### Option 2: Using Supabase CLI
```bash
cd ~/Princess
npx supabase db push
```

## What This Migration Does
1. **Removes** the broken foreign key constraint to `auth.users`
2. **Adds** `clerk_user_id` column to track Clerk users
3. **Adds** missing columns for onboarding flow
4. **Creates** indexes for better performance
5. **Updates** existing admin users to not need onboarding

## Test the Fix
After running the migration:

1. **Try signing up with a new email**:
   - Go to http://localhost:5174/auth/signup
   - Create a new account
   - You should be redirected to dashboard or onboarding

2. **Check the console** for any errors
   - Open browser DevTools (F12)
   - Look for "Successfully created user in Supabase" message

3. **Verify in Supabase**:
   - Go to Supabase Dashboard → Table Editor → users
   - You should see the new user with a `clerk_user_id`

## If You Still Have Issues
Check these things:

1. **Clerk Dashboard Settings**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Check that email/password authentication is enabled
   - Verify redirect URLs are set correctly

2. **Environment Variables**:
   - Make sure `.env.local` has the correct Clerk key
   - Verify Supabase URL and anon key are correct

3. **Browser Console**:
   - Look for specific error messages
   - Check if user is created in Clerk but not Supabase

## Success Indicators
✅ New users can sign up
✅ Users are automatically signed in after signup
✅ Users appear in both Clerk and Supabase
✅ Existing users can still sign in
✅ Onboarding redirects work properly