-- Migration: 022_partner_portal_v2.sql
-- Description: Extended Partner Portal with categories, revenue tracking, and enhanced contracts
-- Date: 2026-01-14

-- ============================================
-- 1. SEED DATA cho Partner Categories
-- ============================================

-- Insert default categories với features_config chi tiết
INSERT INTO partner_categories (cat_id, name, code, description, icon, features_config, is_active) VALUES
(
  uuid_generate_v4(),
  'F&B - Cafe & Nhà hàng',
  'fnb',
  'Quán cafe, trà sữa, nhà hàng, quán ăn',
  '☕',
  '{
    "cleaning_queue": true,
    "menu_management": true,
    "loss_report": true,
    "service_fee_config": true,
    "combo_green_menu": true,
    "mobile_hub": false,
    "route_map": false,
    "ticket_integration": false,
    "eco_exchange": false,
    "iot_integration": false,
    "drive_thru_return": false,
    "esg_report": true,
    "camera_ai": false
  }'::jsonb,
  true
),
(
  uuid_generate_v4(),
  'Giao thông công cộng',
  'transport',
  'Xe bus, xe điện, taxi, grab, trạm xe',
  '🚌',
  '{
    "cleaning_queue": false,
    "menu_management": false,
    "loss_report": true,
    "service_fee_config": false,
    "combo_green_menu": false,
    "mobile_hub": true,
    "route_map": true,
    "ticket_integration": true,
    "container_tracking": true,
    "eco_exchange": false,
    "iot_integration": false,
    "drive_thru_return": false,
    "esg_report": true,
    "camera_ai": false
  }'::jsonb,
  true
),
(
  uuid_generate_v4(),
  'Công nghệ & Bán lẻ',
  'tech',
  'Cửa hàng điện thoại, laptop, điện máy',
  '📱',
  '{
    "cleaning_queue": false,
    "menu_management": false,
    "loss_report": true,
    "service_fee_config": false,
    "combo_green_menu": false,
    "mobile_hub": false,
    "route_map": false,
    "ticket_integration": false,
    "eco_exchange": true,
    "lead_generation": true,
    "iot_integration": true,
    "drive_thru_return": false,
    "esg_report": true,
    "camera_ai": false
  }'::jsonb,
  true
),
(
  uuid_generate_v4(),
  'Năng lượng & Dầu khí',
  'energy',
  'Trạm xăng, cửa hàng tiện lợi tại trạm',
  '⛽',
  '{
    "cleaning_queue": true,
    "menu_management": false,
    "loss_report": true,
    "service_fee_config": false,
    "combo_green_menu": false,
    "mobile_hub": false,
    "route_map": false,
    "ticket_integration": false,
    "eco_exchange": false,
    "iot_integration": true,
    "drive_thru_return": true,
    "esg_report": true,
    "camera_ai": true
  }'::jsonb,
  true
)
ON CONFLICT (code) DO UPDATE SET
  features_config = EXCLUDED.features_config,
  description = EXCLUDED.description;

-- ============================================
-- 2. Mở rộng Partner Contracts
-- ============================================

-- Thêm các cột mới cho partner_contracts nếu chưa có
DO $$
BEGIN
  -- handling_fee_per_scan: Phí trả cho quán mỗi lần quét thành công
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_contracts' AND column_name = 'handling_fee_per_scan') THEN
    ALTER TABLE partner_contracts ADD COLUMN handling_fee_per_scan DECIMAL(10,2) DEFAULT 200;
  END IF;
  
  -- plastic_saving_unit_price: Giá 1 ly nhựa để tính tiết kiệm
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_contracts' AND column_name = 'plastic_saving_unit_price') THEN
    ALTER TABLE partner_contracts ADD COLUMN plastic_saving_unit_price DECIMAL(10,2) DEFAULT 1500;
  END IF;
  
  -- cup_rental_fee: Phí thuê ly hàng tháng (nếu có)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_contracts' AND column_name = 'cup_rental_fee') THEN
    ALTER TABLE partner_contracts ADD COLUMN cup_rental_fee DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  -- min_monthly_transactions: Số giao dịch tối thiểu/tháng
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_contracts' AND column_name = 'min_monthly_transactions') THEN
    ALTER TABLE partner_contracts ADD COLUMN min_monthly_transactions INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 3. Tạo bảng Partner Revenue Logs
-- ============================================

