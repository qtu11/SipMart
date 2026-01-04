-- CupSipSmart - Complete Database Schema
-- Single unified SQL file for Supabase
-- Run this entire file in Supabase SQL Editor

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- DROP EXISTING TABLES (if recreating)
-- ============================================
-- Uncomment below if you want to recreate from scratch
-- DROP TABLE IF EXISTS user_challenges CASCADE;
-- DROP TABLE IF EXISTS user_achievements CASCADE;
-- DROP TABLE IF EXISTS reward_claims CASCADE;
-- DROP TABLE IF EXISTS game_scores CASCADE;
-- DROP TABLE IF EXISTS story_views CASCADE;
-- DROP TABLE IF EXISTS stories CASCADE;
-- DROP TABLE IF EXISTS post_likes CASCADE;
-- DROP TABLE IF EXISTS comments CASCADE;
-- DROP TABLE IF EXISTS green_feed_posts CASCADE;
-- DROP TABLE IF EXISTS friendships CASCADE;
-- DROP TABLE IF EXISTS friend_requests CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS virtual_trees CASCADE;
-- DROP TABLE IF EXISTS incidents CASCADE;
-- DROP TABLE IF EXISTS admin_actions CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS eco_actions CASCADE;
-- DROP TABLE IF EXISTS cups CASCADE;
-- DROP TABLE IF EXISTS payment_transactions CASCADE;
-- DROP TABLE IF EXISTS payment_methods CASCADE;
-- DROP TABLE IF EXISTS system_settings CASCADE;
-- DROP TABLE IF EXISTS campaigns CASCADE;
-- DROP TABLE IF EXISTS challenges CASCADE;
-- DROP TABLE IF EXISTS rewards CASCADE;
-- DROP TABLE IF EXISTS achievements CASCADE;
-- DROP TABLE IF EXISTS leaderboard CASCADE;
-- DROP TABLE IF EXISTS admins CASCADE;
-- DROP TABLE IF EXISTS admin_roles CASCADE;
-- DROP TABLE IF EXISTS stores CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY,
  student_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar TEXT,
  wallet_balance NUMERIC DEFAULT 0,
  green_points INTEGER DEFAULT 0,
  rank_level TEXT DEFAULT 'seed' CHECK (rank_level IN ('seed', 'sprout', 'sapling', 'tree', 'forest')),
  total_cups_saved INTEGER DEFAULT 0,
  total_plastic_reduced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_blacklisted BOOLEAN DEFAULT FALSE,
  blacklist_reason TEXT,
  blacklist_count INTEGER DEFAULT 0
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  gps_lat NUMERIC NOT NULL,
  gps_lng NUMERIC NOT NULL,
  address TEXT NOT NULL,
  cup_available INTEGER DEFAULT 0,
  cup_in_use INTEGER DEFAULT 0,
  cup_cleaning INTEGER DEFAULT 0,
  cup_total INTEGER DEFAULT 0,
  partner_status TEXT DEFAULT 'active' CHECK (partner_status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name TEXT UNIQUE NOT NULL,
  permissions JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'store_admin')),
  store_id UUID REFERENCES stores(store_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cups table
CREATE TABLE IF NOT EXISTS cups (
  cup_id TEXT PRIMARY KEY,
  material TEXT NOT NULL CHECK (material IN ('pp_plastic', 'bamboo_fiber')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'cleaning', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_cleaned_at TIMESTAMP WITH TIME ZONE,
  total_uses INTEGER DEFAULT 0,
  current_user_id UUID REFERENCES users(user_id),
  current_transaction_id UUID
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  cup_id TEXT NOT NULL REFERENCES cups(cup_id) ON DELETE CASCADE,
  borrow_store_id UUID NOT NULL REFERENCES stores(store_id),
  return_store_id UUID REFERENCES stores(store_id),
  borrow_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_time TIMESTAMP WITH TIME ZONE NOT NULL,
  return_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'overdue', 'cancelled')),
  deposit_amount NUMERIC NOT NULL,
  refund_amount NUMERIC,
  green_points_earned INTEGER,
  is_overdue BOOLEAN DEFAULT FALSE,
  overdue_hours INTEGER
);

