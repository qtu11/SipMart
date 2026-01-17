-- Migration: Add chat settings columns to conversation_participants
-- This adds theme_color and bg_color columns for persisting chat customization

-- Add theme_color column
ALTER TABLE conversation_participants 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#10b981';

-- Add bg_color column  
ALTER TABLE conversation_participants 
ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#f9fafb';

-- Add is_muted column for notification settings
ALTER TABLE conversation_participants 
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_participants_settings 
ON conversation_participants(conversation_id, user_id);

-- Update last_read_at when viewing messages
CREATE OR REPLACE FUNCTION update_last_read_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_read_at for the sender when they send a message
    UPDATE conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = NEW.conversation_id
    AND user_id = NEW.sender_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_last_read ON messages;

-- Create trigger
CREATE TRIGGER trigger_update_last_read
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_last_read_at();
