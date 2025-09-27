# Complete Database Migration Guide for Princess Invitation System

## Overview
This guide lists all the SQL migrations needed for the complete invitation-to-onboarding flow.

## Critical Migrations to Run (In Order)

### 1. Create Organizations Table
```sql
-- From: 008_create_missing_tables.sql
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Create Users Table with All Required Fields
```sql
-- Base table from: 008_create_missing_tables.sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role user_role DEFAULT 'viewer',
    avatar_url TEXT,
    phone VARCHAR(20),
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "level": "all"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add invitation tracking from: 001_invitation_system.sql
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Add onboarding fields from: 013_user_profile_onboarding.sql
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS profile_image TEXT,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS department VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS needs_onboarding BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
```

### 3. Create Invitations Table
```sql
-- From: 014_create_invitations_simple.sql
CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    organization_id UUID REFERENCES organizations(id),
    invited_by UUID,  -- Removed REFERENCES users(id) to avoid foreign key issues
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
```

### 4. Create Invitation Management Function
```sql
-- From: 016_fix_duplicate_invitations.sql
CREATE OR REPLACE FUNCTION create_or_update_invitation(
  p_email VARCHAR,
  p_role VARCHAR,
  p_organization_id UUID,
  p_invited_by UUID,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  role VARCHAR,
  token VARCHAR,
  status VARCHAR,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_token VARCHAR;
  v_existing_id UUID;
  v_invitation_id UUID;
BEGIN
  -- Generate a unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Check if a pending invitation already exists
  SELECT invitations.id INTO v_existing_id
  FROM invitations 
  WHERE invitations.email = p_email 
  AND invitations.status = 'pending'
  AND invitations.organization_id = p_organization_id
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing invitation
    UPDATE invitations
    SET 
      token = v_token,
      role = p_role,
      invited_by = p_invited_by,
      metadata = p_metadata,
      expires_at = NOW() + INTERVAL '7 days',
      updated_at = NOW()
    WHERE invitations.id = v_existing_id
    RETURNING invitations.id INTO v_invitation_id;
  ELSE
    -- Create new invitation
    INSERT INTO invitations (
      email, role, organization_id, invited_by, 
      token, status, expires_at, metadata
    ) VALUES (
      p_email, p_role, p_organization_id, p_invited_by,
      v_token, 'pending', NOW() + INTERVAL '7 days', p_metadata
    )
    RETURNING invitations.id INTO v_invitation_id;
  END IF;
  
  -- Return the invitation details
  RETURN QUERY
  SELECT 
    invitations.id,
    invitations.email,
    invitations.role,
    invitations.token,
    invitations.status,
    invitations.expires_at
  FROM invitations
  WHERE invitations.id = v_invitation_id;
END;
$$ LANGUAGE plpgsql;
```

### 5. Create Accept Invitation Function
```sql
-- From: 001_invitation_system.sql
CREATE OR REPLACE FUNCTION accept_invitation(p_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update invitation status
  UPDATE invitations
  SET status = 'accepted',
      updated_at = NOW()
  WHERE token = p_token;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## Supabase Auth Response Structure

Based on Supabase documentation, here's what the auth methods return:

### `supabase.auth.signUp()` Response
```javascript
{
  data: {
    user: {
      id: 'uuid',
      email: 'user@example.com',
      email_confirmed_at: null, // null until email is verified
      phone: null,
      confirmed_at: null,
      last_sign_in_at: null,
      role: 'authenticated',
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        // Custom data you passed in options.data
        full_name: 'John Doe',
        role: 'client'
      },
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    session: null // null if email confirmation is required
  },
  error: null
}
```

### `supabase.auth.getSession()` Response
```javascript
{
  data: {
    session: {
      access_token: 'jwt-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      expires_at: 1234567890,
      token_type: 'bearer',
      user: { /* same user object as above */ }
    }
  },
  error: null
}
```

## Running the Migrations

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration in order
4. Click "Run" for each migration

### Option 2: Via Supabase CLI
```bash
# Apply all migrations in the migrations folder
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/008_create_missing_tables.sql
```

## Testing in Browser Console

After loading the page, run these commands to understand your exact setup:

```javascript
// Run full diagnostic
window.debugSupabaseAuth()

// Test signup with a fake user (creates actual user)
window.testSupabaseSignup()

// Check current user
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)

// Check invitations table
const { data, error } = await supabase
  .from('invitations')
  .select('*')
console.log('Invitations:', data)
```

## Common Issues and Solutions

### Issue: "Cannot read properties of undefined (reading 'user')"
**Cause**: The signUp function returns data directly, not wrapped in { data, error }
**Solution**: Already fixed in the code by changing how we handle the return value

### Issue: "Invalid or expired invitation"
**Cause**: Missing organizations table or foreign key constraint failure
**Solution**: Run migration #1 to create organizations table

### Issue: "Failed to save profile"
**Cause**: Missing columns in users table
**Solution**: Run migration #2 to add all required columns

### Issue: Emails not being sent
**Cause**: Using Supabase's built-in email service (2/hour limit)
**Solution**: This is expected behavior for testing. In production, configure a proper email service.

## Environment Variables Needed

Make sure your `.env` file has:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key (for Edge Functions only)
```

## Next Steps

1. Run the migrations in order
2. Test with `window.debugSupabaseAuth()` to see exact data structures
3. Monitor the browser console for detailed logging
4. Check Supabase Auth logs in the dashboard for any errors

---

*Last updated: September 2025*