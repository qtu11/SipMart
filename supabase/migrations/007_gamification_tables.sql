-- ========================================
-- Migration 007: Gamification Tables
-- Tạo các bảng còn thiếu cho hệ thống gamification
-- Run: Copy và paste vào Supabase SQL Editor
-- ========================================

-- ========================================
-- 1. REWARDS TABLE - Phần thưởng đổi điểm
-- ========================================
CREATE TABLE IF NOT EXISTS rewards (
  reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category TEXT NOT NULL CHECK (category IN ('voucher', 'merchandise', 'privilege', 'charity')),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rewards_points_cost ON rewards(points_cost);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'is_active') THEN
        ALTER TABLE rewards ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'valid_until') THEN
        ALTER TABLE rewards ADD COLUMN valid_until TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'stock') THEN
        ALTER TABLE rewards ADD COLUMN stock INTEGER DEFAULT 0 CHECK (stock >= 0);
    END IF;
END $$;

-- ========================================
-- 2. REWARD_CLAIMS TABLE - Lịch sử đổi thưởng
-- ========================================
CREATE TABLE IF NOT EXISTS reward_claims (
  claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(reward_id) ON DELETE RESTRICT,
  points_used INTEGER NOT NULL CHECK (points_used > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')),
  claim_code TEXT UNIQUE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add claim_code if missing (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_claims' AND column_name = 'claim_code') THEN
        ALTER TABLE reward_claims ADD COLUMN claim_code TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_claims' AND column_name = 'status') THEN
        ALTER TABLE reward_claims ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON reward_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward ON reward_claims(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_status ON reward_claims(status);
CREATE INDEX IF NOT EXISTS idx_reward_claims_code ON reward_claims(claim_code) WHERE claim_code IS NOT NULL;

-- ========================================
-- 3. ACHIEVEMENTS TABLE - Thành tựu
-- ========================================
CREATE TABLE IF NOT EXISTS achievements (
  achievement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirement INTEGER NOT NULL CHECK (requirement > 0),
  reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),
  special_reward TEXT,
  category TEXT NOT NULL CHECK (category IN ('cups', 'social', 'streak', 'eco', 'special')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_badge ON achievements(badge_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'is_active') THEN
        ALTER TABLE achievements ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'category') THEN
        ALTER TABLE achievements ADD COLUMN category TEXT NOT NULL DEFAULT 'special'; -- Default to safe value
    END IF;
END $$;

-- ========================================
-- 4. USER_ACHIEVEMENTS TABLE - Thành tựu đã mở
-- ========================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- ========================================
-- 5. CHALLENGES TABLE - Thử thách
-- ========================================
CREATE TABLE IF NOT EXISTS challenges (
  challenge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'special')),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('cups', 'points', 'friends', 'posts', 'streak')),
  requirement_value INTEGER NOT NULL CHECK (requirement_value > 0),
  reward_points INTEGER NOT NULL CHECK (reward_points > 0),
  reward_badge_id UUID REFERENCES achievements(achievement_id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active) WHERE is_active = true;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'is_active') THEN
        ALTER TABLE challenges ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'start_date') THEN
        ALTER TABLE challenges ADD COLUMN start_date TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'end_date') THEN
        ALTER TABLE challenges ADD COLUMN end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days');
    END IF;
END $$;

-- ========================================
-- 6. USER_CHALLENGES TABLE - Tham gia thử thách
-- ========================================
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(challenge_id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

-- Safely add status if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_challenges' AND column_name = 'status') THEN
        ALTER TABLE user_challenges ADD COLUMN status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);

-- ========================================
-- 7. PAYMENT_TRANSACTIONS TABLE - Log thanh toán
-- ========================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('vnpay', 'momo', 'zalopay', 'bank_transfer')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('topup', 'refund', 'withdrawal')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  external_transaction_id TEXT,
  vnpay_txn_ref TEXT,
  vnpay_response_code TEXT,
  error_message TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Safely add status and other columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'status') THEN
        ALTER TABLE payment_transactions ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'vnpay_txn_ref') THEN
        ALTER TABLE payment_transactions ADD COLUMN vnpay_txn_ref TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'vnpay_response_code') THEN
        ALTER TABLE payment_transactions ADD COLUMN vnpay_response_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'external_transaction_id') THEN
        ALTER TABLE payment_transactions ADD COLUMN external_transaction_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'error_message') THEN
        ALTER TABLE payment_transactions ADD COLUMN error_message TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'metadata') THEN
        ALTER TABLE payment_transactions ADD COLUMN metadata JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'ip_address') THEN
        ALTER TABLE payment_transactions ADD COLUMN ip_address TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_vnpay ON payment_transactions(vnpay_txn_ref) WHERE vnpay_txn_ref IS NOT NULL;

