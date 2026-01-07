-- Migration: 014_partner_management.sql
-- Description: Setup tables for Partner Management (Contracts, Settlements, Merchant Accounts)

-- 1. Partner Contracts (Hợp đồng đối tác)
CREATE TABLE IF NOT EXISTS partner_contracts (
  contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(store_id) NOT NULL,
  contract_type TEXT CHECK (contract_type IN ('revenue_share', 'fixed_fee', 'hybrid')) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 0, -- % hoa hồng cho SipMart
  fixed_fee DECIMAL(12,2) DEFAULT 0, -- Phí cố định hàng tháng
  start_date DATE NOT NULL,
  end_date DATE,
  document_url TEXT, -- Link file hợp đồng scan
  status TEXT CHECK (status IN ('draft', 'active', 'expired', 'terminated')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Settlements (Đối soát doanh thu)
CREATE TABLE IF NOT EXISTS settlements (
  settlement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(store_id) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_transactions INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  commission_amount DECIMAL(12,2) DEFAULT 0,
  fixed_fee DECIMAL(12,2) DEFAULT 0,
  net_payable DECIMAL(12,2) DEFAULT 0, -- Số tiền quán nhận được (Revenue - Commission - Fee)
  status TEXT CHECK (status IN ('pending', 'approved', 'paid')) DEFAULT 'pending',
  approved_by UUID REFERENCES admins(admin_id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 3. Merchant Accounts (Tài khoản nhân viên quán)
CREATE TABLE IF NOT EXISTS merchant_accounts (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(store_id) NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- Link với user auth
  role TEXT CHECK (role IN ('owner', 'manager', 'staff')) DEFAULT 'staff',
  pin_code TEXT, -- Access code nhanh cho POS
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, user_id)
);

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_store ON partner_contracts(store_id);
CREATE INDEX IF NOT EXISTS idx_settlements_store ON settlements(store_id);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_store ON merchant_accounts(store_id);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_user ON merchant_accounts(user_id);

-- RLS Policies
ALTER TABLE partner_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_accounts ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access contracts" ON partner_contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins full access settlements" ON settlements FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins full access merchant_accounts" ON merchant_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

-- Merchant access (read own data) - Optional later when building Merchant Portal
-- For now Admin panel focus only.
