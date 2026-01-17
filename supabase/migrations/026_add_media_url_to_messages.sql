-- Add media_url column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Update RLS if needed (usually columns inherit table policies, so existing policies are fine)
