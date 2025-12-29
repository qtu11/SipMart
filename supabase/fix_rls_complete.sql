-- ========================================
-- CupSipSmart - Complete RLS Fix & Schema
-- Fix infinite recursion và đảm bảo admin login hoạt động
-- Copy và paste toàn bộ vào Supabase SQL Editor và chạy
-- ========================================

-- ========================================
-- 1. EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- 2. DROP ALL EXISTING POLICIES (Clean start)
-- ========================================
-- Users (drop tất cả để tránh duplicate)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Public can view user profiles" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins update users" ON users;
DROP POLICY IF EXISTS "Admin full access users" ON users;

-- Eco Actions
DROP POLICY IF EXISTS "Users can view own eco actions" ON eco_actions;
DROP POLICY IF EXISTS "Users can insert own eco actions" ON eco_actions;

-- Cups
DROP POLICY IF EXISTS "Anyone can view cups" ON cups;
DROP POLICY IF EXISTS "Admins manage cups" ON cups;
DROP POLICY IF EXISTS "Admin manage cups" ON cups;

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can manage transactions" ON transactions;
DROP POLICY IF EXISTS "Admins view all tx" ON transactions;
DROP POLICY IF EXISTS "Admin view all tx" ON transactions;

-- Stores
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
DROP POLICY IF EXISTS "Admins manage stores" ON stores;
DROP POLICY IF EXISTS "Admin manage stores" ON stores;

-- Admins (CRITICAL - Fix infinite recursion)
-- Drop tất cả policies dùng check_is_admin() function
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can view admin table" ON admins;
DROP POLICY IF EXISTS "Allow read access for admins" ON admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON admins;
DROP POLICY IF EXISTS "Allow admins to view their own table" ON admins;
DROP POLICY IF EXISTS "Admins can view admins" ON admins;
DROP POLICY IF EXISTS "Admin view admins" ON admins;

-- Admin Actions
DROP POLICY IF EXISTS "Admins can view all admin actions" ON admin_actions;

-- Additional policies that might use check_is_admin()
DROP POLICY IF EXISTS "Admins manage stores" ON stores;
DROP POLICY IF EXISTS "Admin manage stores" ON stores;
DROP POLICY IF EXISTS "Admins update users" ON users;
DROP POLICY IF EXISTS "Admin full access users" ON users;
DROP POLICY IF EXISTS "Admins manage cups" ON cups;
DROP POLICY IF EXISTS "Admin manage cups" ON cups;
DROP POLICY IF EXISTS "Admins view all tx" ON transactions;
DROP POLICY IF EXISTS "Admin view all tx" ON transactions;
DROP POLICY IF EXISTS "Admin manage rewards" ON rewards;
DROP POLICY IF EXISTS "Admin view payments" ON payment_transactions;

-- Leaderboard
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;

-- Virtual Trees
DROP POLICY IF EXISTS "Users can view own virtual trees" ON virtual_trees;
DROP POLICY IF EXISTS "Users can manage own virtual trees" ON virtual_trees;

-- Green Feed Posts
DROP POLICY IF EXISTS "Anyone can view feed posts" ON green_feed_posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON green_feed_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON green_feed_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON green_feed_posts;

-- Comments
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Post Likes
DROP POLICY IF EXISTS "Anyone can view post likes" ON post_likes;
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON post_likes;

-- Friend Requests
DROP POLICY IF EXISTS "Users can view own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can insert friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update own received requests" ON friend_requests;

-- Friendships
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;

-- Stories
DROP POLICY IF EXISTS "Anyone can view stories" ON stories;
DROP POLICY IF EXISTS "Authenticated users can insert stories" ON stories;
DROP POLICY IF EXISTS "Users can update own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

-- Story Views
DROP POLICY IF EXISTS "Anyone can view story views" ON story_views;
DROP POLICY IF EXISTS "Authenticated users can insert story views" ON story_views;

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Additional tables (if they exist)
DROP POLICY IF EXISTS "Admin manage rewards" ON rewards;
DROP POLICY IF EXISTS "Admin view payments" ON payment_transactions;

-- ========================================
-- 3. DROP EXISTING FUNCTIONS (sau khi đã drop policies)
-- ========================================
-- Drop functions với CASCADE để tự động drop dependencies
DROP FUNCTION IF EXISTS public.check_admin_status() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- ========================================
-- 4. CREATE SECURITY DEFINER FUNCTION (Fix infinite recursion)
-- ========================================
-- Function này chạy với quyền của người tạo (superuser), bypass RLS
-- Đây là cách duy nhất để check admin status mà không gây infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check nếu user hiện tại có trong admins table
  -- SECURITY DEFINER cho phép function này bypass RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.admins 
    WHERE admin_id::text = auth.uid()::text
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- ========================================
-- 5. ENABLE RLS ON ALL TABLES
-- ========================================
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS eco_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS virtual_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS green_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. CREATE RLS POLICIES
-- ========================================

