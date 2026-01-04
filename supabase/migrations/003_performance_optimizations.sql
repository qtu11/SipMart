-- ============================================
-- CupSipSmart Database Optimizations
-- Race Condition Prevention & Performance
-- ============================================

-- 1. RPC Function: Atomic Cup Uses Increment
-- Prevents race conditions when incrementing cup usage
CREATE OR REPLACE FUNCTION increment_cup_uses(p_cup_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE cups 
  SET total_uses = total_uses + 1 
  WHERE cup_id = p_cup_id;
END;
$$ LANGUAGE plpgsql;

-- 2. RPC Function: Atomic Cup Borrow (Critical Section)
-- Ensures only ONE user can borrow a cup at a time
CREATE OR REPLACE FUNCTION borrow_cup_atomic(
  p_cup_id TEXT,
  p_user_id TEXT,
  p_transaction_id TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Lock the row for update (prevents concurrent modifications)
  SELECT status INTO v_current_status
  FROM cups
  WHERE cup_id = p_cup_id
  FOR UPDATE NOWAIT; -- Fail immediately if another transaction is processing
  
  -- Check if cup is available
  IF v_current_status != 'available' THEN
    RETURN QUERY SELECT FALSE, 'Cup is ' || v_current_status;
    RETURN;
  END IF;
  
  -- Update cup status atomically
  UPDATE cups
  SET 
    status = 'in_use',
    current_user_id = p_user_id,
    current_transaction_id = p_transaction_id,
    total_uses = total_uses + 1
  WHERE cup_id = p_cup_id;
  
  RETURN QUERY SELECT TRUE, 'Cup borrowed successfully';
END;
$$ LANGUAGE plpgsql;

-- 3. RPC Function: Atomic Cup Return
CREATE OR REPLACE FUNCTION return_cup_atomic(
  p_cup_id TEXT,
  p_expected_user_id TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_current_user TEXT;
  v_current_status TEXT;
BEGIN
  -- Lock the row
  SELECT current_user_id, status INTO v_current_user, v_current_status
  FROM cups
  WHERE cup_id = p_cup_id
  FOR UPDATE NOWAIT;
  
  -- Verify user owns this cup
  IF v_current_user != p_expected_user_id THEN
    RETURN QUERY SELECT FALSE, 'Cup not borrowed by this user';
    RETURN;
  END IF;
  
  IF v_current_status != 'in_use' THEN
    RETURN QUERY SELECT FALSE, 'Cup is not in use';
    RETURN;
  END IF;
  
  -- Mark cup for cleaning
  UPDATE cups
  SET 
    status = 'cleaning',
    current_user_id = NULL,
    current_transaction_id = NULL
  WHERE cup_id = p_cup_id;
  
  RETURN QUERY SELECT TRUE, 'Cup returned successfully';
END;
$$ LANGUAGE plpgsql;

-- 4. Performance Indexes
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_cups_status 
  ON cups(status);

CREATE INDEX IF NOT EXISTS idx_cups_current_user 
  ON cups(current_user_id) 
  WHERE current_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cups_store 
  ON cups(current_store_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_status 
  ON transactions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_transactions_status_due_time 
  ON transactions(status, due_time) 
  WHERE status = 'ongoing';

CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user 
  ON friend_requests(to_user_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_users 
  ON friendships(user_id1, user_id2);

-- 5. Database Constraints for Data Integrity
-- Ensure cup can only be borrowed by one user at a time
ALTER TABLE cups 
  ADD CONSTRAINT check_in_use_has_user 
  CHECK (
    (status = 'in_use' AND current_user_id IS NOT NULL) OR 
    (status != 'in_use' AND current_user_id IS NULL)
  );

-- Ensure transaction has valid status transitions
CREATE OR REPLACE FUNCTION validate_transaction_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Cannot go from completed/cancelled back to ongoing
  IF OLD.status IN ('completed', 'cancelled') AND NEW.status = 'ongoing' THEN
    RAISE EXCEPTION 'Cannot revert completed transaction to ongoing';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_transaction_status
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_status();

-- 6. Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables (if updated_at column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 7. View: Active Borrows (for monitoring)
CREATE OR REPLACE VIEW active_borrows AS
SELECT 
  t.transaction_id,
  t.user_id,
  u.display_name,
  u.email,
  t.cup_id,
  c.qr_code,
  t.borrow_time,
  t.due_time,
  EXTRACT(EPOCH FROM (NOW() - t.due_time))/3600 AS hours_overdue,
  t.status,
  s.name AS borrow_store_name
FROM transactions t
JOIN users u ON t.user_id = u.user_id
JOIN cups c ON t.cup_id = c.cup_id
JOIN stores s ON t.borrow_store_id = s.store_id
WHERE t.status IN ('ongoing', 'overdue')
ORDER BY t.due_time ASC;

-- 8. View: Store Inventory (for admin dashboard)
CREATE OR REPLACE VIEW store_inventory_summary AS
SELECT 
  s.store_id,
  s.name,
  s.location,
  COUNT(CASE WHEN c.status = 'available' THEN 1 END) AS cups_available,
  COUNT(CASE WHEN c.status = 'in_use' THEN 1 END) AS cups_in_use,
  COUNT(CASE WHEN c.status = 'cleaning' THEN 1 END) AS cups_cleaning,
  COUNT(CASE WHEN c.status = 'damaged' THEN 1 END) AS cups_damaged,
  COUNT(*) AS total_cups
FROM stores s
LEFT JOIN cups c ON s.store_id = c.current_store_id
GROUP BY s.store_id, s.name, s.location;

-- 9. Materialized View: User Rankings (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_rankings AS
SELECT 
  user_id,
  display_name,
  avatar,
  green_points,
  total_cups_saved,
  rank_level,
  ROW_NUMBER() OVER (ORDER BY green_points DESC) AS rank
FROM users
WHERE is_blacklisted = FALSE
ORDER BY green_points DESC;

-- Refresh rankings every hour (add to cron job)
CREATE INDEX IF NOT EXISTS idx_user_rankings_rank ON user_rankings(rank);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_user_rankings()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_rankings;
END;
$$ LANGUAGE plpgsql;

-- 10. Analytics Helper Functions
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id TEXT)
RETURNS TABLE(
  total_borrows INTEGER,
  successful_returns INTEGER,
  overdue_returns INTEGER,
  total_green_points INTEGER,
  current_rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_borrows,
    COUNT(CASE WHEN status = 'completed' AND NOT is_overdue THEN 1 END)::INTEGER AS successful_returns,
    COUNT(CASE WHEN is_overdue THEN 1 END)::INTEGER AS overdue_returns,
    COALESCE(SUM(green_points_earned), 0)::INTEGER AS total_green_points,
    (SELECT rank::INTEGER FROM user_rankings WHERE user_id = p_user_id)
  FROM transactions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION increment_cup_uses TO authenticated;
GRANT EXECUTE ON FUNCTION borrow_cup_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION return_cup_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_rankings TO service_role;

-- Grant select on views
GRANT SELECT ON active_borrows TO authenticated;
GRANT SELECT ON store_inventory_summary TO authenticated;
GRANT SELECT ON user_rankings TO authenticated, anon;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION borrow_cup_atomic IS 
  'Atomically borrows a cup, preventing race conditions with row-level locking';

COMMENT ON FUNCTION return_cup_atomic IS 
  'Atomically returns a cup, ensuring only the borrower can return it';

COMMENT ON VIEW active_borrows IS 
  'Real-time view of all active cup borrows with overdue calculations';

COMMENT ON MATERIALIZED VIEW user_rankings IS 
  'Cached user rankings by green points, refresh hourly';
