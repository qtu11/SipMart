-- ========================================
-- Migration 009: Performance Indexes & Improvements
-- Thêm composite indexes để tối ưu queries
-- ========================================

-- 1. Composite indexes cho transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_status 
  ON transactions(user_id, status);
  
CREATE INDEX IF NOT EXISTS idx_transactions_user_ongoing 
  ON transactions(user_id) 
  WHERE status = 'ongoing';

CREATE INDEX IF NOT EXISTS idx_transactions_overdue 
  ON transactions(status, due_time) 
  WHERE status = 'ongoing';

-- 2. Composite indexes cho payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_user_status 
  ON payment_transactions(user_id, status);
  
CREATE INDEX IF NOT EXISTS idx_payment_pending 
  ON payment_transactions(status, created_at) 
  WHERE status = 'pending';

-- 3. Composite indexes cho notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read);
  
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, timestamp) 
  WHERE read = false;

-- 4. Index cho user rankings/leaderboard
CREATE INDEX IF NOT EXISTS idx_users_green_points 
  ON users(green_points DESC) 
  WHERE is_blacklisted = false;

CREATE INDEX IF NOT EXISTS idx_users_rank_points 
  ON users(rank_level, green_points DESC);

-- 5. Index cho reward claims
CREATE INDEX IF NOT EXISTS idx_reward_claims_user_status 
  ON reward_claims(user_id, status);

-- 6. Index cho user challenges
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_status 
  ON user_challenges(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_challenges_active 
  ON user_challenges(challenge_id, status) 
  WHERE status = 'in_progress';

-- 7. Index cho eco actions
CREATE INDEX IF NOT EXISTS idx_eco_actions_user_type 
  ON eco_actions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_eco_actions_timestamp_type 
  ON eco_actions(timestamp, type);

-- 8. Soft delete cho cups (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cups' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE cups ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 9. Thêm index cho cups active
CREATE INDEX IF NOT EXISTS idx_cups_active_status 
  ON cups(status) 
  WHERE deleted_at IS NULL;

-- ========================================
-- ✅ MIGRATION COMPLETE
-- Added 12 performance indexes
-- ========================================
