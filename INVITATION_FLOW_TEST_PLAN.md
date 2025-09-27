# Complete Invitation Flow Test Plan

## Prerequisites
1. Run the database migration to fix foreign key issue:
   ```sql
   -- Run in Supabase SQL Editor
   -- File: /supabase/migrations/015_fix_invitations_foreign_key.sql
   ```

2. Ensure the development server is running:
   ```bash
   PORT=5174 npm run dev
   ```

## Complete Flow Testing Steps

### Step 1: Send an Invitation
1. Navigate to http://localhost:5174
2. Log in with an admin or agency account
3. Go to the Team page (/team)
4. Click "Invite Team Member"
5. Fill in the invitation form:
   - Email: Use a test email address
   - Role: Select appropriate role (client, viewer, etc.)
   - Add any other required details
6. Click "Send Invitation"
7. Check the browser console for the invitation link (since email service isn't configured)

### Step 2: Access the Invitation Link
1. Copy the invitation link from the console (format: `/welcome/{token}`)
2. Open an incognito/private browser window
3. Navigate to the full URL: `http://localhost:5174/welcome/{token}`
4. Verify the Welcome page displays:
   - Invitation details (inviter name, organization, role)
   - "Sign Up" button
   - "Already have an account? Login" button
   - Expiration countdown

### Step 3: Accept the Invitation
1. On the Welcome page, click the "Sign Up" button
2. You should be redirected to `/invitation?token={token}`
3. The InvitationSignup page should display:
   - Pre-filled email (from the invitation)
   - Role information
   - Password and Confirm Password fields
4. Enter a password (minimum 6 characters)
5. Confirm the password
6. Click "Accept Invitation & Create Account"

### Step 4: Complete Onboarding
1. After successful account creation, you'll be redirected to `/onboarding`
2. Complete the onboarding flow:
   - **Step 1**: Upload profile picture (optional - can skip)
   - **Step 2**: Enter job title (required)
   - **Step 3**: Add phone number (optional - can skip)
   - **Step 4**: Write bio (optional - can skip)
3. Click "Complete" to finish onboarding

### Step 5: Access the Platform
1. After onboarding completion, you'll see confetti animation
2. After 3 seconds, automatic redirect to `/dashboard`
3. Verify you can access the platform with appropriate role permissions

## Flow Diagram

```
[Team Page] → Send Invitation → Generate Token → Store in DB
                                       ↓
                              [Email with Link] (manual for now)
                                       ↓
                            [Welcome Page] (/welcome/:token)
                                       ↓
                          Click "Sign Up" → Pass token
                                       ↓
                      [InvitationSignup] (/invitation?token=...)
                                       ↓
                        Create Account → Accept invitation
                                       ↓
                           [Onboarding] (/onboarding)
                                       ↓
                        Complete Profile → Mark onboarding done
                                       ↓
                           [Dashboard] (Full access)
```

## Database Verification

### Check Invitation Status
```sql
-- View all invitations
SELECT id, email, role, status, token, expires_at 
FROM invitations 
ORDER BY created_at DESC;

-- Check specific invitation by token
SELECT * FROM invitations WHERE token = 'YOUR_TOKEN_HERE';
```

### Check User Onboarding Status
```sql
-- View user onboarding flags
SELECT id, email, needs_onboarding, onboarding_completed 
FROM users 
ORDER BY created_at DESC;
```

## Troubleshooting

### Common Issues and Solutions

1. **"Invalid or expired invitation" error**
   - Check if invitation exists in database
   - Verify status is 'pending'
   - Check expiration date

2. **"Failed to save profile" during onboarding**
   - Ensure migration 013 was run (adds profile columns)
   - Check database for missing columns

3. **Foreign key error on Welcome page**
   - Run migration 015 to fix foreign key constraint
   - Verify invitations table has proper structure

4. **No invitation link in console**
   - Check browser console for errors
   - Verify Edge Function deployment (if using)
   - Look for "Invitation created successfully" message

5. **Redirect loop after login**
   - Check user's needs_onboarding flag
   - Verify onboarding_completed is set correctly

## Manual Testing Without Email

Since email service isn't configured, use this approach:
1. After creating invitation, check browser console
2. Copy the success message with the link
3. Manually navigate to the link in a new browser session
4. This simulates clicking the email link

## Success Criteria

✅ Invitation creates successfully with token
✅ Welcome page displays invitation details correctly
✅ Sign Up button passes token to InvitationSignup page
✅ Account creation accepts the invitation
✅ User is redirected to onboarding
✅ Onboarding completion saves all profile data
✅ User can access dashboard after onboarding
✅ Invitation status changes from 'pending' to 'accepted'

## Next Steps for Production

1. **Configure Email Service**
   - Set up Resend or SendGrid
   - Update Edge Function with API keys
   - Test email delivery

2. **Add Email Templates**
   - Create HTML email templates
   - Include branding and styling
   - Add clear CTA buttons

3. **Implement Invitation Management**
   - Resend invitation feature
   - Cancel invitation option
   - Bulk invite functionality

4. **Add Analytics**
   - Track invitation acceptance rate
   - Monitor onboarding completion
   - Measure time to activation