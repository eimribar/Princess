# Supabase Authentication System - Complete Documentation
*Last Updated: December 12, 2024*

## 🏗️ Architecture Overview

### Authentication Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│   Supabase   │────▶│  Database   │
│  (React)    │◀────│     Auth     │◀────│   (RLS)     │
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │                     │
      ▼                    ▼                     ▼
[UserContext]      [JWT Tokens]         [User Profiles]
```

### Key Components
1. **Supabase Client** (`/src/lib/supabase.js`)
2. **User Context** (`/src/contexts/SupabaseUserContext.jsx`)
3. **Auth Guard** (`/src/guards/SupabaseAuthGuard.jsx`)
4. **Auth Pages** (`/src/pages/auth/`)
5. **Database Schema** (`/supabase/`)

## 📁 File Structure

```
Princess/
├── .env                                    # Supabase credentials (gitignored)
├── src/
│   ├── lib/
│   │   └── supabase.js                   # Supabase client configuration
│   ├── contexts/
│   │   ├── UserContext.jsx               # Old localStorage context (backup)
│   │   └── SupabaseUserContext.jsx       # NEW: Dual-mode auth context
│   ├── guards/
│   │   ├── AuthGuard.jsx                 # Old guard (backup)
│   │   └── SupabaseAuthGuard.jsx         # NEW: Route protection
│   ├── pages/
│   │   └── auth/
│   │       ├── Login.jsx                 # Login page (updated)
│   │       ├── Signup.jsx                 # Old signup (deprecated)
│   │       └── InvitationSignup.jsx      # NEW: Invitation-only signup
│   └── components/
│       └── team/
│           └── InviteTeamMemberDialog.jsx # NEW: Send invitations
└── supabase/
    ├── schema.sql                         # Database tables
    ├── rls_policies.sql                   # Row Level Security
    ├── seed_data.sql                      # Initial data
    ├── seed_admin.sql                     # Admin user setup
    ├── combined_setup.sql                 # All-in-one setup
    └── migrations/
        └── 001_invitation_system.sql      # NEW: Invitation system

```

## 🔐 Authentication System Details

### 1. Dual-Mode Operation
The system can operate in two modes:

**Supabase Mode** (Production)
- Real authentication via Supabase Auth
- User data stored in PostgreSQL
- JWT token-based sessions
- Row Level Security enforced

**LocalStorage Mode** (Development/Demo)
- Falls back when Supabase not configured
- Mock authentication
- Data stored in browser localStorage
- No real security (dev only)

### 2. User Roles & Permissions

| Role | Can Invite | Can Edit | Can Approve | Can Delete | View Admin |
|------|------------|----------|-------------|------------|------------|
| **Admin** | Agency, Viewers | ✅ | ✅ | ✅ | ✅ |
| **Agency** | Clients only | ✅ | ❌ | ❌ | ❌ |
| **Client** | Nobody | ❌ | ✅ (deliverables) | ❌ | ❌ |
| **Viewer** | Nobody | ❌ | ❌ | ❌ | ❌ |

### 3. Invitation System

**Database Tables:**
```sql
invitations
├── id (UUID)
├── token (unique string)
├── email (recipient)
├── role (assigned role)
├── organization_id
├── project_id (optional, for clients)
├── invited_by (user who sent)
├── status (pending/accepted/expired/revoked)
├── expires_at (7 days default)
└── metadata (additional data)
```

**Invitation Flow:**
1. Admin/Agency creates invitation
2. System generates unique token
3. Email sent with link: `/invitation?token=xxx`
4. Recipient clicks link
5. Creates password (email pre-filled)
6. Account created with assigned role
7. Invitation marked as accepted

## 🔑 Environment Configuration

### Required Environment Variables
```bash
# .env file
VITE_SUPABASE_URL=https://orpmntxrcdongxmetbrk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Your anon key
```

### Supabase Project Settings
- **Project URL**: https://orpmntxrcdongxmetbrk.supabase.co
- **Auth Providers**: Email (required), Google (optional)
- **Email Confirmations**: Can be disabled for development
- **Database**: PostgreSQL with RLS enabled

## 📊 Database Schema

### Core Tables
1. **organizations** - Multi-tenancy support
2. **users** - User profiles (extends auth.users)
3. **projects** - Project containers
4. **team_members** - Project team assignments
5. **invitations** - Invitation tracking
6. **stages** - 104-step workflow
7. **deliverables** - Client-facing outputs
8. **notifications** - System alerts

### Row Level Security (RLS)
All tables have RLS policies ensuring:
- Users only see data from their organization
- Role-based access control
- Project-based isolation for clients
- Audit trail protection

## 🚀 Setup Instructions

### Initial Setup (One Time)

1. **Configure Environment**
```bash
# Create .env file
cp .env.example .env
# Add your Supabase credentials
```

2. **Run Database Migrations**
```sql
-- In Supabase SQL Editor, run:
-- 1. /supabase/combined_setup.sql (includes everything)
-- OR run individually:
-- 2. /supabase/schema.sql
-- 3. /supabase/rls_policies.sql
-- 4. /supabase/migrations/001_invitation_system.sql
```

3. **Create Admin User**
```bash
# Step 1: Create auth user in Supabase Dashboard
# Email: eimribar@gmail.com
# Password: [secure password]
# Auto Confirm: ✅

