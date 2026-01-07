-- Verification and Addition of Missing Columns
-- Run this in Supabase SQL Editor

-- 1. Add student_id to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE users ADD COLUMN student_id TEXT UNIQUE;
    CREATE INDEX idx_users_student_id ON users(student_id);
    RAISE NOTICE 'Added student_id column to users table';
  ELSE
    RAISE NOTICE 'student_id column already exists in users table';
  END IF;
END $$;

-- 2. Add post_type and achievement_type to green_feed_posts table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'green_feed_posts' AND column_name = 'post_type'
  ) THEN
    ALTER TABLE green_feed_posts ADD COLUMN post_type TEXT DEFAULT 'normal';
    CREATE INDEX idx_green_feed_posts_type ON green_feed_posts(post_type);
    RAISE NOTICE 'Added post_type column to green_feed_posts table';
  ELSE
    RAISE NOTICE 'post_type column already exists in green_feed_posts table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'green_feed_posts' AND column_name = 'achievement_type'
  ) THEN
    ALTER TABLE green_feed_posts ADD COLUMN achievement_type TEXT;
    CREATE INDEX idx_green_feed_posts_achievement ON green_feed_posts(achievement_type);
    RAISE NOTICE 'Added achievement_type column to green_feed_posts table';
  ELSE
    RAISE NOTICE 'achievement_type column already exists in green_feed_posts table';
  END IF;
END $$;

-- 3. Verify wallet_transactions table structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wallet_transactions'
  ) THEN
    CREATE TABLE wallet_transactions (
      transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'borrow_fee', 'return_deposit')),
      amount DECIMAL(10,2) NOT NULL,
      balance_after DECIMAL(10,2) NOT NULL,
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
    CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
    CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
    
    RAISE NOTICE 'Created wallet_transactions table';
  ELSE
    RAISE NOTICE 'wallet_transactions table already exists';
  END IF;
END $$;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON users(wallet_balance);
CREATE INDEX IF NOT EXISTS idx_green_feed_posts_user_created ON green_feed_posts(user_id, created_at DESC);

-- 5. Verify all changes
SELECT 
  'users.student_id' as check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'student_id'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
UNION ALL
SELECT 
  'green_feed_posts.post_type',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'green_feed_posts' AND column_name = 'post_type'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 
  'green_feed_posts.achievement_type',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'green_feed_posts' AND column_name = 'achievement_type'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 
  'wallet_transactions table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wallet_transactions'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END;