-- ========================================
-- 8. AUDIT_LOGS TABLE - Log hành động nhạy cảm
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID, -- User hoặc Admin thực hiện
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system')),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- users, cups, transactions, etc.
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ========================================
-- 9. SYSTEM_NOTIFICATIONS TABLE - Thông báo hệ thống (Admin broadcast)
-- ========================================
CREATE TABLE IF NOT EXISTS system_notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'promotion', 'maintenance', 'event')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  action_url TEXT,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'active', 'inactive', 'new', 'premium')),
  target_rank TEXT CHECK (target_rank IN ('seed', 'sprout', 'sapling', 'tree', 'forest')),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_notifications_active ON system_notifications(is_active, start_at, end_at);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'is_active') THEN
        ALTER TABLE system_notifications ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'start_at') THEN
        ALTER TABLE system_notifications ADD COLUMN start_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'end_at') THEN
        ALTER TABLE system_notifications ADD COLUMN end_at TIMESTAMPTZ;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(type);

-- ========================================
-- 10. USER_GREEN_STREAK TABLE - Tracking streak
-- ========================================
CREATE TABLE IF NOT EXISTS user_green_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  streak_started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_green_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON user_green_streaks(current_streak DESC);

-- ========================================
-- 11. TRIGGERS
-- ========================================

-- Trigger cập nhật updated_at cho rewards
DROP TRIGGER IF EXISTS update_rewards_updated_at ON rewards;
CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger cập nhật updated_at cho user_green_streaks
DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON user_green_streaks;
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_green_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 12. RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_green_streaks ENABLE ROW LEVEL SECURITY;

-- Rewards: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
CREATE POLICY "Anyone can view active rewards"
  ON rewards FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage rewards" ON rewards;
CREATE POLICY "Admins can manage rewards"
  ON rewards FOR ALL
  USING (public.is_admin_user());

-- Reward Claims: User can view own, admin can view all
DROP POLICY IF EXISTS "Users can view own claims" ON reward_claims;
CREATE POLICY "Users can view own claims"
  ON reward_claims FOR SELECT
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create own claims" ON reward_claims;
CREATE POLICY "Users can create own claims"
  ON reward_claims FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Admins can manage all claims" ON reward_claims;
CREATE POLICY "Admins can manage all claims"
  ON reward_claims FOR ALL
  USING (public.is_admin_user());

-- Achievements: Public read
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
CREATE POLICY "Admins can manage achievements"
  ON achievements FOR ALL
  USING (public.is_admin_user());

-- User Achievements: User can view own
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Service role can manage achievements" ON user_achievements;
CREATE POLICY "Service role can manage achievements"
  ON user_achievements FOR ALL
  USING (true); -- Service role bypasses RLS anyway

-- Challenges: Public read active
DROP POLICY IF EXISTS "Anyone can view active challenges" ON challenges;
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (is_active = true AND end_date > NOW());

DROP POLICY IF EXISTS "Admins can manage challenges" ON challenges;
CREATE POLICY "Admins can manage challenges"
  ON challenges FOR ALL
  USING (public.is_admin_user());

-- User Challenges: User can view/manage own
DROP POLICY IF EXISTS "Users can view own challenge progress" ON user_challenges;
CREATE POLICY "Users can view own challenge progress"
  ON user_challenges FOR SELECT
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can join challenges" ON user_challenges;
CREATE POLICY "Users can join challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own challenge progress" ON user_challenges;
CREATE POLICY "Users can update own challenge progress"
  ON user_challenges FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Payment Transactions: User can view own, admin can view all
DROP POLICY IF EXISTS "Users can view own payments" ON payment_transactions;
CREATE POLICY "Users can view own payments"
  ON payment_transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Admins can view all payments" ON payment_transactions;
CREATE POLICY "Admins can view all payments"
  ON payment_transactions FOR SELECT
  USING (public.is_admin_user());

-- Audit Logs: Admin only
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (public.is_admin_user());

-- System Notifications: Public read active
DROP POLICY IF EXISTS "Anyone can view active notifications" ON system_notifications;
CREATE POLICY "Anyone can view active notifications"
  ON system_notifications FOR SELECT
  USING (is_active = true AND start_at <= NOW() AND (end_at IS NULL OR end_at > NOW()));

