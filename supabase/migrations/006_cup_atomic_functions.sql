-- Atomic Cup Operations for CupSipSmart
-- These functions prevent race conditions when borrowing/returning cups

-- Function: Borrow cup atomically
-- Function: Borrow cup atomically with wallet deduction
CREATE OR REPLACE FUNCTION borrow_cup_atomic(
    p_cup_id TEXT,
    p_user_id TEXT,
    p_transaction_id TEXT,
    p_deposit_amount NUMERIC DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    v_current_status TEXT;
    v_user_balance NUMERIC;
BEGIN
    -- 1. Check User Balance & Deduct (Atomic update)
    UPDATE users 
    SET wallet_balance = wallet_balance - p_deposit_amount
    WHERE user_id = p_user_id::uuid 
    AND wallet_balance >= p_deposit_amount
    RETURNING wallet_balance INTO v_user_balance;

    IF NOT FOUND THEN
        -- Check if user exists or just low balance
        SELECT wallet_balance INTO v_user_balance FROM users WHERE user_id = p_user_id::uuid;
        IF NOT FOUND THEN
             RETURN jsonb_build_object('success', false, 'message', 'User not found');
        ELSE
             RETURN jsonb_build_object('success', false, 'message', 'Insufficient wallet balance');
        END IF;
    END IF;

    -- 2. Lock the cup row for update
    SELECT status INTO v_current_status
    FROM cups
    WHERE cup_id = p_cup_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- ROLLBACK balance deduction if cup not found
        UPDATE users SET wallet_balance = wallet_balance + p_deposit_amount WHERE user_id = p_user_id::uuid;
        RETURN jsonb_build_object('success', false, 'message', 'Cup not found');
    END IF;

    IF v_current_status != 'available' THEN
        -- ROLLBACK balance deduction if cup not available
        UPDATE users SET wallet_balance = wallet_balance + p_deposit_amount WHERE user_id = p_user_id::uuid;
        RETURN jsonb_build_object('success', false, 'message', 'Cup is not available', 'status', v_current_status);
    END IF;

    -- 3. Update cup to in_use
    UPDATE cups
    SET 
        status = 'in_use',
        current_user_id = p_user_id::uuid,
        current_transaction_id = p_transaction_id::uuid,
        total_uses = total_uses + 1
    WHERE cup_id = p_cup_id;

    RETURN jsonb_build_object('success', true, 'message', 'Cup borrowed successfully', 'new_balance', v_user_balance);

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback logic is complex in exception block without transaction control, 
        -- but generic SQL error usually rolls back the transaction.
        -- Explicitly compensating here might be redundant if called via RPC/Transaction
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Function: Return cup atomically
CREATE OR REPLACE FUNCTION return_cup_atomic(
    p_cup_id TEXT,
    p_expected_user_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_current_status TEXT;
    v_current_user_id TEXT;
BEGIN
    -- Lock the cup row for update
    SELECT status, current_user_id INTO v_current_status, v_current_user_id
    FROM cups
    WHERE cup_id = p_cup_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cup not found');
    END IF;

    IF v_current_status != 'in_use' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cup is not in use. Current status: ' || v_current_status);
    END IF;

    IF v_current_user_id IS NULL OR v_current_user_id != p_expected_user_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cup is not borrowed by this user');
    END IF;

    -- Update cup to available
    UPDATE cups
    SET 
        status = 'available',
        current_user_id = NULL,
        current_transaction_id = NULL
    WHERE cup_id = p_cup_id;

    RETURN jsonb_build_object('success', true, 'message', 'Cup returned successfully');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Function: Increment cup uses (atomic)
CREATE OR REPLACE FUNCTION increment_cup_uses(
    p_cup_id TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE cups
    SET total_uses = total_uses + 1
    WHERE cup_id = p_cup_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION borrow_cup_atomic TO service_role;
GRANT EXECUTE ON FUNCTION return_cup_atomic TO service_role;
GRANT EXECUTE ON FUNCTION increment_cup_uses TO service_role;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_cups_status ON cups(status);
CREATE INDEX IF NOT EXISTS idx_cups_current_user ON cups(current_user_id);
CREATE INDEX IF NOT EXISTS idx_cups_store ON cups(store_id);
