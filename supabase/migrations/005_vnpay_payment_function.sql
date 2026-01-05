-- Database function for atomic VNPay payment processing
-- Run this in Supabase SQL editor

-- Function: Process VNPay payment atomically
CREATE OR REPLACE FUNCTION process_vnpay_payment(
    p_user_id TEXT,
    p_transaction_code TEXT,
    p_amount NUMERIC,
    p_vnpay_transaction_no TEXT DEFAULT '',
    p_bank_code TEXT DEFAULT '',
    p_pay_date TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
    v_existing_status TEXT;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- 1. Check if transaction already processed (idempotency)
    SELECT status INTO v_existing_status
    FROM payment_transactions
    WHERE transaction_code = p_transaction_code;

    IF v_existing_status = 'success' THEN
        RETURN jsonb_build_object('status', 'duplicate', 'message', 'Already processed');
    END IF;

    -- 2. Get current balance
    SELECT wallet_balance INTO v_current_balance
    FROM users
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock row

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;

    v_new_balance := COALESCE(v_current_balance, 0) + p_amount;

    -- 3. Insert or update payment transaction
    INSERT INTO payment_transactions (
        user_id,
        type,
        amount,
        payment_method,
        transaction_code,
        status,
        completed_at,
        metadata
    ) VALUES (
        p_user_id,
        'topup',
        p_amount,
        'vnpay',
        p_transaction_code,
        'success',
        NOW(),
        jsonb_build_object(
            'vnpay_transaction_no', p_vnpay_transaction_no,
            'bank_code', p_bank_code,
            'pay_date', p_pay_date
        )::TEXT
    )
    ON CONFLICT (transaction_code) DO UPDATE SET
        status = 'success',
        completed_at = NOW(),
        metadata = jsonb_build_object(
            'vnpay_transaction_no', p_vnpay_transaction_no,
            'bank_code', p_bank_code,
            'pay_date', p_pay_date
        )::TEXT;

    -- 4. Update wallet balance
    UPDATE users
    SET wallet_balance = v_new_balance
    WHERE user_id = p_user_id;

    -- 5. Create notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        url
    ) VALUES (
        p_user_id,
        'success',
        'Nạp tiền thành công',
        'Bạn đã nạp ' || p_amount::TEXT || 'đ vào ví thành công.',
        '/wallet'
    );

    RETURN jsonb_build_object(
        'status', 'success',
        'new_balance', v_new_balance,
        'amount', p_amount
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_vnpay_payment TO service_role;

-- Add unique constraint on transaction_code if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payment_transactions_transaction_code_key'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT payment_transactions_transaction_code_key 
        UNIQUE (transaction_code);
    END IF;
END $$;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_payment_transactions_code 
ON payment_transactions(transaction_code);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_type 
ON payment_transactions(user_id, type, status);
