-- =====================================================
-- SipSmart Partner Payout & Financial System
-- Migration 029: Split Payment & Escrow Management
-- =====================================================

-- Partner Financial Details
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS tax_code TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_license TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS auto_payout_enabled BOOLEAN DEFAULT false;

-- Partner Payouts
CREATE TABLE IF NOT EXISTS partner_payouts (
  payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  
  -- Payout Period
  payout_period_start TIMESTAMPTZ NOT NULL,
  payout_period_end TIMESTAMPTZ NOT NULL,
  
  -- Financial Details
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0, -- 99.9% of transactions
  commission_deducted NUMERIC(12,2) DEFAULT 0, -- 0.1% SipSmart fee
  transaction_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Bank Transfer
  bank_transfer_reference TEXT,
  bank_transfer_fee NUMERIC(10,2) DEFAULT 0,
  net_payout NUMERIC(12,2), -- total_revenue - bank_transfer_fee
  
  -- Processing
  processed_by UUID REFERENCES users(user_id),
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_partner_period ON partner_payouts(partner_id, payout_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON partner_payouts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_pending ON partner_payouts(status) WHERE status = 'pending';

-- Escrow Pool Management
CREATE TABLE IF NOT EXISTS escrow_transactions (
  escrow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL 
    CHECK (transaction_type IN ('deposit', 'refund', 'penalty', 'forfeit')),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Related Transaction
  related_transaction_id UUID, -- Link to transactions or ebike_rentals
  related_resource_type TEXT, -- 'cup_transaction', 'ebike_rental'
  
  -- Amount
  amount NUMERIC(10,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  
  -- Details
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_user ON escrow_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escrow_type ON escrow_transactions(transaction_type, created_at DESC);

-- System Settings for Financial Configuration
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES 
  ('escrow_pool_balance', '{"amount": 0, "currency": "VND", "last_updated": "2026-01-16T00:00:00Z"}', 'Total escrow pool balance'),
  ('commission_rate', '{"rate": 0.001, "description": "0.1% platform fee for split payments"}', 'SipSmart commission rate'),
  ('ebike_pricing', '{
    "1h": 20000,
    "3h": 45000,
    "5h": 80000,
    "24h": 120000
  }', 'e-Bike rental pricing tiers'),
  ('cup_deposit', '{"amount": 20000, "penalty_per_hour": 2000, "max_penalty": 20000}', 'Cup deposit and penalty settings'),
  ('payout_schedule', '{"auto": false, "frequency": "daily", "time": "23:59"}', 'Partner payout schedule')
ON CONFLICT (key) DO NOTHING;

-- Revenue Summary View for Partners
CREATE OR REPLACE VIEW partner_revenue_summary AS
SELECT 
  s.store_id,
  s.name AS partner_name,
  s.partner_type,
  COUNT(DISTINCT t.trip_id) AS total_trips,
  SUM(t.partner_amount) AS total_revenue,
  SUM(t.commission_amount) AS total_commission,
  SUM(t.co2_saved_kg) AS total_co2_saved,
  MIN(t.start_time) AS first_trip_date,
  MAX(t.start_time) AS last_trip_date
FROM stores s
LEFT JOIN green_mobility_trips t ON s.store_id = t.transport_partner_id
WHERE s.partner_type IN ('transport', 'ebike_station')
GROUP BY s.store_id, s.name, s.partner_type;

COMMENT ON TABLE partner_payouts IS 'Tracks partner revenue payouts with 99.9% split';
COMMENT ON TABLE escrow_transactions IS 'Escrow pool for cup deposits and refunds';
COMMENT ON TABLE system_settings IS 'Global system configuration (fees, pricing, schedules)';
