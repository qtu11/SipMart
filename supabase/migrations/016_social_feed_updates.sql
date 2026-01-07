-- Migration 016: Update Social Feed Tables
-- Make image_url nullable to allow text-only posts
-- Add location and tags support

ALTER TABLE green_feed_posts 
ALTER COLUMN image_url DROP NOT NULL;

ALTER TABLE green_feed_posts
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS carbon_saved NUMERIC DEFAULT 0;

-- Ensure RLS is capable of "Public Feed" logic (friends only vs global)
-- For now we keep it simple: authenticated users can view all posts (as per 001)

-- Add function to toggle like
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM post_likes 
    WHERE post_id = p_post_id AND user_id = auth.uid()
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM post_likes WHERE post_id = p_post_id AND user_id = auth.uid();
    UPDATE green_feed_posts SET likes = likes - 1 WHERE post_id = p_post_id;
    RETURN FALSE; -- Unlike
  ELSE
    INSERT INTO post_likes (post_id, user_id) VALUES (p_post_id, auth.uid());
    UPDATE green_feed_posts SET likes = likes + 1 WHERE post_id = p_post_id;
    RETURN TRUE; -- Like
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
