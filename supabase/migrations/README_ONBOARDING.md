# Onboarding System Setup Guide

## Overview
This guide covers the complete invitation-to-onboarding-to-platform flow for the Princess project.

## Required Migration

Before testing the onboarding system, you MUST run the following migration in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration: `013_user_profile_onboarding.sql`

This migration adds the following critical columns to the `users` table:
- `profile_image` - User avatar
- `title` - Job title
- `department` - Department name
- `bio` - User biography
- `needs_onboarding` - Flag for new users
- `onboarding_completed` - Flag for completed onboarding
- `onboarding_completed_at` - Timestamp of completion

## Complete User Flow

### 1. Invitation Flow
```
Admin sends invitation → User receives email → Click invitation link
```

### 2. Signup Flow
```
/invitation?token=xxx → Create account → Set needs_onboarding=true
```

### 3. First-Time User Flow
```
Sign up → Redirect to /onboarding → Complete 4 steps → Redirect to /dashboard
```

### 4. Returning User Flow
```
Sign in → Check onboarding_completed → Skip onboarding → Direct to /dashboard
```

## How It Works

### New User Detection
When a user signs up through an invitation:
1. The `needs_onboarding` flag is set to `true`
2. The `onboarding_completed` flag is set to `false`
3. AuthGuard detects this and redirects to `/onboarding`

### Onboarding Process
The onboarding has 4 steps:
1. **Profile Picture** - Upload avatar (optional)
2. **Professional Info** - Job title and department
3. **Contact Info** - Phone number (optional)
4. **Bio** - About section (optional)

### Completion
When onboarding is completed:
1. All profile data is saved to the database
2. `onboarding_completed` is set to `true`
3. `needs_onboarding` is set to `false`
4. Confetti celebration plays
5. User is redirected to dashboard

### Returning Users
When a user signs in again:
1. AuthGuard checks `onboarding_completed`
2. If `true`, user goes directly to dashboard
3. If `false`, user is redirected to complete onboarding

## Testing the Flow

### Test in Development Mode (No Supabase)
1. The app works in localStorage mode
2. Profile data is stored locally
3. Onboarding flow works the same way

### Test with Supabase
1. Ensure migration 013 is run
2. Send an invitation from Team page
3. Accept invitation and sign up
4. Complete onboarding
5. Sign out and sign in again to verify skip

## Troubleshooting

### "Failed to save profile" Error
- **Cause**: Missing database columns
- **Fix**: Run migration `013_user_profile_onboarding.sql`

### User stuck in onboarding loop
- **Cause**: `onboarding_completed` not being saved
- **Fix**: Check browser console for errors, ensure migration is run

### User not redirected to onboarding
- **Cause**: `needs_onboarding` flag not set
- **Fix**: Check invitation signup process, ensure flag is set

## Database Flags

| Flag | Purpose | When Set |
|------|---------|----------|
| `needs_onboarding` | Indicates user should complete onboarding | Set to `true` on invitation signup |
| `onboarding_completed` | Indicates user has finished onboarding | Set to `true` when onboarding completes |
| `onboarding_started_at` | Tracks when onboarding began | Set on first onboarding page visit |
| `onboarding_completed_at` | Tracks when onboarding finished | Set when user completes all steps |

## Error Messages

The system provides helpful error messages:
- **Schema errors**: Prompts to run migrations
- **Network errors**: Shows connection issues
- **Validation errors**: Indicates missing required fields

## Security

- Users can only update their own profile
- Profile images are validated (must be image, <5MB)
- Phone numbers are optional for privacy
- Bio and department are optional fields