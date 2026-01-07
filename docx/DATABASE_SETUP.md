# CupSipSmart Database Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Supabase account: https://supabase.com
- Project created in Supabase dashboard

### 2. Run the Migration

**Option A: Via Supabase Dashboard**
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click "New Query"
4. Copy the entire content of `supabase/migrations/001_initial_schema.sql`
5. Paste into the editor
6. Click "Run" button

**Option B: Via Supabase CLI**
```bash
# Install Supabase CLI
npm i supabase --save-dev

# Login
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Run migration
npx supabase db push
```

### 3. Verify Setup

Run this query in SQL Editor to check all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 14 tables:
- users
- eco_actions
- cups
- stores
- transactions
- admins
- green_feed_posts
- comments
- post_likes
- friend_requests
- friendships
- stories
- story_views
- notifications

### 4. Environment Variables

Update your `.env.local` with Supabase credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Login (already in README)
NEXT_PUBLIC_ADMIN_KEY=qtusadmin@gmail.com
NEXT_PUBLIC_ADMIN_PASSWORD=qtusdev
```

## 📋 Post-Setup Tasks

### Configure Authentication

1. **Enable Email Provider**
   - Dashboard → Authentication → Providers
   - Enable "Email"
   - Turn OFF "Confirm email" for development (ON for production)

2. **Enable Google OAuth**
   - Dashboard → Authentication → Providers
   - Enable "Google"
   - Add your Google Client ID & Secret
   - Set authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

3. **Set Site URL**
   - Dashboard → Authentication → URL Configuration
   - Site URL: `https://cupsipmart-uefedu-qt.vercel.app` (dev) or your production URL
   - Redirect URLs: Add `https://cupsipmart-uefedu-qt.vercel.app/**` and production URLs

### Optional: Add Sample Data

Run this to add sample stores:

```sql
INSERT INTO stores (name, gps_lat, gps_lng, address, cup_total, cup_available) VALUES
('Cafe Central QTUS', 10.870461, 106.801839, 'QuyNhon University, BinaDistrict', 100, 100),
('Library Cafe', 10.870461, 106.801839, 'QuyNhon University Library', 50, 50),
('Student Center', 10.870461, 106.801839, 'QTUS Student Center', 75, 75);
```

## ✅ Testing

After setup, test these endpoints:

```bash
# Health check
curl https://cupsipmart-uefedu-qt.vercel.app/api/stores

# Should return list of stores
```

## 🔧 Troubleshooting

### Issue: RLS policies blocking operations

**Solution**: Make sure you're using the service role key for server-side operations.
The helpers in `lib/supabase/server.ts` use `getSupabaseAdmin()` which bypasses RLS.

### Issue: User creation fails

**Check**:
1. Is the `users` table created?
2. Are RLS policies enabled?
3. Is service role key correct in `.env.local`?

### Issue: Cannot create admin

**Solution**: Manually create admin user in Supabase Auth first:
1. Dashboard → Authentication → Users
2. Click "Add user"
3. Email: `qtusadmin@gmail.com`
4. Password: `qtusdev`
5. **IMPORTANT**: Check "Auto Confirm User"
6. Click "Create User"
7. Then login will work

## 🎯 Next Steps

After database is set up:

1. Start dev server: `npm run dev`
2. Test registration at `https://cupsipmart-uefedu-qt.vercel.app/auth/register`
3. Test login at `https://cupsipmart-uefedu-qt.vercel.app/auth/login`
4. Test admin login with credentials from README

---

**Need help?** Check the full migration walkthrough in the brain artifacts.
