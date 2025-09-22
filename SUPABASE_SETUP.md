# Supabase Setup Guide for Princess

## Prerequisites
- A Supabase account (free tier is sufficient for development)
- Node.js 18+ and npm installed
- Princess project cloned and dependencies installed

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project" 
3. Fill in the project details:
   - **Name**: Princess Dev (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the closest to your location
   - **Pricing Plan**: Free tier is fine for development

4. Wait for the project to be created (takes about 2 minutes)

## Step 2: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Enable **Google** provider (optional):
   - You'll need to set up OAuth credentials in Google Cloud Console
   - Add the redirect URL from Supabase to your Google OAuth app
   - Add the Client ID and Client Secret to Supabase

## Step 3: Set Up the Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query and paste the contents of `/supabase/schema.sql`
3. Click "Run" to create all tables and types
4. Create another query and paste the contents of `/supabase/rls_policies.sql`
5. Click "Run" to set up Row Level Security
6. Optionally, run `/supabase/seed_data.sql` to add initial data

## Step 4: Configure Environment Variables

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (a long JWT token)

3. Create a `.env` file in your Princess project root:
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 5: Update the Application

The application is already configured to work with Supabase. The key files are:

- `/src/lib/supabase.js` - Supabase client configuration
- `/src/contexts/SupabaseUserContext.jsx` - Enhanced user context with Supabase auth
- `/src/pages/auth/Login.jsx` - Login page
- `/src/pages/auth/Signup.jsx` - Signup page
- `/src/guards/SupabaseAuthGuard.jsx` - Route protection

### To use Supabase authentication:

1. Replace the import in your main App.jsx:
```javascript
// Change from:
import { UserProvider } from './contexts/UserContext';
// To:
import { UserProvider } from './contexts/SupabaseUserContext';
```

2. Wrap protected routes with AuthGuard:
```javascript
import AuthGuard from './guards/SupabaseAuthGuard';

// Protected route example
<Route path="/dashboard" element={
  <AuthGuard>
    <Dashboard />
  </AuthGuard>
} />

// Public route example
<Route path="/auth/login" element={
  <AuthGuard requireAuth={false}>
    <Login />
  </AuthGuard>
} />

// Role-based route example
<Route path="/admin" element={
  <AuthGuard allowedRoles={['admin']}>
    <Admin />
  </AuthGuard>
} />
```

## Step 6: Test the Setup

1. Restart your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:5173/auth/login`
3. Try creating a new account
4. Check your email for verification (if email confirmations are enabled)
5. Sign in with your credentials

## Step 7: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates** in Supabase
2. Customize the templates for:
   - Confirmation email
   - Password reset
   - Magic link
   - Invitation

## Step 8: Set Up Storage (Optional)

For file uploads (deliverables, profile pictures):

1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - `avatars` - for profile pictures
   - `deliverables` - for project files
   - `brandbook` - for brand assets

3. Set bucket policies for public/private access as needed

## Fallback Mode

The application automatically falls back to localStorage mode if Supabase is not configured. This allows development without a backend:

- User data is stored in browser localStorage
- No real authentication (demo mode)
- All features work except real-time sync and multi-user collaboration

## Troubleshooting

### "Supabase not configured" error
- Check that your `.env` file exists and has the correct values
- Make sure to restart the dev server after adding environment variables

### Authentication not working
- Verify Email provider is enabled in Supabase
- Check that RLS policies are properly set up
- Look at browser console for specific error messages

### Database queries failing
- Ensure all tables were created successfully
- Check that RLS policies are enabled
- Verify your user has the correct role in the users table

### Google Sign-In not working
- Make sure Google provider is properly configured in Supabase
- Check that redirect URLs match in Google Cloud Console
- Verify Client ID and Secret are correct

## Production Deployment

For production deployment:

1. Use environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Enable additional security features in Supabase:
   - Email confirmations
   - Captcha protection
   - Rate limiting
3. Set up proper email domains for transactional emails
4. Configure custom domain if needed
5. Enable database backups

## Support

For issues specific to:
- **Princess application**: Check `/CLAUDE.md` for technical details
- **Supabase**: Visit [https://supabase.com/docs](https://supabase.com/docs)
- **Database schema**: See `/supabase/schema.sql` for table definitions

---

*Last updated: December 2024*