DROP POLICY IF EXISTS "Admins can manage notifications" ON system_notifications;
CREATE POLICY "Admins can manage notifications"
  ON system_notifications FOR ALL
  USING (public.is_admin_user());

-- User Streaks: User can view own
DROP POLICY IF EXISTS "Users can view own streak" ON user_green_streaks;
CREATE POLICY "Users can view own streak"
  ON user_green_streaks FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- ========================================
-- 13. SEED DATA - Default Achievements
-- ========================================
INSERT INTO achievements (badge_id, name, description, icon, rarity, requirement, reward_points, category) VALUES
  ('first_cup', '🌟 First Cup', 'Mượn ly đầu tiên', '🌟', 'common', 1, 50, 'cups'),
  ('speed_returner', '⚡ Speed Returner', 'Trả ly trong vòng 1 giờ', '⚡', 'rare', 1, 100, 'cups'),
  ('streak_master', '🔥 Streak Master', 'Mượn ly 7 ngày liên tiếp', '🔥', 'epic', 7, 500, 'streak'),
  ('eco_warrior', '🌍 Eco Warrior', 'Cứu 100 ly nhựa', '🌍', 'legendary', 100, 1000, 'cups'),
  ('zero_waste', '💚 Zero Waste', 'Không quá hạn lần nào (tối thiểu 10 lần)', '💚', 'epic', 10, 2000, 'eco'),
  ('campus_champion', '🎓 Campus Champion', 'Top 10 bảng xếp hạng', '🎓', 'legendary', 1, 5000, 'special'),
  ('social_butterfly', '🤝 Social Butterfly', 'Có 10 bạn bè', '🤝', 'rare', 10, 200, 'social'),
  ('content_creator', '📸 Content Creator', 'Đăng 50 bài trên Green Feed', '📸', 'epic', 50, 800, 'social')
ON CONFLICT (badge_id) DO NOTHING;

-- ========================================
-- 14. SEED DATA - Default Rewards
-- ========================================
INSERT INTO rewards (name, description, image, points_cost, stock, category, is_active) VALUES
  ('Voucher Cà Phê 50K', 'Giảm 50,000đ cho đơn hàng tiếp theo tại các quán đối tác', '/images/rewards/coffee-voucher.png', 500, 100, 'voucher', true),
  ('Voucher Trà Sữa 30K', 'Giảm 30,000đ cho đơn trà sữa', '/images/rewards/milk-tea-voucher.png', 300, 100, 'voucher', true),
  ('Miễn Phí Cọc 1 Lần', 'Mượn ly miễn phí tiền cọc 1 lần', '/images/rewards/free-deposit.png', 200, 50, 'privilege', true),
  ('Túi Vải SipSmart', 'Túi vải thân thiện môi trường có logo SipSmart', '/images/rewards/eco-bag.png', 1500, 30, 'merchandise', true),
  ('Sticker Pack', 'Bộ sticker dễ thương về môi trường', '/images/rewards/stickers.png', 50, 200, 'merchandise', true),
  ('Priority Pass 30 Ngày', 'Ưu tiên mượn ly khi hết hàng trong 30 ngày', '/images/rewards/priority-pass.png', 800, 20, 'privilege', true),
  ('Trồng Cây Thật', 'Chúng tôi sẽ trồng 1 cây xanh có tên bạn', '/images/rewards/plant-tree.png', 5000, 10, 'charity', true)
ON CONFLICT DO NOTHING;

-- ========================================
-- 15. GRANT PERMISSIONS
-- ========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON reward_claims TO authenticated;
GRANT SELECT ON achievements TO authenticated;
GRANT SELECT, INSERT ON user_achievements TO authenticated;
GRANT SELECT ON challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_challenges TO authenticated;
GRANT SELECT ON payment_transactions TO authenticated;
GRANT SELECT ON system_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_green_streaks TO authenticated;

GRANT SELECT ON audit_logs TO authenticated;

-- ========================================
-- ✅ MIGRATION COMPLETE
-- ========================================
-- Đã tạo:
-- 1. rewards - Phần thưởng đổi điểm
-- 2. reward_claims - Lịch sử đổi thưởng
-- 3. achievements - Thành tựu
-- 4. user_achievements - Thành tựu đã mở
-- 5. challenges - Thử thách
-- 6. user_challenges - Tham gia thử thách
-- 7. payment_transactions - Log thanh toán
-- 8. audit_logs - Audit trail
-- 9. system_notifications - Thông báo hệ thống
-- 10. user_green_streaks - Tracking streak
-- ========================================
