-- Migration 019: Fix Social RLS and Schema
-- 1. Ensure emotion and content columns exist in green_feed_posts
ALTER TABLE green_feed_posts 
ADD COLUMN IF NOT EXISTS emotion TEXT,
ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';

-- 2. Fix RLS for Green Feed Posts
ALTER TABLE green_feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view feed posts" ON green_feed_posts;
CREATE POLICY "Anyone can view feed posts"
ON green_feed_posts FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can create their posts" ON green_feed_posts;
CREATE POLICY "Users can create their posts"
ON green_feed_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their posts" ON green_feed_posts;
CREATE POLICY "Users can update their posts"
ON green_feed_posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their posts" ON green_feed_posts;
CREATE POLICY "Users can delete their posts"
ON green_feed_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Fix RLS for Stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Add status column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'status') THEN
        ALTER TABLE stories ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'archived'));
    END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can view non-expired stories" ON stories;
CREATE POLICY "Anyone can view non-expired stories"
ON stories FOR SELECT
TO authenticated
USING (expires_at > NOW() AND status = 'active');

DROP POLICY IF EXISTS "Users can create their stories" ON stories;
CREATE POLICY "Users can create their stories"
ON stories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their stories" ON stories;
CREATE POLICY "Users can manage their stories"
ON stories FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 4. Fix RLS for Likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
CREATE POLICY "Anyone can view likes"
ON post_likes FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can toggle likes" ON post_likes;
CREATE POLICY "Users can toggle likes"
ON post_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove likes" ON post_likes;
CREATE POLICY "Users can remove likes"
ON post_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Chats Schema & RLS
-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT DEFAULT 'private' CHECK (type IN ('private', 'group')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Chat
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
CREATE POLICY "Participants can view conversations"
ON conversations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.conversation_id
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Anyone can create conversations" ON conversations;
CREATE POLICY "Anyone can create conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Participants Policies
-- Helper function to avoid infinite recursion
DROP FUNCTION IF EXISTS is_conversation_participant(uuid) CASCADE;
CREATE OR REPLACE FUNCTION is_conversation_participant(c_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = c_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old policies from 015_social_chat.sql to prevent recursion
DROP POLICY IF EXISTS "Users can view participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON conversation_participants;

DROP POLICY IF EXISTS "Participants can view other participants" ON conversation_participants;
CREATE POLICY "Participants can view other participants"
ON conversation_participants FOR SELECT
TO authenticated
USING (
    is_conversation_participant(conversation_id)
);

DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
CREATE POLICY "Users can join conversations"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversation_id = conversation_participants.conversation_id 
        AND type = 'private' -- Allow creating private chat
    )
);

-- Messages Policies
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
);
