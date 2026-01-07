-- ========================================
-- Migration 012: Notification System Enhancements
-- Nâng cấp hệ thống thông báo với rich text editor
-- ========================================

-- ========================================
-- 1. ENHANCE SYSTEM_NOTIFICATIONS TABLE
-- ========================================

-- Add new columns for rich content
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'content_html') THEN
        ALTER TABLE system_notifications ADD COLUMN content_html TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'emoji') THEN
        ALTER TABLE system_notifications ADD COLUMN emoji TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'attachments') THEN
        ALTER TABLE system_notifications ADD COLUMN attachments JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'template_id') THEN
        ALTER TABLE system_notifications ADD COLUMN template_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'recipients_count') THEN
        ALTER TABLE system_notifications ADD COLUMN recipients_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_notifications' AND column_name = 'read_count') THEN
        ALTER TABLE system_notifications ADD COLUMN read_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ========================================
-- 2. NOTIFICATION_TEMPLATES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS notification_templates (
  template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  content_html TEXT NOT NULL,
  emoji TEXT,
  category TEXT CHECK (category IN ('promotion', 'announcement', 'event', 'system', 'maintenance')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = true;

-- ========================================
-- 3. NOTIFICATION_RECIPIENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES system_notifications(notification_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_user ON notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_read ON notification_recipients(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_user_unread ON notification_recipients(user_id, is_read) WHERE is_read = false;

-- ========================================
-- 4. ADD FOREIGN KEY FOR TEMPLATE
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'system_notifications_template_id_fkey'
    ) THEN
        ALTER TABLE system_notifications 
        ADD CONSTRAINT system_notifications_template_id_fkey 
        FOREIGN KEY (template_id) REFERENCES notification_templates(template_id) ON DELETE SET NULL;
    END IF;
END $$;

-- ========================================
-- 5. TRIGGERS
-- ========================================

-- Trigger cập nhật updated_at cho templates
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger cập nhật read_count khi có người đọc
CREATE OR REPLACE FUNCTION update_notification_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND (OLD.is_read = false OR OLD.is_read IS NULL) THEN
    UPDATE system_notifications
    SET read_count = read_count + 1
    WHERE notification_id = NEW.notification_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notification_read_count ON notification_recipients;
CREATE TRIGGER trigger_update_notification_read_count
  AFTER UPDATE ON notification_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_count();

-- ========================================
-- 6. RLS POLICIES
-- ========================================

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Templates: Admins can manage
DROP POLICY IF EXISTS "Admins can view templates" ON notification_templates;
CREATE POLICY "Admins can view templates"
  ON notification_templates FOR SELECT
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can manage templates" ON notification_templates;
CREATE POLICY "Admins can manage templates"
  ON notification_templates FOR ALL
  USING (public.is_admin_user());

-- Recipients: Users can view own notifications
DROP POLICY IF EXISTS "Users can view own notification recipients" ON notification_recipients;
CREATE POLICY "Users can view own notification recipients"
  ON notification_recipients FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can update read status
DROP POLICY IF EXISTS "Users can update own read status" ON notification_recipients;
CREATE POLICY "Users can update own read status"
  ON notification_recipients FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Service role can insert recipients (for broadcast)
DROP POLICY IF EXISTS "Service role can insert recipients" ON notification_recipients;
CREATE POLICY "Service role can insert recipients"
  ON notification_recipients FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway

-- Admins can view all recipients
DROP POLICY IF EXISTS "Admins can view all recipients" ON notification_recipients;
CREATE POLICY "Admins can view all recipients"
  ON notification_recipients FOR SELECT
  USING (public.is_admin_user());

-- ========================================
-- 7. GRANT PERMISSIONS
-- ========================================
GRANT SELECT ON notification_templates TO authenticated;
GRANT SELECT, UPDATE ON notification_recipients TO authenticated;

-- ========================================
-- 8. SEED DATA - Sample Templates
-- ========================================
INSERT INTO notification_templates (name, description, content_html, emoji, category, is_active) VALUES
  (
    'Chào mừng thành viên mới',
    'Template chào mừng user mới đăng ký',
    '<h2>🎉 Chào mừng bạn đến với CupSipSmart!</h2><p>Cảm ơn bạn đã tham gia cùng chúng tôi trong hành trình bảo vệ môi trường. Hãy bắt đầu bằng việc mượn ly đầu tiên nhé! 🌱</p>',
    '🎉',
    'announcement',
    true
  ),
  (
    'Thông báo bảo trì hệ thống',
    'Template thông báo bảo trì',
    '<h3>⚠️ Thông báo bảo trì hệ thống</h3><p>Hệ thống sẽ bảo trì từ <strong>22:00 - 02:00</strong> ngày mai. Vui lòng hoàn tất giao dịch trước thời gian này.</p><p>Xin lỗi vì sự bất tiện! 🙏</p>',
    '⚠️',
    'maintenance',
    true
  ),
  (
    'Khuyến mãi đặc biệt',
    'Template khuyến mãi',
    '<h2>🎁 Ưu đãi đặc biệt dành cho bạn!</h2><p>Nhận ngay <strong style="color: #22c55e;">voucher giảm 50%</strong> cho lần đổi thưởng tiếp theo!</p><p>Sử dụng mã: <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">GREENLOVE</code></p>',
    '🎁',
    'promotion',
    true
  )
ON CONFLICT DO NOTHING;

-- ========================================
-- ✅ MIGRATION COMPLETE
-- ========================================
-- Đã tạo:
-- 1. Enhanced system_notifications (content_html, emoji, attachments)
-- 2. notification_templates - Mẫu thông báo
-- 3. notification_recipients - Tracking người nhận & đọc
-- ========================================