-- ========================================
-- USERS POLICIES
-- ========================================
-- Users có thể xem thông tin của chính mình
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users có thể update thông tin của chính mình
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Public có thể xem user profiles (cho leaderboard, search)
CREATE POLICY "Public can view user profiles"
  ON users FOR SELECT
  USING (true);

-- Admin có thể xem tất cả users (dùng function để tránh recursion)
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (public.is_admin_user());

-- Admin có thể update tất cả users
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (public.is_admin_user());

-- ========================================
-- ECO ACTIONS POLICIES
-- ========================================
CREATE POLICY "Users can view own eco actions"
  ON eco_actions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own eco actions"
  ON eco_actions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- ========================================
-- CUPS POLICIES
-- ========================================
CREATE POLICY "Anyone can view cups"
  ON cups FOR SELECT
  USING (true);

-- ========================================
-- TRANSACTIONS POLICIES
-- ========================================
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- STORES POLICIES
-- ========================================
CREATE POLICY "Anyone can view stores"
  ON stores FOR SELECT
  USING (true);

-- ========================================
-- ADMINS POLICIES (CRITICAL - Fix infinite recursion)
-- ========================================
-- Dùng function với SECURITY DEFINER để tránh infinite recursion
-- Function này bypass RLS nên không gây vòng lặp
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (public.is_admin_user());

-- Allow service role to manage admins (for API routes)
-- Service role tự động bypass RLS, không cần policy

-- ========================================
-- ADMIN ACTIONS POLICIES
-- ========================================
CREATE POLICY "Admins can view all admin actions"
  ON admin_actions FOR SELECT
  USING (public.is_admin_user());

-- ========================================
-- LEADERBOARD POLICIES
-- ========================================
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- ========================================
-- VIRTUAL TREES POLICIES
-- ========================================
CREATE POLICY "Users can view own virtual trees"
  ON virtual_trees FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own virtual trees"
  ON virtual_trees FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- ========================================
-- GREEN FEED POSTS POLICIES
-- ========================================
CREATE POLICY "Anyone can view feed posts"
  ON green_feed_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert posts"
  ON green_feed_posts FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own posts"
  ON green_feed_posts FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own posts"
  ON green_feed_posts FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- COMMENTS POLICIES
-- ========================================
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- POST LIKES POLICIES
-- ========================================
CREATE POLICY "Anyone can view post likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- FRIEND REQUESTS POLICIES
-- ========================================
CREATE POLICY "Users can view own friend requests"
  ON friend_requests FOR SELECT
  USING (
    auth.uid()::text = from_user_id::text OR 
    auth.uid()::text = to_user_id::text
  );

CREATE POLICY "Users can insert friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid()::text = from_user_id::text);

CREATE POLICY "Users can update own received requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid()::text = to_user_id::text);

-- ========================================
-- FRIENDSHIPS POLICIES
-- ========================================
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (
    auth.uid()::text = user_id_1::text OR 
    auth.uid()::text = user_id_2::text
  );

-- ========================================
-- STORIES POLICIES
-- ========================================
CREATE POLICY "Anyone can view stories"
  ON stories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- STORY VIEWS POLICIES
-- ========================================
CREATE POLICY "Anyone can view story views"
  ON story_views FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert story views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- ========================================
-- NOTIFICATIONS POLICIES
-- ========================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- 7. GRANT PERMISSIONS
-- ========================================
-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on all tables to authenticated users (RLS will control access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- 8. NOTES
-- ========================================
-- ✅ Service role (SUPABASE_SERVICE_ROLE_KEY) tự động bypass RLS
-- ✅ API routes sử dụng getSupabaseAdmin() sẽ không bị ảnh hưởng bởi RLS
-- ✅ Function is_admin_user() dùng SECURITY DEFINER để bypass RLS khi check admin
-- ✅ Điều này fix infinite recursion trong admins table policy

-- ========================================
-- ✅ COMPLETE!
-- ========================================
-- Next steps:
-- 1. Verify function exists: SELECT * FROM pg_proc WHERE proname = 'is_admin_user';
-- 2. Test admin login
-- 3. Verify tables in Dashboard > Table Editor
-- ========================================

