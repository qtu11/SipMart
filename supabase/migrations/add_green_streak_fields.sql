-- Migration: Add Green Streak Tracking Fields to Users Table
-- Run this in your Supabase SQL Editor

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN green_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_return_date TIMESTAMP,
ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0;

-- Add index for performance
CREATE INDEX idx_users_green_streak ON users(green_streak DESC);

-- Comment columns for documentation
COMMENT ON COLUMN users.green_streak IS 'Current consecutive on-time returns streak';
COMMENT ON COLUMN users.last_return_date IS 'Last return date to check streak continuity';
COMMENT ON COLUMN users.best_streak IS 'All-time best streak record';
