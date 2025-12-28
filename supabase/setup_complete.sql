-- ========================================
-- CupSipSmart Complete Database Setup
-- Copy và paste toàn bộ file này vào Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar TEXT,
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  green_points INTEGER DEFAULT 0,
  rank_level TEXT DEFAULT 'seed' CHECK (rank_level IN ('seed', 'sprout', 'sapling', 'tree', 'forest')),
  total_cups_saved INTEGER DEFAULT 0,
  total_plastic_reduced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  blacklist_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_blacklisted ON users(is_blacklisted);

-- ========================================
-- 2. ECO ACTIONS TABLE
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

-- ========================================
-- 3. CUPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS cups (
  cup_id TEXT PRIMARY KEY,
  material TEXT NOT NULL CHECK (material IN ('pp_plastic', 'bamboo_fiber')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'cleaning', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_cleaned_at TIMESTAMPTZ,
  total_uses INTEGER DEFAULT 0,
  current_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  current_transaction_id UUID
);

CREATE INDEX IF NOT EXISTS idx_cups_status ON cups(status);
CREATE INDEX IF NOT EXISTS idx_cups_current_user ON cups(current_user_id);

-- ========================================
-- 4. STORES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS stores (
  store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  gps_lat DECIMAL(10, 8) NOT NULL,
  gps_lng DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  cup_available INTEGER DEFAULT 0,
  cup_in_use INTEGER DEFAULT 0,
  cup_cleaning INTEGER DEFAULT 0,
  cup_total INTEGER DEFAULT 0,
  partner_status TEXT DEFAULT 'active' CHECK (partner_status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(partner_status);

-- ========================================
-- 5. TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  cup_id TEXT NOT NULL REFERENCES cups(cup_id) ON DELETE CASCADE,
  borrow_store_id UUID NOT NULL,
  return_store_id UUID,
  borrow_time TIMESTAMPTZ DEFAULT NOW(),
  due_time TIMESTAMPTZ NOT NULL,
  return_time TIMESTAMPTZ,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'overdue', 'cancelled')),
  deposit_amount DECIMAL(10, 2) NOT NULL,
  refund_amount DECIMAL(10, 2),
  green_points_earned INTEGER,
  is_overdue BOOLEAN DEFAULT false,
  overdue_hours INTEGER
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cup_id ON transactions(cup_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_borrow_time ON transactions(borrow_time DESC);

-- ========================================
-- 6. ADMINS TABLE
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

-- ========================================
-- 7. ADMIN ACTIONS TABLE
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

-- ========================================
-- 8. LEADERBOARD TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS leaderboard (
  entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar TEXT,
  green_points INTEGER DEFAULT 0,
  total_cups_saved INTEGER DEFAULT 0,
  rank INTEGER NOT NULL,
  department TEXT,
  class TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(green_points DESC);

-- ========================================
-- 9. VIRTUAL TREES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS virtual_trees (
  tree_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  growth DECIMAL(5, 2) DEFAULT 0 CHECK (growth >= 0 AND growth <= 100),
  health TEXT DEFAULT 'healthy' CHECK (health IN ('healthy', 'wilting', 'dead')),
  last_watered TIMESTAMPTZ DEFAULT NOW(),
  total_waterings INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_virtual_trees_user_id ON virtual_trees(user_id);

-- ========================================
-- 10. GREEN FEED POSTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS green_feed_posts (
  post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_name TEXT,
  avatar TEXT,
  image_url TEXT NOT NULL,
  caption TEXT,
  cup_id TEXT,
  green_points_earned INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON green_feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON green_feed_posts(created_at DESC);

-- ========================================
-- 11. COMMENTS TABLE
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

-- ========================================
-- 12. POST LIKES TABLE
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
-- 13. FRIEND REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS friend_requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- ========================================
-- 14. FRIENDSHIPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS friendships (
  friendship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user_id_2);

-- ========================================
-- 15. STORIES TABLE
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

-- ========================================
-- 16. STORY VIEWS TABLE
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
-- 17. NOTIFICATIONS TABLE
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

-- ========================================
-- 18. ENABLE ROW LEVEL SECURITY
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cups ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 19. CREATE RLS POLICIES
-- ========================================

-- Users policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (true); -- Allow public read for now (adjust based on Firebase Auth integration)

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (true); -- Adjust based on auth

-- Cups policies
DROP POLICY IF EXISTS "Authenticated users can read cups" ON cups;
CREATE POLICY "Authenticated users can read cups"
  ON cups FOR SELECT
  USING (true);

-- Transactions policies
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- Stores policies
DROP POLICY IF EXISTS "Authenticated users can read stores" ON stores;
CREATE POLICY "Authenticated users can read stores"
  ON stores FOR SELECT
  USING (true);

-- Green Feed Posts policies
DROP POLICY IF EXISTS "Anyone can read feed posts" ON green_feed_posts;
CREATE POLICY "Anyone can read feed posts"
  ON green_feed_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create feed posts" ON green_feed_posts;
CREATE POLICY "Authenticated users can create feed posts"
  ON green_feed_posts FOR INSERT
  WITH CHECK (true);

-- Comments policies
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- Notifications policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (true);

-- ========================================
-- 20. ENABLE REALTIME FOR KEY TABLES
-- ========================================
-- Note: Enable Realtime manually in Supabase Dashboard > Database > Replication
-- Tables to enable: users, cups, transactions, green_feed_posts, notifications, stories

-- ========================================
-- DONE! ✅
-- ========================================
-- Next steps:
-- 1. Enable Realtime in Dashboard > Database > Replication
-- 2. Verify tables were created in Dashboard > Table Editor
-- ========================================