CREATE TABLE IF NOT EXISTS partner_revenue_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners_v2(partner_id),
  branch_id UUID REFERENCES partner_branches(branch_id),
  
  -- Kỳ báo cáo
  report_month INTEGER NOT NULL CHECK (report_month >= 1 AND report_month <= 12),
  report_year INTEGER NOT NULL CHECK (report_year >= 2020),
  
  -- Thống kê giao dịch
  total_scans INTEGER DEFAULT 0,
  total_borrows INTEGER DEFAULT 0,
  total_returns INTEGER DEFAULT 0,
  
  -- Tài chính
  handling_fee_earned DECIMAL(12,2) DEFAULT 0,      -- Tổng phí hỗ trợ quét mã
  plastic_saving_value DECIMAL(12,2) DEFAULT 0,     -- Giá trị tiết kiệm ly nhựa
  subscription_fee_paid DECIMAL(12,2) DEFAULT 0,    -- Phí thuê bao đã trả
  commission_paid DECIMAL(12,2) DEFAULT 0,          -- Hoa hồng đã trả cho SipMart
  net_profit DECIMAL(12,2) DEFAULT 0,               -- Lợi nhuận ròng
  
  -- ESG Metrics
  cups_reused INTEGER DEFAULT 0,
  plastic_saved_grams INTEGER DEFAULT 0,
  co2_saved_grams INTEGER DEFAULT 0,
  
  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'disputed')),
  confirmed_by UUID REFERENCES partner_users(user_id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint per branch per month
  UNIQUE(branch_id, report_month, report_year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_logs_partner ON partner_revenue_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_branch ON partner_revenue_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_revenue_logs_period ON partner_revenue_logs(report_year, report_month);

-- ============================================
-- 4. Mở rộng Partner Roles với Permissions chi tiết
-- ============================================

-- Update existing roles với permissions chi tiết
UPDATE partner_roles SET permissions = '{
  "dashboard": {"view": true, "view_all_branches": true},
  "branches": {"view": true, "create": true, "update": true, "delete": true},
  "users": {"view": true, "create": true, "update": true, "delete": true},
  "inventory": {"view": true, "report_loss": true, "request_cups": true},
  "vouchers": {"view": true, "create": true, "update": true, "delete": true, "approve": true},
  "financial": {"view": true, "export": true},
  "contracts": {"view": true, "sign": true},
  "analytics": {"view": true},
  "scanner": {"borrow": true, "return": true}
}'::jsonb
WHERE code = 'owner';

UPDATE partner_roles SET permissions = '{
  "dashboard": {"view": true, "view_all_branches": false},
  "branches": {"view": true, "create": false, "update": true, "delete": false},
  "users": {"view": true, "create": true, "update": true, "delete": false},
  "inventory": {"view": true, "report_loss": true, "request_cups": true},
  "vouchers": {"view": true, "create": true, "update": true, "delete": true, "approve": false},
  "financial": {"view": false, "export": false},
  "contracts": {"view": false, "sign": false},
  "analytics": {"view": true},
  "scanner": {"borrow": true, "return": true}
}'::jsonb
WHERE code = 'manager';

UPDATE partner_roles SET permissions = '{
  "dashboard": {"view": false, "view_all_branches": false},
  "branches": {"view": false, "create": false, "update": false, "delete": false},
  "users": {"view": false, "create": false, "update": false, "delete": false},
  "inventory": {"view": true, "report_loss": true, "request_cups": false},
  "vouchers": {"view": false, "create": false, "update": false, "delete": false, "approve": false},
  "financial": {"view": false, "export": false},
  "contracts": {"view": false, "sign": false},
  "analytics": {"view": false},
  "scanner": {"borrow": true, "return": true}
}'::jsonb
WHERE code = 'staff';

