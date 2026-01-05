-- ========================================
-- CupSipSmart - Database Performance & Security Fixes (CORRECTED)
-- Add missing indexes and foreign key constraints
-- ========================================

-- ========================================
-- 1. ADD MISSING COLUMNS FIRST (IF NOT EXISTS)
-- ========================================

-- Check and add current_store_id to cups table if it doesn't exist
DO $$ 
BEGIN
    -- Add current_store_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cups' AND column_name = 'current_store_id'
    ) THEN
        ALTER TABLE cups ADD COLUMN current_store_id UUID;
    END IF;
END $$;

-- ========================================
-- 2. ADD MISSING FOREIGN KEY CONSTRAINTS
-- ========================================

-- Add FK constraint for cups.current_store_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_cups_current_store'
    ) THEN
        ALTER TABLE cups 
            ADD CONSTRAINT fk_cups_current_store 
            FOREIGN KEY (current_store_id) 
            REFERENCES stores(store_id) 
            ON DELETE SET NULL;  -- Changed from RESTRICT to SET NULL for safety
    END IF;
END $$;

-- ========================================
-- 3. CREATE MISSING TABLES (IF NOT EXISTS)
-- ========================================

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    achievement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cups', 'points', 'social', 'streak', 'eco', 'special')),
    requirement INTEGER NOT NULL CHECK (requirement > 0),
    reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('voucher', 'merchandise', 'experience', 'donation')),
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Claims table
CREATE TABLE IF NOT EXISTS reward_claims (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(reward_id) ON DELETE RESTRICT,
    points_used INTEGER NOT NULL CHECK (points_used >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'used', 'expired')),
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- User Achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
    user_achievement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ========================================
-- 4. ADD MISSING INDEXES FOR PERFORMANCE
-- ========================================

-- Cups table indexes
CREATE INDEX IF NOT EXISTS idx_cups_current_store ON cups(current_store_id) WHERE current_store_id IS NOT NULL;

-- Achievements table indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_achievements_requirement ON achievements(requirement);

-- Rewards table indexes
CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_points_cost ON rewards(points_cost);
CREATE INDEX IF NOT EXISTS idx_rewards_stock ON rewards(stock) WHERE stock > 0;

-- Reward Claims table indexes
CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON reward_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward ON reward_claims(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_status ON reward_claims(status);
CREATE INDEX IF NOT EXISTS idx_reward_claims_claimed_at ON reward_claims(claimed_at DESC);

-- User Achievements table indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- Users table - composite index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_leaderboard 
    ON users(green_points DESC, total_cups_saved DESC) 
    WHERE is_blacklisted = false;

-- Transactions table - composite index for user active transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_active 
    ON transactions(user_id, status) 
    WHERE status IN ('ongoing', 'overdue');

-- Eco Actions table - composite index for user timeline
CREATE INDEX IF NOT EXISTS idx_eco_actions_user_timeline 
    ON eco_actions(user_id, timestamp DESC);

-- ========================================
-- 5. ADD RLS POLICIES FOR NEW TABLES
-- ========================================

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements policies (public read)
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements"
    ON achievements FOR SELECT
    USING (is_active = true);

-- Rewards policies (public read active rewards)
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
CREATE POLICY "Anyone can view active rewards"
    ON rewards FOR SELECT
    USING (is_active = true);

-- Reward Claims policies (users can only see own claims)
DROP POLICY IF EXISTS "Users can view own reward claims" ON reward_claims;
CREATE POLICY "Users can view own reward claims"
    ON reward_claims FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create own reward claims" ON reward_claims;
CREATE POLICY "Users can create own reward claims"
    ON reward_claims FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own reward claims" ON reward_claims;
CREATE POLICY "Users can update own reward claims"
    ON reward_claims FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- User Achievements policies
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Public can view user achievements for leaderboard" ON user_achievements;
CREATE POLICY "Public can view user achievements for leaderboard"
    ON user_achievements FOR SELECT
    USING (true);

-- ========================================
-- 6. ADD TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update reward stock when claimed
CREATE OR REPLACE FUNCTION update_reward_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'claimed' THEN
        UPDATE rewards
        SET stock = GREATEST(stock - 1, 0)
        WHERE reward_id = NEW.reward_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_reward_stock ON reward_claims;
CREATE TRIGGER trigger_update_reward_stock
    AFTER INSERT ON reward_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_reward_stock();

-- ========================================
-- 7. CLEANUP & VERIFICATION
-- ========================================

-- Vacuum tables for performance (optional, can be commented out for large databases)
-- VACUUM ANALYZE achievements;
-- VACUUM ANALYZE rewards;
-- VACUUM ANALYZE reward_claims;
-- VACUUM ANALYZE user_achievements;

-- ========================================
-- 8. VERIFICATION QUERIES
-- ========================================

-- Check if all tables exist
DO $$
BEGIN
    RAISE NOTICE 'Checking tables...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        RAISE NOTICE '✓ achievements table exists';
    ELSE
        RAISE WARNING '✗ achievements table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards') THEN
        RAISE NOTICE '✓ rewards table exists';
    ELSE
        RAISE WARNING '✗ rewards table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reward_claims') THEN
        RAISE NOTICE '✓ reward_claims table exists';
    ELSE
        RAISE WARNING '✗ reward_claims table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
        RAISE NOTICE '✓ user_achievements table exists';
    ELSE
        RAISE WARNING '✗ user_achievements table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cups' AND column_name = 'current_store_id') THEN
        RAISE NOTICE '✓ cups.current_store_id column exists';
    ELSE
        RAISE WARNING '✗ cups.current_store_id column missing';
    END IF;
END $$;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- This script is now safe to run multiple times
-- All operations are idempotent
-- ========================================
