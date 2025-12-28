-- ========================================
-- CupSipSmart - Complete Database Schema for Supabase (PostgreSQL)
-- File này chứa toàn bộ schema, functions, triggers, và policies
-- Copy và paste toàn bộ vào Supabase SQL Editor và chạy
-- ========================================

-- ========================================
-- 1. EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search (if needed)

-- ========================================
-- 2. USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar TEXT,
  wallet_balance DECIMAL(10, 2) DEFAULT 0 CHECK (wallet_balance >= 0),
  green_points INTEGER DEFAULT 0 CHECK (green_points >= 0),
  rank_level TEXT DEFAULT 'seed' CHECK (rank_level IN ('seed', 'sprout', 'sapling', 'tree', 'forest')),
  total_cups_saved INTEGER DEFAULT 0 CHECK (total_cups_saved >= 0),
  total_plastic_reduced INTEGER DEFAULT 0 CHECK (total_plastic_reduced >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  blacklist_count INTEGER DEFAULT 0 CHECK (blacklist_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_blacklisted ON users(is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_users_green_points ON users(green_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_rank_level ON users(rank_level);

-- ========================================
-- 3. ECO ACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS eco_actions (
  action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('borrow', 'return', 'checkin', 'share')),
  cup_id TEXT,
  points INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  description TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eco_actions_user_id ON eco_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_eco_actions_timestamp ON eco_actions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eco_actions_type ON eco_actions(type);
CREATE INDEX IF NOT EXISTS idx_eco_actions_cup_id ON eco_actions(cup_id) WHERE cup_id IS NOT NULL;

-- ========================================
-- 4. CUPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS cups (
  cup_id TEXT PRIMARY KEY,
  material TEXT NOT NULL CHECK (material IN ('pp_plastic', 'bamboo_fiber')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'cleaning', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_cleaned_at TIMESTAMPTZ,
  total_uses INTEGER DEFAULT 0 CHECK (total_uses >= 0),
  current_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  current_transaction_id UUID
);

CREATE INDEX IF NOT EXISTS idx_cups_status ON cups(status);
CREATE INDEX IF NOT EXISTS idx_cups_current_user ON cups(current_user_id) WHERE current_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cups_material ON cups(material);
CREATE INDEX IF NOT EXISTS idx_cups_created_at ON cups(created_at DESC);

-- ========================================
-- 5. STORES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS stores (
  store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  gps_lat DECIMAL(10, 8) NOT NULL CHECK (gps_lat >= -90 AND gps_lat <= 90),
  gps_lng DECIMAL(11, 8) NOT NULL CHECK (gps_lng >= -180 AND gps_lng <= 180),
  address TEXT NOT NULL,
  cup_available INTEGER DEFAULT 0 CHECK (cup_available >= 0),
  cup_in_use INTEGER DEFAULT 0 CHECK (cup_in_use >= 0),
  cup_cleaning INTEGER DEFAULT 0 CHECK (cup_cleaning >= 0),
  cup_total INTEGER DEFAULT 0 CHECK (cup_total >= 0),
  partner_status TEXT DEFAULT 'active' CHECK (partner_status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(partner_status);
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(gps_lat, gps_lng);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- ========================================
-- 6. TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  cup_id TEXT NOT NULL REFERENCES cups(cup_id) ON DELETE CASCADE,
  borrow_store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE RESTRICT,
  return_store_id UUID REFERENCES stores(store_id) ON DELETE RESTRICT,
  borrow_time TIMESTAMPTZ DEFAULT NOW(),
  due_time TIMESTAMPTZ NOT NULL,
  return_time TIMESTAMPTZ,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'overdue', 'cancelled')),
  deposit_amount DECIMAL(10, 2) NOT NULL CHECK (deposit_amount >= 0),
  refund_amount DECIMAL(10, 2) CHECK (refund_amount >= 0),
  green_points_earned INTEGER CHECK (green_points_earned >= 0),
  is_overdue BOOLEAN DEFAULT false,
  overdue_hours INTEGER CHECK (overdue_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cup_id ON transactions(cup_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_borrow_time ON transactions(borrow_time DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_due_time ON transactions(due_time) WHERE status = 'ongoing';
CREATE INDEX IF NOT EXISTS idx_transactions_borrow_store ON transactions(borrow_store_id);

-- ========================================
-- 7. ADMINS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS admins (
  admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'store_admin')),
  store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_store_id ON admins(store_id) WHERE store_id IS NOT NULL;

-- ========================================
-- 8. ADMIN ACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS admin_actions (
  action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(type);

-- ========================================
-- 9. LEADERBOARD TABLE (Cached)
-- ========================================
CREATE TABLE IF NOT EXISTS leaderboard (
  entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar TEXT,
  green_points INTEGER DEFAULT 0 CHECK (green_points >= 0),
  total_cups_saved INTEGER DEFAULT 0 CHECK (total_cups_saved >= 0),
  rank INTEGER NOT NULL CHECK (rank > 0),
  department TEXT,
  class TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(green_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cups_saved ON leaderboard(total_cups_saved DESC);

-- ========================================
-- 10. VIRTUAL TREES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS virtual_trees (
  tree_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  growth DECIMAL(5, 2) DEFAULT 0 CHECK (growth >= 0 AND growth <= 100),
  health TEXT DEFAULT 'healthy' CHECK (health IN ('healthy', 'wilting', 'dead')),
  last_watered TIMESTAMPTZ DEFAULT NOW(),
  total_waterings INTEGER DEFAULT 0 CHECK (total_waterings >= 0)
);

CREATE INDEX IF NOT EXISTS idx_virtual_trees_user_id ON virtual_trees(user_id);

-- ========================================
-- 11. GREEN FEED POSTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS green_feed_posts (
  post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_name TEXT,
  avatar TEXT,
  image_url TEXT NOT NULL,
  caption TEXT,
  cup_id TEXT,
  green_points_earned INTEGER DEFAULT 0 CHECK (green_points_earned >= 0),
  likes INTEGER DEFAULT 0 CHECK (likes >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON green_feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON green_feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_likes ON green_feed_posts(likes DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_cup_id ON green_feed_posts(cup_id) WHERE cup_id IS NOT NULL;

-- ========================================
-- 12. COMMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES green_feed_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ========================================
-- 13. POST LIKES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS post_likes (
  like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES green_feed_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- ========================================
-- 14. FRIEND REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS friend_requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- ========================================
-- 15. FRIENDSHIPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS friendships (
  friendship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2) -- Ensure consistent ordering
);

CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user_id_2);

-- ========================================
-- 16. STORIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS stories (
  story_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_name TEXT,
  avatar TEXT,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'achievement', 'milestone')),
  content TEXT NOT NULL,
  thumbnail TEXT,
  achievement_type TEXT CHECK (achievement_type IN ('cup_saved', 'points', 'rank_up', 'challenge')),
  achievement_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_type ON stories(type);

-- ========================================
-- 17. STORY VIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS story_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON story_views(user_id);

-- ========================================
-- 18. NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'info', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- ========================================
-- 19. FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE green_feed_posts
    SET likes = likes + 1
    WHERE post_id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE green_feed_posts
    SET likes = GREATEST(likes - 1, 0)
    WHERE post_id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to clean expired stories (can be called by cron)
CREATE OR REPLACE FUNCTION clean_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM stories
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Function to update leaderboard (can be called periodically)
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS void AS $$
BEGIN
  -- Clear existing leaderboard
  TRUNCATE leaderboard;
  
  -- Recalculate and insert top users
  INSERT INTO leaderboard (user_id, display_name, avatar, green_points, total_cups_saved, rank, updated_at)
  SELECT 
    user_id,
    display_name,
    avatar,
    green_points,
    total_cups_saved,
    ROW_NUMBER() OVER (ORDER BY green_points DESC, total_cups_saved DESC)::INTEGER AS rank,
    NOW()
  FROM users
  WHERE is_blacklisted = false
  ORDER BY green_points DESC, total_cups_saved DESC
  LIMIT 1000;
END;
$$ language 'plpgsql';

-- ========================================
-- 20. TRIGGERS
-- ========================================

-- Trigger for leaderboard updated_at
DROP TRIGGER IF EXISTS update_leaderboard_updated_at ON leaderboard;
CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update post likes count
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- ========================================
-- 21. ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cups ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 22. RLS POLICIES
-- ========================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Public can view user profiles" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

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
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id::text = auth.uid()::text
    )
  );

-- Eco Actions policies
DROP POLICY IF EXISTS "Users can view own eco actions" ON eco_actions;
DROP POLICY IF EXISTS "Users can insert own eco actions" ON eco_actions;

CREATE POLICY "Users can view own eco actions"
  ON eco_actions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own eco actions"
  ON eco_actions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Cups policies
DROP POLICY IF EXISTS "Anyone can view cups" ON cups;

CREATE POLICY "Anyone can view cups"
  ON cups FOR SELECT
  USING (true);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can manage transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Stores policies
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;

CREATE POLICY "Anyone can view stores"
  ON stores FOR SELECT
  USING (true);

-- Admins policies
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id::text = auth.uid()::text
    )
  );

-- Admin Actions policies
DROP POLICY IF EXISTS "Admins can view all admin actions" ON admin_actions;

CREATE POLICY "Admins can view all admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id::text = auth.uid()::text
    )
  );

-- Leaderboard policies
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;

CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Virtual Trees policies
DROP POLICY IF EXISTS "Users can view own virtual trees" ON virtual_trees;
DROP POLICY IF EXISTS "Users can manage own virtual trees" ON virtual_trees;

CREATE POLICY "Users can view own virtual trees"
  ON virtual_trees FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own virtual trees"
  ON virtual_trees FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Green Feed Posts policies
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

-- Comments policies
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

-- Post Likes policies
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

-- Friend Requests policies
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

-- Friendships policies
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (
    auth.uid()::text = user_id_1::text OR 
    auth.uid()::text = user_id_2::text
  );

-- Stories policies
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

-- Story Views policies
DROP POLICY IF EXISTS "Anyone can view story views" ON story_views;
DROP POLICY IF EXISTS "Authenticated users can insert story views" ON story_views;

CREATE POLICY "Anyone can view story views"
  ON story_views FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert story views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Notifications policies
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
-- 23. COMMENTS
-- ========================================
-- Note: Service role (used in API routes) automatically BYPASSES RLS
-- API routes using getSupabaseAdmin() will not be affected by RLS

-- ========================================
-- ✅ COMPLETE!
-- ========================================
-- Next steps:
-- 1. Enable Realtime in Supabase Dashboard > Database > Replication
--    - Enable for: users, cups, transactions, green_feed_posts, notifications, stories
-- 2. Set up scheduled jobs (optional):
--    - Clean expired stories: SELECT clean_expired_stories();
--    - Update leaderboard: SELECT update_leaderboard();
-- 3. Verify tables in Dashboard > Table Editor
-- ========================================

