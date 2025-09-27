# 🧪 Team Management Enhancement - Live Testing Guide

## Prerequisites
1. ✅ App running on http://localhost:5173
2. ✅ Logged in as admin (EIMRI@WEBLOOM.AI)
3. ⚠️ Migration needs to be run in Supabase

## 🗄️ Step 1: Run Database Migration

### Go to Supabase SQL Editor:
https://supabase.com/dashboard/project/orpmntxrcdongxmetbrk/sql/new

### Run this migration:
```sql
-- Copy the entire contents of:
-- /Users/eimribar/Princess/supabase/migrations/002_team_management_enhancement.sql
-- And paste it in the SQL editor, then click "Run"
```

### Verify Migration Success:
Run this query to check new tables exist:
```sql
-- Check if new tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('onboarding_steps', 'agency_pool', 'project_assignments')
ORDER BY table_name;

-- Should return 3 rows
```

## 🎯 Step 2: Test Enhanced Invitation Flow

### 2.1 Open Team Page
1. Navigate to http://localhost:5173/team
2. Click "Invite Team Member" button (green button with UserPlus icon)

### 2.2 Test Single Invitation
1. **Compose Tab**:
   - Enter single email: `test1@example.com`
   - Notice the "1 valid" badge appears
   - Select role (if you have options)
   - Add personal message: "Welcome to the team!"

2. **Preview Tab**:
   - Click "Preview (1)" button
   - Review the email preview showing:
     - Your name as inviter
     - Role-specific message
     - Your personal message
     - Professional formatting

3. **Send Invitation**:
   - Click "Send 1 Invitation"
   - Wait for success state

4. **Success Tab**:
   - See invitation link generated
   - Click copy button to copy link
   - Note the professional success message

### 2.3 Test Batch Invitations
1. Click "Invite More" to reset
2. **Enter multiple emails**:
   ```
   john@example.com
   jane@company.com, sarah@test.com
   invalid-email
   mike@business.com
   ```
3. **Observe validation**:
   - Should show "4 valid" badge
   - Should show "1 invalid" badge
   - Invalid email highlighted in red alert

4. **Preview & Send**:
   - Click "Preview (4)"
   - Review email template
   - Click "Send 4 Invitations"

5. **Success State**:
   - See all 4 invitation links
   - Click "Copy All Links" button
   - Verify all links copied to clipboard

## 🌟 Step 3: Test Welcome Page

### 3.1 Get Test Invitation Token
1. Go to Supabase Dashboard
2. Navigate to Table Editor → invitations
3. Copy a token from the recently created invitations

### 3.2 Visit Welcome Page
1. Open incognito/private browser window
2. Navigate to: `http://localhost:5173/welcome/[TOKEN]`
   - Replace [TOKEN] with actual token from database

### 3.3 Verify Welcome Experience
You should see:
- ✨ Confetti animation on load
- 👤 Inviter information (your name/avatar)
- 🏢 Organization name
- 📋 Role badge showing what role they're invited as
- 📝 Personal message (if provided)
- ⏰ Expiry countdown
- 🎯 Clear "Accept Invitation" button

### 3.4 Test Error States
1. **Invalid token**: Visit `/welcome/invalid-token-123`
   - Should show "Invalid or expired invitation" error

2. **No token**: Visit `/welcome/`
   - Should show "No invitation token provided" error

## 🔍 Step 4: Verify Database Records

### Check Invitations Created
```sql
-- View all invitations
SELECT 
  email,
  role,
  status,
  token,
  expires_at,
  metadata
FROM invitations
ORDER BY created_at DESC
LIMIT 10;
```

### Check Onboarding Tables
```sql
-- Verify onboarding columns added to users
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'onboarding%';

-- Should show:
-- onboarding_completed
-- onboarding_progress
-- onboarding_started_at
-- onboarding_completed_at
```

### Check Agency Pool Structure
```sql
-- Verify agency_pool table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agency_pool'
ORDER BY ordinal_position;
```

## 🎬 Step 5: User Journey Test

### Complete Flow Test:
1. **As Admin**: 
   - Go to Team page
   - Click "Invite Team Member"
   - Enter: `newclient@test.com`
   - Select "Client" role
   - Add message: "Excited to work with you!"
   - Preview → Send

2. **Copy invitation link** from success state

3. **Open incognito window**:
   - Paste invitation link
   - See beautiful welcome page with confetti
   - Click "Accept Invitation"
   - Should redirect to signup page with token

4. **Complete signup** (if in Supabase mode):
   - Email pre-filled
   - Create password
   - Account created with correct role

## 🐛 Troubleshooting

### If invitation dialog doesn't show tabs:
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
- Check browser console for errors

### If welcome page shows error:
- Check token is valid in database
- Verify invitation status is 'pending'
- Check expires_at is in future

### If confetti doesn't appear:
- Check browser console for errors
- Verify canvas-confetti is installed: `npm list canvas-confetti`

## ✅ Success Checklist

- [ ] Can invite single user
- [ ] Can invite multiple users (batch)
- [ ] Email validation works (shows invalid emails)
- [ ] Preview tab shows email template
- [ ] Success tab shows all invitation links
- [ ] Can copy individual and all links
- [ ] Welcome page loads with valid token
- [ ] Confetti animation plays
- [ ] Shows inviter information
- [ ] Shows correct role and organization
- [ ] Invalid tokens show error page
- [ ] Database has invitation records
- [ ] Onboarding tables created

## 📊 What to Look For

### Visual Polish:
- Sparkles icon in dialog header
- Smooth tab transitions
- Badge counters for email validation
- Professional email preview
- Individual invitation cards in success state
- Gradient backgrounds on welcome page
- Animated entrance effects
- Confetti celebration

### Functionality:
- Real-time email validation
- Batch processing works
- Links are unique per invitation
- Token validation on welcome page
- Proper error handling
- Role-specific messaging

## 🎉 Expected Result

You should experience a seamless, professional invitation flow that feels premium and delightful. New users should feel excited and valued when they receive their invitation and visit the welcome page.

---

**Note**: If testing in demo mode (without Supabase), some features like actual database persistence won't work, but the UI flow will demonstrate correctly.