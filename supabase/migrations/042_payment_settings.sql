-- Migration: Dynamic Payment Configuration System
-- Allows admins to manage payment settings via UI instead of hard-coded .env

-- 1. Payment Settings Table
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    config_value_encrypted BYTEA, -- For sensitive data
    is_sensitive BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_name, config_key)
);

-- 2. Audit Log for Payment Settings Changes
CREATE TABLE IF NOT EXISTS payment_settings_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_id UUID REFERENCES payment_settings(id) ON DELETE SET NULL,
    provider_name VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    old_value_masked VARCHAR(255),
    new_value_masked VARCHAR(255),
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'toggle'
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_payment_settings_provider ON payment_settings(provider_name);
CREATE INDEX IF NOT EXISTS idx_payment_settings_active ON payment_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_audit_setting ON payment_settings_audit(setting_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_changed_at ON payment_settings_audit(changed_at DESC);

-- 4. RLS Policies (Admin only)
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify payment settings
CREATE POLICY "Admin can view payment_settings"
    ON payment_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin can modify payment_settings"
    ON payment_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin can view payment_audit"
    ON payment_settings_audit FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- 5. Seed Default Payment Providers
INSERT INTO payment_settings (provider_name, config_key, config_value, is_sensitive, description, is_active)
VALUES
    -- VNPay Settings
    ('vnpay', 'VNP_TMNCODE', '', true, 'VNPay Terminal ID', true),
    ('vnpay', 'VNP_HASHSECRET', '', true, 'VNPay Secret Key', true),
    ('vnpay', 'VNP_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', false, 'VNPay Payment URL', true),
    ('vnpay', 'VNP_RETURNURL', '/payment/vnpay_return', false, 'Return URL after payment', true),
    
    -- MoMo Settings
    ('momo', 'MOMO_PARTNER_CODE', '', true, 'MoMo Partner Code', false),
    ('momo', 'MOMO_ACCESS_KEY', '', true, 'MoMo Access Key', false),
    ('momo', 'MOMO_SECRET_KEY', '', true, 'MoMo Secret Key', false),
    
    -- Bank Transfer Settings
    ('bank', 'BANK_NAME', 'Vietcombank', false, 'Tên ngân hàng', true),
    ('bank', 'BANK_ACCOUNT_NUMBER', '', true, 'Số tài khoản', true),
    ('bank', 'BANK_ACCOUNT_NAME', '', false, 'Tên chủ tài khoản', true),
    ('bank', 'BANK_BRANCH', '', false, 'Chi nhánh', true),
    ('bank', 'BANK_BIN', '970436', false, 'Bank BIN for VietQR', true)
ON CONFLICT (provider_name, config_key) DO NOTHING;

-- 6. Helper function to mask sensitive values
CREATE OR REPLACE FUNCTION mask_sensitive_value(val TEXT, show_last INT DEFAULT 4)
RETURNS TEXT AS $$
BEGIN
    IF val IS NULL OR LENGTH(val) <= show_last THEN
        RETURN '****';
    END IF;
    RETURN REPEAT('*', LENGTH(val) - show_last) || RIGHT(val, show_last);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_payment_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_settings_updated_at ON payment_settings;
CREATE TRIGGER payment_settings_updated_at
    BEFORE UPDATE ON payment_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_settings_timestamp();

-- 8. Trigger to auto-log changes
CREATE OR REPLACE FUNCTION log_payment_settings_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO payment_settings_audit (
            setting_id, provider_name, config_key,
            old_value_masked, new_value_masked,
            action, changed_by
        ) VALUES (
            NEW.id, NEW.provider_name, NEW.config_key,
            mask_sensitive_value(OLD.config_value),
            mask_sensitive_value(NEW.config_value),
            'update', auth.uid()
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO payment_settings_audit (
            setting_id, provider_name, config_key,
            old_value_masked, new_value_masked,
            action, changed_by
        ) VALUES (
            NEW.id, NEW.provider_name, NEW.config_key,
            NULL,
            mask_sensitive_value(NEW.config_value),
            'create', auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS payment_settings_audit_trigger ON payment_settings;
CREATE TRIGGER payment_settings_audit_trigger
    AFTER INSERT OR UPDATE ON payment_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_settings_change();
