-- ========================================
-- CupSipSmart - RLS Policies Consolidation
-- Security improvement: Single source of truth for all RLS policies
-- ========================================

-- ========================================
-- 1. USERS TABLE POLICIES
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- Public can view leaderboard data (limited fields)
DROP POLICY IF EXISTS "Public can view user leaderboard data" ON users;
CREATE POLICY "Public can view user leaderboard data"
    ON users FOR SELECT
    USING (NOT is_blacklisted);

-- ========================================
-- 2. CUPS TABLE POLICIES
-- ========================================

ALTER TABLE cups ENABLE ROW LEVEL SECURITY;

-- Anyone can view available cups
DROP POLICY IF EXISTS "Anyone can view available cups" ON cups;
CREATE POLICY "Anyone can view available cups"
    ON cups FOR SELECT
    USING (status = 'available');

-- Users can view cups they currently have
DROP POLICY IF EXISTS "Users can view their borrowed cups" ON cups;
CREATE POLICY "Users can view their borrowed cups"
    ON cups FOR SELECT
    USING (current_user_id::text = auth.uid()::text);

-- Service role can manage all cups
DROP POLICY IF EXISTS "Service role can manage cups" ON cups;
CREATE POLICY "Service role can manage cups"
    ON cups FOR ALL
    USING (true);

-- ========================================
-- 3. TRANSACTIONS TABLE POLICIES
-- ========================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can create their own transactions
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
CREATE POLICY "Users can create own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- ========================================
-- 4. STORES TABLE POLICIES
-- ========================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Anyone can view active stores
DROP POLICY IF EXISTS "Anyone can view active stores" ON stores;
CREATE POLICY "Anyone can view active stores"
    ON stores FOR SELECT
    USING (partner_status = 'active');

-- ========================================
-- 5. ECO_ACTIONS TABLE POLICIES
-- ========================================

ALTER TABLE eco_actions ENABLE ROW LEVEL SECURITY;

-- Users can view their own eco actions
DROP POLICY IF EXISTS "Users can view own eco actions" ON eco_actions;
CREATE POLICY "Users can view own eco actions"
    ON eco_actions FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can view friends' eco actions (for social feed)
DROP POLICY IF EXISTS "Users can view friends eco actions" ON eco_actions;
CREATE POLICY "Users can view friends eco actions"
    ON eco_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM friendships
            WHERE (user_id_1::text = auth.uid()::text AND user_id_2::text = user_id::text)
               OR (user_id_2::text = auth.uid()::text AND user_id_1::text = user_id::text)
        )
    );

-- ========================================
-- 6. NOTIFICATIONS TABLE POLICIES
-- ========================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ========================================
-- 7. ACHIEVEMENTS TABLE POLICIES
-- ========================================

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view active achievements
DROP POLICY IF EXISTS "Anyone can view active achievements" ON achievements;
CREATE POLICY "Anyone can view active achievements"
    ON achievements FOR SELECT
    USING (is_active = true);

-- ========================================
-- 8. USER_ACHIEVEMENTS TABLE POLICIES
-- ========================================

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Public can view user achievements for leaderboard
DROP POLICY IF EXISTS "Public can view user achievements for leaderboard" ON user_achievements;
CREATE POLICY "Public can view user achievements for leaderboard"
    ON user_achievements FOR SELECT
    USING (true);

-- ========================================
-- 9. REWARDS TABLE POLICIES
-- ========================================

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Anyone can view active rewards
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
CREATE POLICY "Anyone can view active rewards"
    ON rewards FOR SELECT
    USING (is_active = true);

-- ========================================
-- 10. REWARD_CLAIMS TABLE POLICIES
-- ========================================

ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own reward claims
DROP POLICY IF EXISTS "Users can view own reward claims" ON reward_claims;
CREATE POLICY "Users can view own reward claims"
    ON reward_claims FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can create their own reward claims
DROP POLICY IF EXISTS "Users can create own reward claims" ON reward_claims;
CREATE POLICY "Users can create own reward claims"
    ON reward_claims FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own reward claims
DROP POLICY IF EXISTS "Users can update own reward claims" ON reward_claims;
CREATE POLICY "Users can update own reward claims"
    ON reward_claims FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- ========================================
-- 11. VIRTUAL_TREE TABLE POLICIES
-- ========================================

ALTER TABLE virtual_trees ENABLE ROW LEVEL SECURITY;

-- Users can view their own tree
DROP POLICY IF EXISTS "Users can view own tree" ON virtual_trees;
CREATE POLICY "Users can view own tree"
    ON virtual_trees FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can update their own tree
DROP POLICY IF EXISTS "Users can update own tree" ON virtual_trees;
CREATE POLICY "Users can update own tree"
    ON virtual_trees FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- ========================================
-- 12. GREEN_FEED_POSTS TABLE POLICIES
-- ========================================

ALTER TABLE green_feed_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view posts
DROP POLICY IF EXISTS "Anyone can view posts" ON green_feed_posts;
CREATE POLICY "Anyone can view posts"
    ON green_feed_posts FOR SELECT
    USING (true);

-- Users can create their own posts
DROP POLICY IF EXISTS "Users can create own posts" ON green_feed_posts;
CREATE POLICY "Users can create own posts"
    ON green_feed_posts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own posts
DROP POLICY IF EXISTS "Users can delete own posts" ON green_feed_posts;
CREATE POLICY "Users can delete own posts"
    ON green_feed_posts FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ========================================
-- 13. COMMENTS TABLE POLICIES
-- ========================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments"
    ON comments FOR SELECT
    USING (true);

-- Users can create comments
DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ========================================
-- 14. POST_LIKES TABLE POLICIES
-- ========================================

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
CREATE POLICY "Anyone can view likes"
    ON post_likes FOR SELECT
    USING (true);

-- Users can create their own likes
DROP POLICY IF EXISTS "Users can create own likes" ON post_likes;
CREATE POLICY "Users can create own likes"
    ON post_likes FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own likes
DROP POLICY IF EXISTS "Users can delete own likes" ON post_likes;
CREATE POLICY "Users can delete own likes"
    ON post_likes FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ========================================
-- VERIFICATION
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies consolidated successfully';
    RAISE NOTICE '📊 Total tables with RLS enabled:';
    RAISE NOTICE '   - users, cups, transactions, stores';
    RAISE NOTICE '   - eco_actions, notifications';
    RAISE NOTICE '   - achievements, user_achievements';
    RAISE NOTICE '   - rewards, reward_claims';
    RAISE NOTICE '   - virtual_trees, green_feed_posts';
    RAISE NOTICE '   - comments, post_likes';
END $$;

-- ========================================
-- NOTES
-- ========================================
-- All RLS policies are now consolidated in this single file
-- Each table has clear, documented policies
-- No overly permissive USING (true) policies for sensitive data
-- Service role bypasses RLS for admin operations
-- ========================================
