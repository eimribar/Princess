# Invitation-Based Authentication Setup Guide

## Overview
Princess now uses an invitation-only authentication system. Users cannot sign up directly - they must be invited by existing admins or agency members.

## 🚀 Quick Setup Steps

### Step 1: Run Database Migrations
1. Go to your Supabase SQL Editor:
   [https://supabase.com/dashboard/project/orpmntxrcdongxmetbrk/sql/new](https://supabase.com/dashboard/project/orpmntxrcdongxmetbrk/sql/new)

2. Copy and run the migration script:
   ```
   /Users/eimribar/Princess/supabase/migrations/001_invitation_system.sql
   ```

3. This creates:
   - `invitations` table for tracking invitations
   - Functions for invitation management
   - RLS policies for security

### Step 2: Create Your Initial Admin User

#### Option A: Via Supabase Dashboard (Easiest)
1. Go to [Authentication > Users](https://supabase.com/dashboard/project/orpmntxrcdongxmetbrk/auth/users)
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `admin@deutschco.com` (or your email)
   - Password: Choose a secure password
   - Auto Confirm Email: ✅ Check this
4. Click "Create user"

5. Run the admin seed script in SQL Editor:
   ```sql
   -- Copy from: /Users/eimribar/Princess/supabase/seed_admin.sql
   -- Make sure to update the email to match what you created above
   ```

#### Option B: Use the App (After Admin Exists)
Once you have an admin, they can invite others through the app

### Step 3: Test the System

1. **Login as Admin**
   - Go to http://localhost:5173
   - Sign in with your admin credentials

2. **Invite Team Members**
   - Go to Team page
   - Click "Invite Team Member" (green button)
   - Enter email addresses
   - Choose role (Agency or Viewer)
   - Send invitations

3. **Accept Invitations**
   - Copy the invitation link
   - Open in incognito/private browser
   - Create password
   - Join the organization

## 🔐 How It Works

### User Hierarchy
```
Admin
├── Can invite: Agency members, Viewers
├── Can manage: All settings and users
└── Full system access

Agency Member  
├── Can invite: Clients (to specific projects)
├── Can manage: Projects and deliverables
└── Limited admin access

Client
├── Can invite: Nobody
├── Can manage: Approve/decline deliverables
└── View-only access to assigned projects

Viewer
├── Can invite: Nobody
└── Read-only access
```

### Invitation Flow
1. **Admin/Agency** clicks "Invite Team Member"
2. System generates unique token (expires in 7 days)
3. Invitation link: `https://yourapp.com/invitation?token=xxx`
4. Invitee clicks link → Creates password → Joins organization
5. Invitation marked as accepted

### Security Features
- ✅ No open signup - invitation only
- ✅ Tokens expire after 7 days
- ✅ One-time use tokens
- ✅ Role-based invitation permissions
- ✅ Organization boundaries enforced
- ✅ Full audit trail

## 📧 Email Configuration (Future)

To send actual email invitations (currently shows links to copy):

1. **Set up Supabase Email**
   - Configure SMTP settings in Supabase
   - Or use Supabase Edge Functions with SendGrid/Resend

2. **Create Email Templates**
   ```
   Subject: You're invited to join {organization} on Princess
   
   Body:
   {inviter_name} has invited you to join as a {role}.
   
   Click here to accept: {invitation_link}
   
   This invitation expires in 7 days.
   ```

## 🛠️ Troubleshooting

### "Invalid invitation" error
- Token may have expired (7 day limit)
- Invitation already used
- Admin needs to send new invitation

### Can't invite users
- Check your role (must be Admin or Agency)
- Clients cannot invite anyone
- Check if user already exists

### Database errors
- Ensure migration script ran successfully
- Check RLS policies are enabled
- Verify organization exists in database

## 📝 Testing Checklist

- [ ] Admin can login
- [ ] Admin can invite agency members
- [ ] Agency members can invite clients
- [ ] Invitation links work
- [ ] Tokens expire after 7 days
- [ ] Users can't sign up without invitation
- [ ] Login page shows "Contact admin" instead of signup

## 🎯 Next Steps

1. **Production Setup**
   - Configure email sending
   - Set up custom domain
   - Enable SSL

2. **Enhanced Features**
   - Bulk invite from CSV
   - Invitation templates
   - Automatic reminders
   - Analytics dashboard

---

**Need Help?**
- Database issues: Check `/supabase/migrations/`
- UI issues: Check `/src/pages/auth/` and `/src/components/team/`
- Contact your system administrator for access