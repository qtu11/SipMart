-- Ensure valid bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop potential conflicting policies on chat-media
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

DROP POLICY IF EXISTS "Chat Media Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Chat Media Auth Insert" ON storage.objects;

-- Re-create simplified policies
-- 1. READ: Public
CREATE POLICY "Chat Media Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-media' );

-- 2. INSERT: Authenticated users (removed strict folder check for now)
CREATE POLICY "Chat Media Auth Insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.role() = 'authenticated'
);

-- 3. UPDATE: Owners
CREATE POLICY "Chat Media Auth Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat-media' 
  AND auth.uid() = owner
);

-- 4. DELETE: Owners
CREATE POLICY "Chat Media Auth Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media' 
  AND auth.uid() = owner
);
