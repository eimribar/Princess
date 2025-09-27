# Complete Invitation Flow Testing Guide

## Overview
This guide will help you test the complete invitation flow from sending an invitation to verifying role-based access.

## Prerequisites
1. You must be logged in as an admin or agency user to send invitations
2. Have access to the recipient's email inbox
3. The app should be running on http://localhost:5174

## Testing Steps

### Step 1: Send an Invitation

1. Log in as admin user (imri@webloom.ai or another admin)
2. Navigate to the **Team** page
3. Click **"Invite Team Member"** button
4. Fill in the invitation form:

#### Test Case 1: Agency Team Member (Non-Decision Maker)
```
Email: test-agency@example.com
Role: Agency
Decision Maker: No
```

#### Test Case 2: Client Team Member (Non-Decision Maker)
```
Email: test-client@example.com  
Role: Client
Decision Maker: No
Project: Select a project
```

#### Test Case 3: Client Decision Maker
```
Email: test-decision@example.com
Role: Client
Decision Maker: Yes
Project: Select a project
Title: CEO (optional)
Department: Executive (optional)
```

### Step 2: Check the Invitation Email

1. Check the recipient's email inbox
2. Look for an email from **Clerk** (not Supabase)
3. The email should contain:
   - Welcome message
   - Invitation to join Princess
   - "Accept Invitation" button/link

### Step 3: Accept the Invitation

1. Click the "Accept Invitation" link in the email
2. You should be redirected to: `http://localhost:5174/invitation/accept?__clerk_ticket=...`
3. The page should show "Accept Your Invitation"

### Step 4: Sign Up Process

For new users (first-time invitation):

1. You should see a sign-up form with:
   - First Name field
   - Last Name field  
   - Password field
   - Confirm Password field

2. Fill in the form:
   ```
   First Name: Test
   Last Name: User
   Password: TestPass123!
   Confirm Password: TestPass123!
   ```

3. Click "Create Account & Join"

### Step 5: Onboarding

After successful sign-up:

1. You should be redirected to `/onboarding`
2. Complete the onboarding steps:
   - Upload profile picture (optional)
   - Add professional info
   - Add contact info
   - Add bio

3. Click "Complete Onboarding"

### Step 6: Dashboard Access

After onboarding, verify role-based access:

#### For Agency Team Members:
- ✅ Can see all stages and deliverables
- ✅ Can edit project items
- ✅ Can see internal comments
- ✅ Can access Admin section
- ❌ Cannot approve client deliverables

#### For Client Team Members (Non-Decision Maker):
- ✅ Can see client-facing stages only
- ✅ Can view deliverables
- ✅ Can add comments
- ❌ Cannot see internal comments
- ❌ Cannot approve/decline deliverables
- ❌ Cannot access Admin section

#### For Client Decision Makers:
- ✅ All client team member permissions
- ✅ **CAN approve/decline deliverables**
- ✅ See "Decision Maker" badge in UI
- ✅ Receive approval notifications

### Step 7: Verify Role Indicators

1. Check the sidebar - you should see:
   - Your name and email
   - Role badge (Admin/Agency/Client)
   - Decision Maker badge (if applicable)

2. Navigate to Team page:
   - Your team member card should show correct role
   - Decision makers should have a star icon

### Step 8: Test Approval Permissions

1. Navigate to a deliverable in "submitted" status
2. Verify button visibility:

#### Admin/Agency:
- Cannot see Approve/Decline buttons (conflict of interest)

#### Client (Non-Decision Maker):
- Cannot see Approve/Decline buttons

#### Client (Decision Maker):
- ✅ CAN see Approve/Decline buttons
- ✅ Can approve with comments
- ✅ Can decline with required feedback

## Troubleshooting

### Issue: "Invalid or expired invitation"
- The invitation link may have expired (30 days)
- Try sending a new invitation

### Issue: Signed in as wrong user
1. Sign out completely using UserButton → Sign Out
2. Clear browser cookies for localhost:5174
3. Try accepting invitation in incognito/private window

### Issue: No Decision Maker badge showing
1. Check team_members table in Supabase
2. Verify is_decision_maker = true for the user
3. Refresh the page

### Issue: Can't see Approve button as Decision Maker
1. Verify the deliverable status is "submitted"
2. Check browser console for errors
3. Verify you're on the correct project

## Database Verification

To verify data in Supabase:

```sql
-- Check users table
SELECT * FROM users WHERE email = 'test-email@example.com';

-- Check team_members table  
SELECT * FROM team_members WHERE email = 'test-email@example.com';

-- Check invitation_tracking table
SELECT * FROM invitation_tracking WHERE email = 'test-email@example.com';
```

## Success Criteria

✅ Invitation email received from Clerk
✅ Sign-up process with password creation works
✅ Metadata (role, project, decision maker) transfers correctly
✅ User record created in Supabase
✅ Team member record created with correct role
✅ Role-based dashboard filtering works
✅ Decision makers can approve/decline
✅ Non-decision makers cannot approve/decline
✅ Role indicators display correctly
✅ No session mixing between users

## Notes

- Maximum 2 decision makers per project per client team
- Invitations expire after 30 days
- Users need to sign up even if invited (security requirement)
- All invitation metadata is stored in Clerk's public_metadata