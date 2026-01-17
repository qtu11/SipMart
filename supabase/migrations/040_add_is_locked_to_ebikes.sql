-- Add is_locked column to ebikes table
ALTER TABLE ebikes ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT true;
