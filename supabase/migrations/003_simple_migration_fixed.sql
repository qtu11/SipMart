-- ========================================
-- CupSipSmart - Simple Migration (Fixed All Errors)
-- Run this in Supabase SQL Editor
-- ========================================

-- ========================================
-- 1. ADD MISSING COLUMNS
-- ========================================

-- Add current_store_id to cups if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cups' AND column_name = 'current_store_id'
    ) THEN
        ALTER TABLE cups ADD COLUMN current_store_id UUID;
        RAISE NOTICE '✓ Added current_store_id to cups table';
    END IF;
END $$;

-- ========================================
-- 2. CREATE NEW TABLES (Simplified - No is_active initially)
-- ========================================

-- Achievements table (simplified)
CREATE TABLE IF NOT EXISTS achievements (
    achievement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    requirement INTEGER NOT NULL CHECK (requirement > 0),
    reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards table (simplified)
CREATE TABLE IF NOT EXISTS rewards (
    reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
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

-- User Achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    user_achievement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ========================================
-- 3. ADD INDEXES (Performance boost)
-- ========================================

-- Cups indexes
CREATE INDEX IF NOT EXISTS idx_cups_current_store ON cups(current_store_id) WHERE current_store_id IS NOT NULL;

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_requirement ON achievements(requirement);

-- Rewards indexes
CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_points_cost ON rewards(points_cost);
CREATE INDEX IF NOT EXISTS idx_rewards_stock ON rewards(stock) WHERE stock > 0;

-- Reward Claims indexes
CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON reward_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward ON reward_claims(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_status ON reward_claims(status);

-- User Achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Users leaderboard index
CREATE INDEX IF NOT EXISTS idx_users_leaderboard 
    ON users(green_points DESC, total_cups_saved DESC) 
    WHERE is_blacklisted = false;

-- Transactions active index
CREATE INDEX IF NOT EXISTS idx_transactions_user_active 
    ON transactions(user_id, status) 
    WHERE status IN ('ongoing', 'overdue');

-- ========================================
-- 4. ADD FOREIGN KEY CONSTRAINT
-- ========================================

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
            ON DELETE SET NULL;
        RAISE NOTICE '✓ Added FK constraint for cups.current_store_id';
    END IF;
END $$;

-- ========================================
-- 5. ENABLE RLS (Row Level Security)
-- ========================================

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. CREATE RLS POLICIES (Simple & Safe)
-- ========================================

-- Achievements: Anyone can read
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements"
    ON achievements FOR SELECT
    USING (true);

-- Rewards: Anyone can read
DROP POLICY IF EXISTS "Anyone can view rewards" ON rewards;
CREATE POLICY "Anyone can view rewards"
    ON rewards FOR SELECT
    USING (true);

-- Reward Claims: Users see only own claims
DROP POLICY IF EXISTS "Users view own claims" ON reward_claims;
CREATE POLICY "Users view own claims"
    ON reward_claims FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users create own claims" ON reward_claims;
CREATE POLICY "Users create own claims"
    ON reward_claims FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- User Achievements: Users see own + public can see all
DROP POLICY IF EXISTS "Public view achievements" ON user_achievements;
CREATE POLICY "Public view achievements"
    ON user_achievements FOR SELECT
    USING (true);

-- ========================================
-- 7. VERIFICATION
-- ========================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Verification Results:';
    RAISE NOTICE '========================================';
    
    -- Check tables
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_name IN ('achievements', 'rewards', 'reward_claims', 'user_achievements');
    RAISE NOTICE '✓ Tables created: % / 4', table_count;
    
    -- Check current_store_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cups' AND column_name = 'current_store_id') THEN
        RAISE NOTICE '✓ cups.current_store_id column exists';
    END IF;
    
    -- Check FK constraint
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cups_current_store') THEN
        RAISE NOTICE '✓ FK constraint fk_cups_current_store exists';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- DONE! Safe to run multiple times
-- ========================================
