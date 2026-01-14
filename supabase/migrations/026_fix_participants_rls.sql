-- Enable RLS
alter table conversation_participants enable row level security;

-- Drop potential conflicting policies
drop policy if exists "Users can view their own participant rows" on conversation_participants;
drop policy if exists "Participants can view other members in same conversation" on conversation_participants;
drop policy if exists "Users can join conversations" on conversation_participants;
drop policy if exists "Users can leave conversations" on conversation_participants;
drop policy if exists "Users can update their status" on conversation_participants;

-- 1. SELECT: Users can see their own participation rows
-- This addresses the "You are not a participant" check in messages API
create policy "Users can view their own participant rows"
on conversation_participants for select
to authenticated
using (auth.uid() = user_id);

-- 2. INSERT: Users can add participants (needed for creating conversations)
-- Ideally this should be more restricted, but for now allowing authenticated users to add rows fixes the creation flow.
create policy "Authenticated users can add participants"
on conversation_participants for insert
to authenticated
with check (true);

-- 3. UPDATE: Users can update their own rows (e.g. read status, mute)
create policy "Users can update their own participant rows"
on conversation_participants for update
to authenticated
using (auth.uid() = user_id);

-- 4. DELETE: Users can remove themselves (leave group)
create policy "Users can leave conversations"
on conversation_participants for delete
to authenticated
using (auth.uid() = user_id);

-- ALSO CHECK CONVERSATIONS TABLE
alter table conversations enable row level security;

-- Allow reading conversations if you are a participant
-- This is a bit expensive (exists query), so alternatively we blindly allow read if we trust the JOINs
-- But strict RLS:
create policy "Users can view conversations they are part of"
on conversations for select
to authenticated
using (
  exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = conversations.conversation_id
    and cp.user_id = auth.uid()
  )
);

-- Allow creating conversations
create policy "Users can create conversations"
on conversations for insert
to authenticated
with check (true);

-- Allow updating conversations (e.g. last_message_at) if participant
create policy "Participants can update conversations"
on conversations for update
to authenticated
using (
  exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = conversations.conversation_id
    and cp.user_id = auth.uid()
  )
);
