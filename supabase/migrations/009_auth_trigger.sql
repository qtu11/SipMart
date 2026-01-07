-- Migration 009: Add Auth Trigger and Backfill Users

-- 1. Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    user_id,
    email,
    display_name,
    avatar,
    created_at,
    last_activity,
    student_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.created_at,
    new.created_at,
    new.raw_user_meta_data->>'student_id'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    last_activity = NOW(),
    display_name = COALESCE(users.display_name, EXCLUDED.display_name),
    avatar = COALESCE(users.avatar, EXCLUDED.avatar);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill existing users from auth.users to public.users
-- SAFE BACKFILL: Skips duplicates to prevent unique constraint violations
INSERT INTO public.users (
    user_id,
    email,
    display_name,
    avatar,
    created_at,
    last_activity,
    student_id
)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
    au.raw_user_meta_data->>'avatar_url',
    au.created_at,
    au.created_at,
    au.raw_user_meta_data->>'student_id'
FROM auth.users au
WHERE 
    -- Filter 1: User does not exist in public.users yet
    NOT EXISTS (
        SELECT 1 FROM public.users pu WHERE pu.user_id = au.id
    )
    AND (
        au.raw_user_meta_data->>'student_id' IS NULL
        OR (
            -- Filter 2: Dedup based on student_id within auth.users (keep latest)
            au.id IN (
                SELECT DISTINCT ON (raw_user_meta_data->>'student_id') id 
                FROM auth.users 
                WHERE raw_user_meta_data->>'student_id' IS NOT NULL 
                ORDER BY raw_user_meta_data->>'student_id', created_at DESC
            )
            -- Filter 3: Ensure student_id doesn't conflict with EXISTING public.users entry (different user_id)
            AND NOT EXISTS (
                SELECT 1 FROM public.users pu 
                WHERE pu.student_id = au.raw_user_meta_data->>'student_id'
            )
        )
    )
ON CONFLICT (user_id) DO NOTHING;

-- 4. Ensure admin users exist in admins table but not necessarily in users check?
-- Admins table is separate. Code handles admin creation via verifyAdmin.
