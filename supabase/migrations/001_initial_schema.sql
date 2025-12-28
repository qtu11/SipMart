-- CupSipSmart Database Schema for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_blacklisted ON users(is_blacklisted);

-- Eco Actions table
CREATE TABLE eco_actions (
  action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('borrow', 'return', 'checkin', 'share')),
  cup_id TEXT,
  points INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  description TEXT NOT NULL
);

CREATE INDEX idx_eco_actions_user_id ON eco_actions(user_id);
CREATE INDEX idx_eco_actions_timestamp ON eco_actions(timestamp DESC);

-- Cups table
CREATE TABLE cups (
  cup_id TEXT PRIMARY KEY,
  material TEXT NOT NULL CHECK (material IN ('pp_plastic', 'bamboo_fiber')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'cleaning', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_cleaned_at TIMESTAMPTZ,
  total_uses INTEGER DEFAULT 0,
  current_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  current_transaction_id UUID
);

CREATE INDEX idx_cups_status ON cups(status);
CREATE INDEX idx_cups_current_user ON cups(current_user_id);

-- Transactions table
CREATE TABLE transactions (
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

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_cup_id ON transactions(cup_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_borrow_time ON transactions(borrow_time DESC);

-- Stores table
CREATE TABLE stores (
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

CREATE INDEX idx_stores_status ON stores(partner_status);

-- Admins table
CREATE TABLE admins (
  admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'store_admin')),
  store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admins_email ON admins(email);

-- Admin Actions (Log)
CREATE TABLE admin_actions (
  action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_timestamp ON admin_actions(timestamp DESC);

-- Leaderboard (cached)
CREATE TABLE leaderboard (
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

CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX idx_leaderboard_points ON leaderboard(green_points DESC);

-- Virtual Trees
CREATE TABLE virtual_trees (
  tree_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  growth DECIMAL(5, 2) DEFAULT 0 CHECK (growth >= 0 AND growth <= 100),
  health TEXT DEFAULT 'healthy' CHECK (health IN ('healthy', 'wilting', 'dead')),
  last_watered TIMESTAMPTZ DEFAULT NOW(),
  total_waterings INTEGER DEFAULT 0
);

CREATE INDEX idx_virtual_trees_user_id ON virtual_trees(user_id);

-- Green Feed Posts
CREATE TABLE green_feed_posts (
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

CREATE INDEX idx_feed_posts_user_id ON green_feed_posts(user_id);
CREATE INDEX idx_feed_posts_created_at ON green_feed_posts(created_at DESC);

-- Comments
CREATE TABLE comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES green_feed_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Post Likes
CREATE TABLE post_likes (
  like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES green_feed_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Friend Requests
CREATE TABLE friend_requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);

-- Friendships
CREATE TABLE friendships (
  friendship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX idx_friendships_user2 ON friendships(user_id_2);

-- Stories
CREATE TABLE stories (
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

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);

-- Story Views
CREATE TABLE story_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_user_id ON story_views(user_id);

-- Notifications
CREATE TABLE notifications (
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

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_timestamp ON notifications(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cups ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for leaderboard
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

