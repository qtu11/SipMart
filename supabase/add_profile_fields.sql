-- Add profile fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_email_public BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_student_id_public BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.users.bio IS 'User biography/description';
COMMENT ON COLUMN public.users.is_email_public IS 'Whether email is visible to all users (true) or only friends (false)';
COMMENT ON COLUMN public.users.is_student_id_public IS 'Whether student ID is visible to all users (true) or only friends (false)';
