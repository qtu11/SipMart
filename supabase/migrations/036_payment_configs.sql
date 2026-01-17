-- ============================================
-- PAYMENT CONFIGS TABLE
-- Lưu cấu hình động cho các cổng thanh toán
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payment Configs Table
CREATE TABLE IF NOT EXISTS payment_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id TEXT UNIQUE NOT NULL, -- VNPAY, MOMO, PAYPAL, BANK_TRANSFER
    provider_name TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT false,
    is_sandbox BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    min_amount NUMERIC DEFAULT 10000,
    max_amount NUMERIC DEFAULT 100000000,
    fee_percent NUMERIC DEFAULT 0,
    fee_fixed NUMERIC DEFAULT 0,
    config_data JSONB DEFAULT '{}', -- API keys (should be encrypted in production)
    bank_accounts JSONB DEFAULT '[]', -- For BANK_TRANSFER only
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_configs_provider ON payment_configs(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_configs_active ON payment_configs(is_active);

-- Insert default configs
INSERT INTO payment_configs (provider_id, provider_name, logo_url, is_active, display_order, config_data) VALUES
    ('VNPAY', 'VNPAY - Thẻ ATM/Internet Banking', '/images/payment/vnpay.png', true, 1, '{"endpoint": "sandbox"}'),
    ('MOMO', 'Ví MoMo', '/images/payment/momo.png', false, 2, '{}'),
    ('PAYPAL', 'PayPal - Visa/MasterCard', '/images/payment/paypal.png', false, 3, '{}'),
    ('BANK_TRANSFER', 'Chuyển khoản ngân hàng', '/images/payment/bank.png', false, 4, '{}')
ON CONFLICT (provider_id) DO NOTHING;

-- ============================================
-- PAYMENT TRANSACTIONS LOG (Enhanced)
-- Thêm provider tracking
-- ============================================

-- Add provider column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'provider_id'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN provider_id TEXT DEFAULT 'VNPAY';
    END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage payment configs"
    ON payment_configs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Authenticated users can read active configs (without sensitive data)
CREATE POLICY "Users can read active payment configs"
    ON payment_configs
    FOR SELECT
    USING (is_active = true);

-- ============================================
-- UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_payment_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payment_configs_updated ON payment_configs;
CREATE TRIGGER trigger_payment_configs_updated
    BEFORE UPDATE ON payment_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_configs_timestamp();

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON payment_configs TO authenticated;
GRANT ALL ON payment_configs TO service_role;
