# Deploy Email Edge Function to Supabase

## Quick Setup Steps

### 1. Login to Supabase CLI
```bash
supabase login
```
This will open your browser to authenticate.

### 2. Link Your Project
```bash
cd /Users/eimribar/Princess
supabase link --project-ref orpmntxrcdongxmetbrk
```

### 3. Deploy the Edge Function
```bash
supabase functions deploy send-invitation
```

### 4. Test the Function (Optional)
```bash
supabase functions invoke send-invitation --body '{
  "email": "test@example.com",
  "inviterName": "Test User",
  "invitationUrl": "https://example.com/invitation",
  "role": "client"
}'
```

## What This Enables

Once deployed, the Princess platform will:
1. **Send actual invitation emails** when you invite team members
2. **Use Supabase's built-in email service** (2 emails/hour limit)
3. **Emails will come from**: `noreply@mail.app.supabase.io`
4. **Recipients will see**: A nicely formatted HTML email with your invitation

## Current Limitations

- **Rate limit**: 2 emails per hour
- **From address**: Cannot customize (Supabase default)
- **Best for**: Testing the complete flow

## How It Works

1. Click "Invite Team Member" in the Team page
2. Enter email addresses
3. Click "Send Invitations"
4. The system will:
   - Create invitation records in database
   - Call the edge function to send emails
   - Show success/failure messages
   - If rate limited, provide links to copy manually

## If Rate Limited

When you hit the 2 email/hour limit:
1. The system will still generate invitation links
2. You'll see them in the "Success" tab
3. Copy the links and send them manually via your preferred method

## Testing the Complete Flow

1. Send an invitation to yourself
2. Check your email (may be in spam initially)
3. Click the invitation link
4. Sign up and complete onboarding
5. Verify you land on the dashboard

## Production Setup (Future)

For production, you'll want to:
1. Configure proper SMTP with your domain
2. Use services like Resend, SendGrid, or AWS SES
3. Send from your domain (e.g., `invites@deutschco.com`)
4. Remove the 2/hour limitation

## Troubleshooting

If emails aren't sending:
1. Check Edge Function logs: `supabase functions logs send-invitation`
2. Verify the function is deployed: `supabase functions list`
3. Check browser console for errors when sending invitations
4. Ensure you're in Supabase mode (not localStorage demo mode)