-- Create the storage bucket 'chat-media'
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

-- Set up security policies for the 'chat-media' bucket

-- ALLOW READ: Everyone can view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'chat-media' );

-- ALLOW UPLOAD: Authenticated users can upload their own files
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ALLOW UPDATE: Users can update their own files (unlikely needed for chat but good practice)
create policy "Users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'chat-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ALLOW DELETE: Users can delete their own files
create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'chat-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
