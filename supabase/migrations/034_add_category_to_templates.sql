-- Add category column to notification_templates
ALTER TABLE notification_templates 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create index for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
