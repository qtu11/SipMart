-- Migration 018: Add emotion column to green_feed_posts
ALTER TABLE green_feed_posts 
ADD COLUMN IF NOT EXISTS emotion TEXT;
