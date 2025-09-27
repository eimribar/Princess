# Deploy Clerk Invitation Edge Function

## Steps to Deploy

### 1. Login to Supabase CLI (if not already logged in)
```bash
supabase login
```
This will open a browser window for authentication.

### 2. Link your project (if not already linked)
```bash
cd /Users/eimribar/Princess
supabase link --project-ref orpmntxrcdongxmetbrk
```

### 3. Deploy the Edge Function
```bash
supabase functions deploy create-clerk-invitation
```

### 4. Set the required secrets in Supabase Dashboard

Go to your Supabase Dashboard:
1. Navigate to **Edge Functions** → **create-clerk-invitation**
2. Click on **Manage Secrets**
3. Add the following secrets:
   - `CLERK_SECRET_KEY`: sk_test_HqGLXI2JZBtRHEA0ZtCCgQxvxI5nNPAdJsEjpjhkHR
   - `APP_URL`: http://localhost:5174 (for development) or your production URL

### 5. Test the function
The function should now be available and will be called when creating invitations.

## Alternative: Deploy using Access Token

If you prefer not to login through the browser, you can use an access token:

```bash
# Set the access token (get it from Supabase Dashboard → Account → Access Tokens)
export SUPABASE_ACCESS_TOKEN=your_access_token_here

# Then deploy
supabase functions deploy create-clerk-invitation --project-ref orpmntxrcdongxmetbrk
```

## Verify Deployment

After deployment, you can verify in the Supabase Dashboard:
1. Go to **Edge Functions**
2. You should see `create-clerk-invitation` listed
3. Check the logs to ensure it's running correctly

## Test the Complete Flow

1. Go to http://localhost:5174/team
2. Click "Invite Team Member"
3. Fill in the invitation details
4. Click "Create Invitation"
5. The invitation should be created successfully

## Troubleshooting

If the invitation still doesn't work:
1. Check Edge Function logs in Supabase Dashboard
2. Ensure CLERK_SECRET_KEY is set in Edge Function secrets
3. Check browser console for any errors
4. Verify the invitation_tracking table has proper permissions