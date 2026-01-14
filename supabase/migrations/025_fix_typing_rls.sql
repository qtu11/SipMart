-- Enable RLS on typing_indicators if not already enabled
alter table typing_indicators enable row level security;

-- Drop existing policies to potentially fix conflicts or missing ones
drop policy if exists "Typing indicators are viewable by everyone" on typing_indicators;
drop policy if exists "Users can insert their own typing indicator" on typing_indicators;
drop policy if exists "Users can delete their own typing indicator" on typing_indicators;
drop policy if exists "Public read access" on typing_indicators;
drop policy if exists "Authenticated insert access" on typing_indicators;
drop policy if exists "Authenticated delete access" on typing_indicators;


-- Create new policies

-- 1. READ: Allow authenticated users to see typing indicators (usually filtered by conversation in query, but safe to read all active ones)
create policy "Authenticated users can view typing indicators"
on typing_indicators for select
to authenticated
using (true);

-- 2. INSERT/UPDATE: Allow users to set their own typing status
create policy "Users can insert their own typing indicator"
on typing_indicators for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own typing indicator"
on typing_indicators for update
to authenticated
using (auth.uid() = user_id);

-- 3. DELETE: Allow users to delete their own typing status
create policy "Users can delete their own typing indicator"
on typing_indicators for delete
to authenticated
using (auth.uid() = user_id);
