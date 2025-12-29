-- ========================================
-- CupSipSmart - Safe RLS Fix
-- Drop tất cả policies và functions một cách an toàn
-- Copy và paste toàn bộ vào Supabase SQL Editor và chạy
-- ========================================

-- ========================================
-- STEP 1: DROP ALL POLICIES (trước khi drop functions)
-- ========================================

-- Drop tất cả policies trên tất cả tables
-- Dùng DO block để drop động tất cả policies

DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop tất cả policies trên tất cả tables
  FOR r IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ========================================
-- STEP 2: DROP ALL FUNCTIONS (sau khi đã drop policies)
-- ========================================

DROP FUNCTION IF EXISTS public.check_admin_status() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- ========================================
-- STEP 3: CREATE NEW FUNCTION (Fix infinite recursion)
-- ========================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admins 
    WHERE admin_id::text = auth.uid()::text
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- ========================================
-- STEP 4: ENABLE RLS ON ALL TABLES
-- ========================================

-- Core tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS eco_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_roles ENABLE ROW LEVEL SECURITY;
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

-- Additional tables
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_challenges ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 5: CREATE RLS POLICIES
-- ========================================

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view user profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (public.is_admin_user());

-- Eco Actions policies
CREATE POLICY "Users can view own eco actions"
  ON eco_actions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own eco actions"
  ON eco_actions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Cups policies
CREATE POLICY "Anyone can view cups"
  ON cups FOR SELECT
  USING (true);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Stores policies
CREATE POLICY "Anyone can view stores"
  ON stores FOR SELECT
  USING (true);

-- Admins policies (CRITICAL - Fix infinite recursion)
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (public.is_admin_user());

-- Admin Actions policies
CREATE POLICY "Admins can view all admin actions"
  ON admin_actions FOR SELECT
  USING (public.is_admin_user());

-- Leaderboard policies
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Virtual Trees policies
CREATE POLICY "Users can view own virtual trees"
  ON virtual_trees FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own virtual trees"
  ON virtual_trees FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Green Feed Posts policies
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

-- Comments policies
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

-- Post Likes policies
CREATE POLICY "Anyone can view post likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Friend Requests policies
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

-- Friendships policies
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (
    auth.uid()::text = user_id_1::text OR 
    auth.uid()::text = user_id_2::text
  );

-- Stories policies
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

-- Story Views policies
CREATE POLICY "Anyone can view story views"
  ON story_views FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert story views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Notifications policies
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
-- ADDITIONAL TABLES POLICIES
-- ========================================

-- Achievements policies
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- User Achievements policies
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Campaigns policies
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage campaigns"
  ON campaigns FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Challenges policies
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
  ON challenges FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- User Challenges policies
CREATE POLICY "Users can view own challenges"
  ON user_challenges FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own challenges"
  ON user_challenges FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Game Scores policies
CREATE POLICY "Users can view own game scores"
  ON game_scores FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own game scores"
  ON game_scores FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Incidents policies
CREATE POLICY "Users can view own incidents"
  ON incidents FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all incidents"
  ON incidents FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Admins can update incidents"
  ON incidents FOR UPDATE
  USING (public.is_admin_user());

-- Payment Methods policies
CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Payment Transactions policies
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  USING (public.is_admin_user());

-- Rewards policies
CREATE POLICY "Anyone can view active rewards"
  ON rewards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage rewards"
  ON rewards FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Reward Claims policies
CREATE POLICY "Users can view own reward claims"
  ON reward_claims FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own reward claims"
  ON reward_claims FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own reward claims"
  ON reward_claims FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- System Settings policies
CREATE POLICY "Anyone can view system settings"
  ON system_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage system settings"
  ON system_settings FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Admin Roles policies
CREATE POLICY "Admins can view admin roles"
  ON admin_roles FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Admins can manage admin roles"
  ON admin_roles FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ========================================
-- STEP 6: GRANT PERMISSIONS
-- ========================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- ✅ COMPLETE!
-- ========================================
-- Key fixes:
-- 1. ✅ Drop tất cả policies động (không cần biết tên chính xác)
-- 2. ✅ Drop functions với CASCADE
-- 3. ✅ Tạo lại function is_admin_user() với SECURITY DEFINER
-- 4. ✅ Tạo lại tất cả policies đúng
-- 5. ✅ Fix infinite recursion trong admins table
-- ========================================