# Step 2: Run seed script in SQL Editor
# /supabase/seed_admin.sql
```

4. **Start Application**
```bash
npm install
npm run dev
# Visit http://localhost:5173
```

## 🔄 Recent Changes (December 12, 2024)

### What We Changed
1. **Removed Open Signup**
   - Deleted public signup route
   - Removed "Sign up" link from login
   - Added "Contact administrator" message

2. **Implemented Invitation System**
   - Created invitations table
   - Added invitation tokens
   - Built invitation acceptance flow
   - Added role-based invitation permissions

3. **Updated Components**
   - Login.jsx - Removed signup link
   - App.jsx - Changed routes for invitation flow
   - Team.jsx - Added "Invite Team Member" button
   - Created InvitationSignup.jsx
   - Created InviteTeamMemberDialog.jsx

4. **Enhanced Security**
   - Invitation tokens expire after 7 days
   - One-time use tokens
   - Role automatically assigned from invitation
   - Organization boundaries enforced

### Migration from Open Signup
**Before**: Anyone could sign up and choose their role
**After**: Only invited users can join with pre-assigned roles

## 🛠️ API Reference

### Supabase Client Methods
```javascript
// Authentication
signIn(email, password)
signUp(email, password, metadata)
signInWithGoogle()
signOut()
getCurrentUser()
getSession()

// Database
from('table').select()
from('table').insert()
from('table').update()
from('table').delete()

// Storage
storage().from('bucket').upload()
storage().from('bucket').download()
```

### Custom Functions (SQL)
```sql
-- Create invitation
create_invitation(email, role, org_id, project_id, metadata)

-- Accept invitation
accept_invitation(token)

-- Create initial admin
create_initial_admin(email, name, org_name)

-- Cleanup expired invitations
cleanup_expired_invitations()
```

## 🐛 Troubleshooting

### Common Issues

**"Supabase not configured"**
- Check .env file exists and has correct values
- Restart dev server after adding environment variables

**"Invalid invitation token"**
- Token expired (7 day limit)
- Already used
- Create new invitation

**"Auth user not found"**
- Must create auth user in Supabase first
- Then run seed script for profile

**Login not working**
- Check email confirmation settings
- Verify user exists in both auth.users and users table
- Check browser console for errors

### Debug Queries
```sql
-- Check if user exists
SELECT * FROM auth.users WHERE email = 'eimribar@gmail.com';
SELECT * FROM users WHERE email = 'eimribar@gmail.com';

-- Check invitations
SELECT * FROM invitations WHERE status = 'pending';

-- Check organization
SELECT * FROM organizations;
```

## 📧 Email Configuration (Future)

### To Enable Email Invitations
1. **Configure SMTP in Supabase**
   - Settings > Project Settings > Email
   - Add SMTP credentials

2. **Or Use Edge Functions**
```javascript
// supabase/functions/send-invitation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  // Send email via SendGrid/Resend/etc
})
```

3. **Email Template**
```html
Subject: Invitation to join Princess

You've been invited to join {organization} as a {role}.

Accept invitation: {link}

This invitation expires in 7 days.
```

## 🔒 Security Best Practices

1. **Never commit .env file**
2. **Use RLS policies for all tables**
3. **Validate roles on both client and server**
4. **Expire tokens after reasonable time**
5. **Log all authentication events**
6. **Use HTTPS in production**
7. **Enable 2FA for admin accounts**
8. **Regular security audits**

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Princess Project Docs](/CLAUDE.md)
- [TODO List](/TODO.md)

## 🆘 Support

For issues:
1. Check this documentation
2. Review `/ADMIN_SETUP_STEPS.md` for admin setup
3. Check Supabase Dashboard logs
4. Contact system administrator

---

*This document contains all authentication-related implementation details for the Princess project. Keep it updated as the system evolves.*