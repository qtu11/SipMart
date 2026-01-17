-- VNES Wallet System - Database Schema Enhancement
-- Migration: 035_vnes_wallet_system.sql
-- Created: 2026-01-17

-- ============================================
-- WALLET LEDGER TABLE (Sổ cái chi tiết)
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    balance_before DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(15,2) NOT NULL DEFAULT 0,
    reference_type TEXT NOT NULL CHECK (reference_type IN (
        'topup', 'withdrawal', 'deposit', 'refund', 
        'fee', 'reward', 'transfer_in', 'transfer_out',
        'cup_deposit', 'cup_refund', 'transport_fare',
        'ebike_rental', 'partner_commission'
    )),
    reference_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT balance_consistency CHECK (
        (entry_type = 'credit' AND balance_after = balance_before + amount) OR
        (entry_type = 'debit' AND balance_after = balance_before - amount)
    )
);

CREATE INDEX idx_ledger_user_id ON wallet_ledger(user_id);
CREATE INDEX idx_ledger_created_at ON wallet_ledger(created_at DESC);
CREATE INDEX idx_ledger_reference ON wallet_ledger(reference_type, reference_id);
CREATE INDEX idx_ledger_user_date ON wallet_ledger(user_id, created_at DESC);

-- ============================================
-- PARTNER WALLETS TABLE (Ví đối tác)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_wallets (
    partner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_type TEXT NOT NULL CHECK (partner_type IN ('store', 'transport', 'ebike', 'merchant')),
    partner_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    pending_settlement DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (pending_settlement >= 0),
    total_earned DECIMAL(15,2) NOT NULL DEFAULT 0,
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.001, -- 0.1% default
    bank_account JSONB DEFAULT '{}', -- {bank_name, account_number, account_holder}
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_type ON partner_wallets(partner_type);
CREATE INDEX idx_partner_status ON partner_wallets(status);
CREATE INDEX idx_partner_email ON partner_wallets(email);

-- ============================================
-- PARTNER LEDGER TABLE (Sổ cái đối tác)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partner_wallets(partner_id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    balance_before DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(15,2) NOT NULL DEFAULT 0,
    reference_type TEXT NOT NULL CHECK (reference_type IN (
        'commission', 'settlement_payout', 'adjustment', 'refund_deduction'
    )),
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_ledger_partner ON partner_ledger(partner_id);
CREATE INDEX idx_partner_ledger_date ON partner_ledger(created_at DESC);

-- ============================================
-- SETTLEMENT BATCHES TABLE (Quyết toán đối tác)
-- ============================================
CREATE TABLE IF NOT EXISTS settlement_batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partner_wallets(partner_id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    gross_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    commission_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'processing', 'paid', 'failed', 'cancelled'
    )),
    approved_by UUID REFERENCES admins(admin_id),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_settlement_partner ON settlement_batches(partner_id);
CREATE INDEX idx_settlement_status ON settlement_batches(status);
CREATE INDEX idx_settlement_period ON settlement_batches(period_start, period_end);

-- ============================================
-- ESCROW ACCOUNTS TABLE (Quỹ ký quỹ)
-- ============================================
CREATE TABLE IF NOT EXISTS escrow_accounts (
    escrow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_type TEXT NOT NULL UNIQUE CHECK (escrow_type IN (
        'cup_deposit', 'transport_prepay', 'ebike_deposit', 'merchant_hold'
    )),
    total_balance DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (total_balance >= 0),
    transaction_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize escrow accounts
INSERT INTO escrow_accounts (escrow_type, total_balance) VALUES
    ('cup_deposit', 0),
    ('transport_prepay', 0),
    ('ebike_deposit', 0),
    ('merchant_hold', 0)
ON CONFLICT (escrow_type) DO NOTHING;

-- ============================================
-- ESCROW TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_type TEXT NOT NULL REFERENCES escrow_accounts(escrow_type),
    user_id UUID NOT NULL REFERENCES users(user_id),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('hold', 'release', 'forfeit')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    reference_type TEXT NOT NULL, -- 'cup_borrow', 'cup_return', 'transport_start', etc.
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escrow_tx_type ON escrow_transactions(escrow_type);
CREATE INDEX idx_escrow_tx_user ON escrow_transactions(user_id);
CREATE INDEX idx_escrow_tx_date ON escrow_transactions(created_at DESC);

-- ============================================
-- WALLET FREEZE/AUDIT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    action TEXT NOT NULL CHECK (action IN (
        'freeze', 'unfreeze', 'manual_adjustment', 'balance_correction'
    )),
    old_value JSONB,
    new_value JSONB,
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES admins(admin_id),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON wallet_audit_log(user_id);
CREATE INDEX idx_audit_date ON wallet_audit_log(created_at DESC);
CREATE INDEX idx_audit_admin ON wallet_audit_log(performed_by);

-- ============================================
-- ADD WALLET COLUMNS TO USERS TABLE
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wallet_frozen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wallet_frozen_reason TEXT,
ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(15,2) DEFAULT 5000000,
ADD COLUMN IF NOT EXISTS monthly_withdrawal_limit DECIMAL(15,2) DEFAULT 50000000;

-- ============================================
-- ATOMIC FUNCTIONS FOR WALLET OPERATIONS
-- ============================================

-- Function: Create ledger entry with balance update
CREATE OR REPLACE FUNCTION create_wallet_entry(
    p_user_id UUID,
    p_entry_type TEXT,
    p_amount DECIMAL,
    p_reference_type TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
    v_current_balance DECIMAL;
    v_new_balance DECIMAL;
    v_ledger_id UUID;
    v_is_frozen BOOLEAN;
BEGIN
    -- Check if wallet is frozen
    SELECT wallet_frozen INTO v_is_frozen FROM users WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_is_frozen THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet is frozen');
    END IF;
    
    -- Get current balance with lock
    SELECT wallet_balance INTO v_current_balance FROM users WHERE user_id = p_user_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    v_current_balance := COALESCE(v_current_balance, 0);
    
    -- Calculate new balance
    IF p_entry_type = 'credit' THEN
        v_new_balance := v_current_balance + p_amount;
    ELSIF p_entry_type = 'debit' THEN
        IF v_current_balance < p_amount THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
        END IF;
        v_new_balance := v_current_balance - p_amount;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid entry type');
    END IF;
    
    -- Insert ledger entry
    INSERT INTO wallet_ledger (
        user_id, entry_type, amount, balance_before, balance_after,
        reference_type, reference_id, description, metadata
    ) VALUES (
        p_user_id, p_entry_type, p_amount, v_current_balance, v_new_balance,
        p_reference_type, p_reference_id, p_description, p_metadata
    ) RETURNING ledger_id INTO v_ledger_id;
    
    -- Update user balance
    UPDATE users SET wallet_balance = v_new_balance WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'ledger_id', v_ledger_id,
        'balance_before', v_current_balance,
        'balance_after', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Transfer between users
CREATE OR REPLACE FUNCTION transfer_wallet_balance(
    p_from_user_id UUID,
    p_to_user_id UUID,
    p_amount DECIMAL,
    p_description TEXT DEFAULT 'Internal transfer'
) RETURNS JSONB AS $$
DECLARE
    v_debit_result JSONB;
    v_credit_result JSONB;
    v_transfer_id UUID;
BEGIN
    v_transfer_id := uuid_generate_v4();
    
    -- Debit from sender
    v_debit_result := create_wallet_entry(
        p_from_user_id, 'debit', p_amount, 'transfer_out', v_transfer_id, p_description
    );
    
    IF NOT (v_debit_result->>'success')::BOOLEAN THEN
        RETURN v_debit_result;
    END IF;
    
    -- Credit to receiver
    v_credit_result := create_wallet_entry(
        p_to_user_id, 'credit', p_amount, 'transfer_in', v_transfer_id, p_description
    );
    
    IF NOT (v_credit_result->>'success')::BOOLEAN THEN
        -- Rollback debit
        PERFORM create_wallet_entry(
            p_from_user_id, 'credit', p_amount, 'transfer_in', v_transfer_id, 'Transfer rollback'
        );
        RETURN v_credit_result;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'from_balance', v_debit_result->'balance_after',
        'to_balance', v_credit_result->'balance_after'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Hold escrow (cup deposit)
CREATE OR REPLACE FUNCTION hold_escrow(
    p_user_id UUID,
    p_escrow_type TEXT,
    p_amount DECIMAL,
    p_reference_type TEXT,
    p_reference_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_debit_result JSONB;
BEGIN
    -- Debit from user wallet
    v_debit_result := create_wallet_entry(
        p_user_id, 'debit', p_amount, p_reference_type, p_reference_id, 
        'Escrow hold: ' || p_escrow_type
    );
    
    IF NOT (v_debit_result->>'success')::BOOLEAN THEN
        RETURN v_debit_result;
    END IF;
    
    -- Update escrow balance
    UPDATE escrow_accounts 
    SET total_balance = total_balance + p_amount,
        transaction_count = transaction_count + 1,
        last_updated = NOW()
    WHERE escrow_type = p_escrow_type;
    
    -- Log escrow transaction
    INSERT INTO escrow_transactions (
        escrow_type, user_id, entry_type, amount, reference_type, reference_id
    ) VALUES (
        p_escrow_type, p_user_id, 'hold', p_amount, p_reference_type, p_reference_id
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'balance_after', v_debit_result->'balance_after'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Release escrow (cup return)
CREATE OR REPLACE FUNCTION release_escrow(
    p_user_id UUID,
    p_escrow_type TEXT,
    p_amount DECIMAL,
    p_fee DECIMAL DEFAULT 0,
    p_reference_type TEXT DEFAULT 'release',
    p_reference_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_refund_amount DECIMAL;
    v_credit_result JSONB;
BEGIN
    v_refund_amount := p_amount - p_fee;
    
    IF v_refund_amount > 0 THEN
        -- Credit back to user
        v_credit_result := create_wallet_entry(
            p_user_id, 'credit', v_refund_amount, p_reference_type, p_reference_id,
            'Escrow release: ' || p_escrow_type
        );
        
        IF NOT (v_credit_result->>'success')::BOOLEAN THEN
            RETURN v_credit_result;
        END IF;
    END IF;
    
    -- Update escrow balance
    UPDATE escrow_accounts 
    SET total_balance = total_balance - p_amount,
        transaction_count = transaction_count + 1,
        last_updated = NOW()
    WHERE escrow_type = p_escrow_type;
    
    -- Log escrow transaction
    INSERT INTO escrow_transactions (
        escrow_type, user_id, entry_type, amount, reference_type, reference_id,
        description
    ) VALUES (
        p_escrow_type, p_user_id, 'release', p_amount, p_reference_type, p_reference_id,
        CASE WHEN p_fee > 0 THEN 'Fee deducted: ' || p_fee ELSE NULL END
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'refund_amount', v_refund_amount,
        'fee', p_fee,
        'balance_after', COALESCE(v_credit_result->'balance_after', 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add partner commission
CREATE OR REPLACE FUNCTION add_partner_commission(
    p_partner_id UUID,
    p_amount DECIMAL,
    p_reference_type TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_current_balance DECIMAL;
    v_new_balance DECIMAL;
BEGIN
    -- Get current balance with lock
    SELECT balance INTO v_current_balance 
    FROM partner_wallets 
    WHERE partner_id = p_partner_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Partner not found');
    END IF;
    
    v_new_balance := COALESCE(v_current_balance, 0) + p_amount;
    
    -- Update partner wallet
    UPDATE partner_wallets 
    SET balance = v_new_balance,
        pending_settlement = pending_settlement + p_amount,
        total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE partner_id = p_partner_id;
    
    -- Insert ledger entry
    INSERT INTO partner_ledger (
        partner_id, entry_type, amount, balance_before, balance_after,
        reference_type, reference_id, description
    ) VALUES (
        p_partner_id, 'credit', p_amount, v_current_balance, v_new_balance,
        p_reference_type, p_reference_id, p_description
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'balance_after', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_audit_log ENABLE ROW LEVEL SECURITY;

-- User can view own ledger
CREATE POLICY "Users can view own ledger" ON wallet_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- Admin can view all ledgers
CREATE POLICY "Admins can view all ledgers" ON wallet_ledger
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email')
    );

-- Partners can view own wallet
CREATE POLICY "Partners can view own wallet" ON partner_wallets
    FOR SELECT USING (email = auth.jwt()->>'email');

-- Admin can manage partner wallets
CREATE POLICY "Admins can manage partner wallets" ON partner_wallets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email')
    );

-- Admin can view settlements
CREATE POLICY "Admins can manage settlements" ON settlement_batches
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email')
    );

-- Partners can view own settlements
CREATE POLICY "Partners can view own settlements" ON settlement_batches
    FOR SELECT USING (
        partner_id IN (SELECT partner_id FROM partner_wallets WHERE email = auth.jwt()->>'email')
    );

-- Admin only for escrow and audit
CREATE POLICY "Admins can view escrow" ON escrow_accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email')
    );

CREATE POLICY "Admins can view audit log" ON wallet_audit_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email')
    );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION create_wallet_entry TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_wallet_balance TO service_role;
GRANT EXECUTE ON FUNCTION hold_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION release_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION add_partner_commission TO service_role;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'VNES Wallet System schema created successfully!' AS status;
