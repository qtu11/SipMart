-- ========================================
-- Fix RLS và Policies cho tất cả bảng
-- Copy và paste vào Supabase SQL Editor
-- ========================================

-- Enable RLS cho tất cả các bảng (10 bảng còn thiếu)
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
-- USERS POLICIES
-- ========================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

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

-- Admin có thể xem tất cả users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id::text = auth.uid()::text
    )
  );

-- Admin có thể update tất cả users
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id::text = auth.uid()::text
    )
  );

-- Note: Service role (dùng trong API routes) BYPASSES RLS tự động
-- Không cần policy cho service role

-- ========================================
-- ECO ACTIONS POLICIES
-- ========================================
DROP POLICY IF EXISTS "Users can view own eco actions" ON eco_actions;
DROP POLICY IF EXISTS "Users can insert own eco actions" ON eco_actions;

CREATE POLICY "Users can view own eco actions"
  ON eco_actions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own eco actions"
  ON eco_actions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- ========================================
-- CUPS POLICIES
-- ========================================
DROP POLICY IF EXISTS "Anyone can view cups" ON cups;

CREATE POLICY "Anyone can view cups"
  ON cups FOR SELECT
  USING (true);

-- ========================================
-- TRANSACTIONS POLICIES
-- ========================================
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- STORES POLICIES
-- ========================================
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;

CREATE POLICY "Anyone can view stores"
  ON stores FOR SELECT
  USING (true);

-- ========================================
-- ADMINS POLICIES
-- ========================================
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id::text = auth.uid()::text
    )
  );

-- ========================================
-- ADMIN ACTIONS POLICIES
-- ========================================
DROP POLICY IF EXISTS "Admins can view all admin actions" ON admin_actions;

CREATE POLICY "Admins can view all admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id::text = auth.uid()::text
    )
  );

-- ========================================
-- LEADERBOARD POLICIES
-- ========================================
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;

CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- ========================================
-- VIRTUAL TREES POLICIES
-- ========================================
DROP POLICY IF EXISTS "Users can view own virtual trees" ON virtual_trees;

CREATE POLICY "Users can view own virtual trees"
  ON virtual_trees FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- GREEN FEED POSTS POLICIES
-- ========================================
DROP POLICY IF EXISTS "Anyone can view feed posts" ON green_feed_posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON green_feed_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON green_feed_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON green_feed_posts;

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
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

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
DROP POLICY IF EXISTS "Anyone can view post likes" ON post_likes;
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON post_likes;

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
DROP POLICY IF EXISTS "Users can view own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can insert friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update own received requests" ON friend_requests;

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
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (
    auth.uid()::text = user_id_1::text OR 
    auth.uid()::text = user_id_2::text
  );

-- ========================================
-- STORIES POLICIES
-- ========================================
DROP POLICY IF EXISTS "Anyone can view stories" ON stories;
DROP POLICY IF EXISTS "Authenticated users can insert stories" ON stories;
DROP POLICY IF EXISTS "Users can update own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

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
DROP POLICY IF EXISTS "Anyone can view story views" ON story_views;
DROP POLICY IF EXISTS "Authenticated users can insert story views" ON story_views;

CREATE POLICY "Anyone can view story views"
  ON story_views FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert story views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- ========================================
-- NOTIFICATIONS POLICIES
-- ========================================
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

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
-- ✅ DONE!
-- ========================================
-- Note: Service role (dùng trong API routes) BYPASSES RLS tự động
-- API routes sử dụng getSupabaseAdmin() sẽ không bị ảnh hưởng bởi RLS
-- ========================================
