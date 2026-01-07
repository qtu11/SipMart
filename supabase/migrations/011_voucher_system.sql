-- ========================================
-- Migration 011: Voucher System
-- Tạo hệ thống voucher (mã giảm giá)
-- ========================================

-- ========================================
-- 1. VOUCHERS TABLE - Quản lý voucher
-- ========================================
CREATE TABLE IF NOT EXISTS vouchers (
  voucher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(12, 2) NOT NULL CHECK (discount_value > 0),
  max_discount DECIMAL(12, 2),
  min_order_value DECIMAL(12, 2) DEFAULT 0,
  usage_limit INTEGER,
  usage_per_user INTEGER DEFAULT 1 CHECK (usage_per_user > 0),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  target_rank TEXT CHECK (target_rank IN ('seed', 'sprout', 'sapling', 'tree', 'forest')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vouchers_valid_dates ON vouchers(valid_from, valid_until);

-- ========================================
-- 2. USER_VOUCHERS TABLE - Voucher đã claim
-- ========================================
CREATE TABLE IF NOT EXISTS user_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, voucher_id)
);

CREATE INDEX IF NOT EXISTS idx_user_vouchers_user ON user_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_voucher ON user_vouchers(voucher_id);

-- ========================================
-- 3. VOUCHER_USAGE TABLE - Lịch sử sử dụng
-- ========================================
CREATE TABLE IF NOT EXISTS voucher_usage (
  usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  order_id UUID,
  order_type TEXT CHECK (order_type IN ('reward_claim', 'topup', 'other')),
  original_amount DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) NOT NULL CHECK (discount_amount >= 0),
  final_amount DECIMAL(12, 2) NOT NULL CHECK (final_amount >= 0),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_usage_voucher ON voucher_usage(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_usage_user ON voucher_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_usage_used_at ON voucher_usage(used_at DESC);

-- ========================================
-- 4. TRIGGERS
-- ========================================

-- Trigger cập nhật updated_at cho vouchers
DROP TRIGGER IF EXISTS update_vouchers_updated_at ON vouchers;
CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. RLS POLICIES
-- ========================================

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usage ENABLE ROW LEVEL SECURITY;

-- Vouchers: Anyone can view active vouchers
DROP POLICY IF EXISTS "Anyone can view active vouchers" ON vouchers;
CREATE POLICY "Anyone can view active vouchers"
  ON vouchers FOR SELECT
  USING (
    is_active = true 
    AND valid_from <= NOW() 
    AND (valid_until IS NULL OR valid_until > NOW())
  );

-- Admins can manage all vouchers
DROP POLICY IF EXISTS "Admins can manage vouchers" ON vouchers;
CREATE POLICY "Admins can manage vouchers"
  ON vouchers FOR ALL
  USING (public.is_admin_user());

-- User Vouchers: Users can view own claims
DROP POLICY IF EXISTS "Users can view own voucher claims" ON user_vouchers;
CREATE POLICY "Users can view own voucher claims"
  ON user_vouchers FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can claim vouchers
DROP POLICY IF EXISTS "Users can claim vouchers" ON user_vouchers;
CREATE POLICY "Users can claim vouchers"
  ON user_vouchers FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Admins can view all claims
DROP POLICY IF EXISTS "Admins can view all voucher claims" ON user_vouchers;
CREATE POLICY "Admins can view all voucher claims"
  ON user_vouchers FOR SELECT
  USING (public.is_admin_user());

-- Voucher Usage: Users can view own usage
DROP POLICY IF EXISTS "Users can view own voucher usage" ON voucher_usage;
CREATE POLICY "Users can view own voucher usage"
  ON voucher_usage FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Service role can insert usage (for API)
DROP POLICY IF EXISTS "Service role can insert voucher usage" ON voucher_usage;
CREATE POLICY "Service role can insert voucher usage"
  ON voucher_usage FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway

-- Admins can view all usage
DROP POLICY IF EXISTS "Admins can view all voucher usage" ON voucher_usage;
CREATE POLICY "Admins can view all voucher usage"
  ON voucher_usage FOR SELECT
  USING (public.is_admin_user());

-- ========================================
-- 6. GRANT PERMISSIONS
-- ========================================
GRANT SELECT ON vouchers TO authenticated;
GRANT SELECT, INSERT ON user_vouchers TO authenticated;
GRANT SELECT ON voucher_usage TO authenticated;

-- ========================================
-- 7. SEED DATA - Sample Vouchers
-- ========================================
INSERT INTO vouchers (code, name, description, discount_type, discount_value, max_discount, min_order_value, usage_limit, is_active) VALUES
  ('WELCOME50', 'Chào mừng thành viên mới', 'Giảm 50% cho lần đổi thưởng đầu tiên', 'percent', 50.00, 50000.00, 10000.00, 1000, true),
  ('ECO100', 'Eco Warrior Bonus', 'Giảm 100,000đ cho đơn từ 200,000đ', 'fixed', 100000.00, NULL, 200000.00, 500, true),
  ('GREEN20', 'Green Friend', 'Giảm 20% cho mọi đơn hàng', 'percent', 20.00, 30000.00, 50000.00, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- ✅ MIGRATION COMPLETE
-- ========================================
-- Đã tạo:
-- 1. vouchers - Quản lý voucher
-- 2. user_vouchers - Voucher đã claim
-- 3. voucher_usage - Lịch sử sử dụng
-- ========================================