-- Insert default roles nếu chưa có
INSERT INTO partner_roles (name, code, description, permissions, level) VALUES
(
  'Chủ doanh nghiệp',
  'owner',
  'Toàn quyền quản lý partner và tất cả chi nhánh',
  '{
    "dashboard": {"view": true, "view_all_branches": true},
    "branches": {"view": true, "create": true, "update": true, "delete": true},
    "users": {"view": true, "create": true, "update": true, "delete": true},
    "inventory": {"view": true, "report_loss": true, "request_cups": true},
    "vouchers": {"view": true, "create": true, "update": true, "delete": true, "approve": true},
    "financial": {"view": true, "export": true},
    "contracts": {"view": true, "sign": true},
    "analytics": {"view": true},
    "scanner": {"borrow": true, "return": true}
  }'::jsonb,
  100
),
(
  'Quản lý chi nhánh',
  'manager',
  'Quản lý vận hành chi nhánh được phân công',
  '{
    "dashboard": {"view": true, "view_all_branches": false},
    "branches": {"view": true, "create": false, "update": true, "delete": false},
    "users": {"view": true, "create": true, "update": true, "delete": false},
    "inventory": {"view": true, "report_loss": true, "request_cups": true},
    "vouchers": {"view": true, "create": true, "update": true, "delete": true, "approve": false},
    "financial": {"view": false, "export": false},
    "contracts": {"view": false, "sign": false},
    "analytics": {"view": true},
    "scanner": {"borrow": true, "return": true}
  }'::jsonb,
  50
),
(
  'Nhân viên',
  'staff',
  'Nhân viên quét QR và hỗ trợ khách hàng',
  '{
    "dashboard": {"view": false, "view_all_branches": false},
    "branches": {"view": false, "create": false, "update": false, "delete": false},
    "users": {"view": false, "create": false, "update": false, "delete": false},
    "inventory": {"view": true, "report_loss": true, "request_cups": false},
    "vouchers": {"view": false, "create": false, "update": false, "delete": false, "approve": false},
    "financial": {"view": false, "export": false},
    "contracts": {"view": false, "sign": false},
    "analytics": {"view": false},
    "scanner": {"borrow": true, "return": true}
  }'::jsonb,
  10
)
ON CONFLICT (code) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  level = EXCLUDED.level;

-- ============================================
-- 5. RLS Policies cho Partner Portal
-- ============================================

-- Enable RLS
ALTER TABLE partner_revenue_logs ENABLE ROW LEVEL SECURITY;

-- Partner Users can only see their own partner's data
CREATE POLICY "Partner users view own revenue logs" ON partner_revenue_logs
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  );

-- Partner Owners can insert/update revenue logs
CREATE POLICY "Partner owners manage revenue logs" ON partner_revenue_logs
  FOR ALL USING (
    partner_id IN (
      SELECT pu.partner_id FROM partner_users pu
      JOIN partner_roles pr ON pu.role_id = pr.role_id
      WHERE pu.user_id = auth.uid() AND pr.code = 'owner'
    )
  );

-- Admins full access
CREATE POLICY "Admins full access revenue logs" ON partner_revenue_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- ============================================
-- 6. Trigger cập nhật updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_partner_revenue_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_revenue_logs_updated_at ON partner_revenue_logs;
CREATE TRIGGER trigger_update_partner_revenue_logs_updated_at
  BEFORE UPDATE ON partner_revenue_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_revenue_logs_updated_at();

-- ============================================
-- 7. Helper Functions
-- ============================================

-- Function tính toán ESG metrics từ số ly
CREATE OR REPLACE FUNCTION calculate_esg_metrics(cups_count INTEGER)
RETURNS TABLE (
  plastic_saved_grams INTEGER,
  co2_saved_grams INTEGER,
  water_saved_liters NUMERIC,
  trees_equivalent NUMERIC
) AS $$
BEGIN
  RETURN QUERY SELECT
    (cups_count * 15)::INTEGER,           -- 15g plastic/cup
    (cups_count * 40)::INTEGER,           -- 40g CO2/cup
    (cups_count * 0.5)::NUMERIC,          -- 0.5L water/cup
    (cups_count * 15 / 21000.0)::NUMERIC; -- 21kg CO2 = 1 tree/year
END;
$$ LANGUAGE plpgsql;

-- Function lấy permissions của user
CREATE OR REPLACE FUNCTION get_partner_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  SELECT pr.permissions INTO v_permissions
  FROM partner_users pu
  JOIN partner_roles pr ON pu.role_id = pr.role_id
  WHERE pu.user_id = p_user_id AND pu.is_active = true;
  
  RETURN COALESCE(v_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE partner_revenue_logs IS 'Bảng lưu trữ log doanh thu hàng tháng của partner để đối soát';
COMMENT ON FUNCTION calculate_esg_metrics IS 'Tính toán các chỉ số ESG từ số lượng ly tái sử dụng';
COMMENT ON FUNCTION get_partner_user_permissions IS 'Lấy permissions của partner user dựa trên role';
