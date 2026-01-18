-- Migration 043: Sync User Profile Changes to Social Tables
-- Purpose: Ensure avatar and display_name are consistent across all posts/stories when user updates their profile.

-- 1. Create function to handle profile updates
CREATE OR REPLACE FUNCTION public.sync_user_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if display_name or avatar changed
  IF (OLD.display_name IS DISTINCT FROM NEW.display_name) OR (OLD.avatar IS DISTINCT FROM NEW.avatar) THEN
    
    -- Update green_feed_posts (Both avatar and display_name)
    UPDATE public.green_feed_posts
    SET 
      display_name = NEW.display_name,
      avatar = NEW.avatar
    WHERE user_id = NEW.user_id;

    -- Update stories (Both avatar and display_name)
    UPDATE public.stories
    SET 
      display_name = NEW.display_name,
      avatar = NEW.avatar
    WHERE user_id = NEW.user_id;

    -- Update comments (Only display_name as per schema)
    UPDATE public.comments
    SET display_name = NEW.display_name
    WHERE user_id = NEW.user_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger on users table
DROP TRIGGER IF EXISTS on_user_profile_change ON public.users;
CREATE TRIGGER on_user_profile_change
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile_changes();

-- 3. One-time data fix: Update all existing records with current user data
-- This fixes the immediate issue reported by the user

-- Sync posts
UPDATE public.green_feed_posts p
SET 
    display_name = u.display_name,
    avatar = u.avatar
FROM public.users u
WHERE p.user_id = u.user_id;

-- Sync stories
UPDATE public.stories s
SET 
    display_name = u.display_name,
    avatar = u.avatar
FROM public.users u
WHERE s.user_id = u.user_id;

-- Sync comments
UPDATE public.comments c
SET display_name = u.display_name
FROM public.users u
WHERE c.user_id = u.user_id;
