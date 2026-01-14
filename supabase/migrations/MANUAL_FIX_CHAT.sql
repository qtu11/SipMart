-- =========================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX CHAT PERMISSIONS
-- =========================================================

-- 1. FIX TYPING INDICATORS RLS
alter table typing_indicators enable row level security;

drop policy if exists "Typing indicators are viewable by everyone" on typing_indicators;
drop policy if exists "Users can insert their own typing indicator" on typing_indicators;
drop policy if exists "Users can delete their own typing indicator" on typing_indicators;
drop policy if exists "Public read access" on typing_indicators;
drop policy if exists "Authenticated insert access" on typing_indicators;
drop policy if exists "Authenticated delete access" on typing_indicators;
drop policy if exists "Authenticated users can view typing indicators" on typing_indicators;
drop policy if exists "Users can update their own typing indicator" on typing_indicators;

create policy "Authenticated users can view typing indicators"
on typing_indicators for select
to authenticated
using (true);

create policy "Users can insert their own typing indicator"
on typing_indicators for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own typing indicator"
on typing_indicators for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own typing indicator"
on typing_indicators for delete
to authenticated
using (auth.uid() = user_id);


-- 2. FIX CONVERSATION PARTICIPANTS RLS
alter table conversation_participants enable row level security;

drop policy if exists "Users can view their own participant rows" on conversation_participants;
drop policy if exists "Participants can view other members in same conversation" on conversation_participants;
drop policy if exists "Users can join conversations" on conversation_participants;
drop policy if exists "Users can leave conversations" on conversation_participants;
drop policy if exists "Users can update their status" on conversation_participants;
drop policy if exists "Authenticated users can add participants" on conversation_participants;

create policy "Users can view their own participant rows"
on conversation_participants for select
to authenticated
using (auth.uid() = user_id);

create policy "Authenticated users can add participants"
on conversation_participants for insert
to authenticated
with check (true);

create policy "Users can update their own participant rows"
on conversation_participants for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can leave conversations"
on conversation_participants for delete
to authenticated
using (auth.uid() = user_id);


-- 3. FIX CONVERSATIONS RLS
alter table conversations enable row level security;

drop policy if exists "Users can view conversations they are part of" on conversations;
drop policy if exists "Users can create conversations" on conversations;
drop policy if exists "Participants can update conversations" on conversations;

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

create policy "Users can create conversations"
on conversations for insert
to authenticated
with check (true);

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
