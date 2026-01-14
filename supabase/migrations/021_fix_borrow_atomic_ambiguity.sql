-- Fix ambiguous borrow_cup_atomic function
-- Drop all possible variations of the function to ensure clean slate

DROP FUNCTION IF EXISTS borrow_cup_atomic(text, text, text, numeric);
DROP FUNCTION IF EXISTS borrow_cup_atomic(text, text, text); -- In case old signature exists

-- Recreate the function with wallet deduction logic
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
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION borrow_cup_atomic TO service_role;