-- Eco actions table
CREATE TABLE IF NOT EXISTS eco_actions (
  action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('borrow', 'return', 'checkin', 'share')),
  cup_id TEXT,
  points INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT NOT NULL
);

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Green feed posts
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES green_feed_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES green_feed_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Friendships
CREATE TABLE IF NOT EXISTS friendships (
  friendship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2)
);

-- Stories
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Story views
CREATE TABLE IF NOT EXISTS story_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- ============================================
-- GAMIFICATION
-- ============================================

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  achievement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT,
  requirement INTEGER DEFAULT 1,
  reward_points INTEGER DEFAULT 0,
  special_reward TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  achievement_id UUID REFERENCES achievements(achievement_id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0
);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
  reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  points_cost INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward claims
CREATE TABLE IF NOT EXISTS reward_claims (
  claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  reward_id UUID REFERENCES rewards(reward_id),
  points_used INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  challenge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  requirement JSONB,
  reward_points INTEGER,
  reward_badge TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenges
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  challenge_id UUID REFERENCES challenges(challenge_id),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard
CREATE TABLE IF NOT EXISTS leaderboard (
  entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id),
  display_name TEXT NOT NULL,
  avatar TEXT,
  green_points INTEGER DEFAULT 0,
  total_cups_saved INTEGER DEFAULT 0,
  rank INTEGER NOT NULL,
  department TEXT,
  class TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Virtual trees
CREATE TABLE IF NOT EXISTS virtual_trees (
  tree_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id),
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  growth NUMERIC DEFAULT 0 CHECK (growth >= 0 AND growth <= 100),
  health TEXT DEFAULT 'healthy' CHECK (health IN ('healthy', 'wilting', 'dead')),
  last_watered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_waterings INTEGER DEFAULT 0
);

-- Game scores
CREATE TABLE IF NOT EXISTS game_scores (
  score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  game_type TEXT,
  score INTEGER NOT NULL,
  reward INTEGER DEFAULT 0,
  metadata JSONB,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADMIN & SYSTEM
-- ============================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'info', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions
CREATE TABLE IF NOT EXISTS admin_actions (
  action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(admin_id),
  type TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  incident_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT,
  cup_id TEXT,
  user_id UUID REFERENCES users(user_id),
  store_id UUID REFERENCES stores(store_id),
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES admins(admin_id),
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  target TEXT,
  reward_type TEXT,
  reward_value JSONB,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  data_type TEXT,
  category TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES admins(admin_id)
);

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  account_number TEXT,
  account_name TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  transaction_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_blacklisted ON users(is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_cups_status ON cups(status);
CREATE INDEX IF NOT EXISTS idx_cups_user ON cups(current_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user ON green_feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON green_feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = user_id);

-- Users can view their transactions
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Anyone authenticated can view feed posts
DROP POLICY IF EXISTS "Public feed access" ON green_feed_posts;
CREATE POLICY "Public feed access" ON green_feed_posts FOR SELECT TO authenticated USING (true);

-- Users can create their own posts
DROP POLICY IF EXISTS "Users create own posts" ON green_feed_posts;
CREATE POLICY "Users create own posts" ON green_feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample stores
INSERT INTO stores (name, gps_lat, gps_lng, address, cup_total, cup_available) VALUES
('Cafe Central QTUS', 10.870461, 106.801839, 'Quy Nhon University', 100, 100),
('Library Cafe', 10.871461, 106.802839, 'QTUS Library', 50, 50),
('Student Center', 10.869461, 106.800839, 'QTUS Student Center', 75, 75)
ON CONFLICT DO NOTHING;

-- Insert sample cups
INSERT INTO cups (cup_id, material, status) VALUES
('CUP001', 'pp_plastic', 'available'),
('CUP002', 'pp_plastic', 'available'),
('CUP003', 'bamboo_fiber', 'available'),
('CUP004', 'bamboo_fiber', 'available'),
('CUP005', 'pp_plastic', 'available')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Count all tables
SELECT 
  COUNT(*) as total_tables,
  string_agg(table_name, ', ' ORDER BY table_name) as table_names
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Success message
SELECT 'CupSipSmart database setup complete! ✅' AS status,
       COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
