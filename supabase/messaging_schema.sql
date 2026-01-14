-- ============================================
-- MESSAGING & CHAT SYSTEM FOR SIPMART
-- ============================================

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')), -- direct = 1-1, group = nhiều người
    name TEXT, -- Tên nhóm (nếu là group chat)
    avatar TEXT, -- Ảnh nhóm (nếu là group chat)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- 2. Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_last_read ON conversation_participants(last_read_at);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'file', 'emoji', 'system')),
    media_url TEXT, -- URL ảnh/video/file nếu có
    metadata JSONB, -- Metadata bổ sung (tên file, kích thước, v.v.)
    reply_to UUID REFERENCES messages(message_id) ON DELETE SET NULL, -- Trả lời tin nhắn nào
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);

-- 4. Message Reactions (React tin nhắn với emoji)
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(user_id);

-- 5. User Presence (Trạng thái online/offline)
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen_at DESC);

-- 6. Typing Indicators (Đang gõ...)
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_presence_updated_at ON user_presence;
CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON user_presence
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update conversation last_message_at when new message arrives
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NOW()
    WHERE conversation_id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_new_message ON messages;
CREATE TRIGGER update_conversation_on_new_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is participant
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conv_id AND user_id = uid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conversations: Users can view conversations they are part of
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_participants.conversation_id = conversations.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
);

-- Conversations: Users can create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (true);

-- Conversation Participants: Users can view participants of their conversations
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
CREATE POLICY "Users can view conversation participants"
ON conversation_participants FOR SELECT
USING (
    user_id = auth.uid() OR
    is_conversation_participant(conversation_id, auth.uid())
);

-- Conversation Participants: Users can insert themselves or be added by conversation members
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
CREATE POLICY "Users can join conversations"
ON conversation_participants FOR INSERT
WITH CHECK (
    user_id = auth.uid() OR
    is_conversation_participant(conversation_id, auth.uid())
);

-- Messages: Users can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (is_conversation_participant(conversation_id, auth.uid()));

-- Messages: Users can send messages to their conversations
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    is_conversation_participant(conversation_id, auth.uid())
);

-- Messages: Users can update their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Message Reactions: Users can view reactions
DROP POLICY IF EXISTS "Users can view reactions" ON message_reactions;
CREATE POLICY "Users can view reactions"
ON message_reactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM messages
        WHERE messages.message_id = message_reactions.message_id
        AND is_conversation_participant(messages.conversation_id, auth.uid())
    )
);

-- Message Reactions: Users can add reactions
DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
CREATE POLICY "Users can add reactions"
ON message_reactions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Message Reactions: Users can remove their own reactions
DROP POLICY IF EXISTS "Users can remove their reactions" ON message_reactions;
CREATE POLICY "Users can remove their reactions"
ON message_reactions FOR DELETE
USING (user_id = auth.uid());

-- User Presence: Everyone can view presence
DROP POLICY IF EXISTS "Users can view presence" ON user_presence;
CREATE POLICY "Users can view presence"
ON user_presence FOR SELECT
USING (true);

-- User Presence: Users can update their own presence
DROP POLICY IF EXISTS "Users can update their presence" ON user_presence;
CREATE POLICY "Users can update their presence"
ON user_presence FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can modify their presence" ON user_presence;
CREATE POLICY "Users can modify their presence"
ON user_presence FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Typing Indicators: Users can view typing indicators
DROP POLICY IF EXISTS "Users can view typing indicators" ON typing_indicators;
CREATE POLICY "Users can view typing indicators"
ON typing_indicators FOR SELECT
USING (is_conversation_participant(conversation_id, auth.uid()));

-- Typing Indicators: Users can set typing indicators
DROP POLICY IF EXISTS "Users can set typing indicators" ON typing_indicators;
CREATE POLICY "Users can set typing indicators"
ON typing_indicators FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND
    is_conversation_participant(conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can remove their typing indicators" ON typing_indicators;
CREATE POLICY "Users can remove their typing indicators"
ON typing_indicators FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Create or get direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
    user1_id UUID,
    user2_id UUID
)
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
BEGIN
    -- Check if conversation already exists
    SELECT conversation_id INTO conv_id
    FROM conversation_participants cp1
    WHERE cp1.user_id = user1_id
      AND EXISTS (
          SELECT 1 FROM conversation_participants cp2
          WHERE cp2.conversation_id = cp1.conversation_id
            AND cp2.user_id = user2_id
            AND (SELECT type FROM conversations WHERE conversation_id = cp1.conversation_id) = 'direct'
      )
    LIMIT 1;

    -- If not exists, create new conversation
    IF conv_id IS NULL THEN
        INSERT INTO conversations (type) VALUES ('direct')
        RETURNING conversation_id INTO conv_id;

        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES 
            (conv_id, user1_id, 'member'),
            (conv_id, user2_id, 'member');
    END IF;

    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(
    conv_id UUID,
    uid UUID
)
RETURNS INTEGER AS $$
DECLARE
    last_read TIMESTAMPTZ;
    unread_count INTEGER;
BEGIN
    SELECT last_read_at INTO last_read
    FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = uid;

    SELECT COUNT(*) INTO unread_count
    FROM messages
    WHERE conversation_id = conv_id
      AND created_at > last_read
      AND sender_id != uid
      AND is_deleted = FALSE;

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
    conv_id UUID,
    uid UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = conv_id AND user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE conversations IS 'Stores all conversations (direct and group chats)';
COMMENT ON TABLE conversation_participants IS 'Junction table linking users to conversations';
COMMENT ON TABLE messages IS 'Stores all chat messages';
COMMENT ON TABLE message_reactions IS 'Stores emoji reactions to messages';
COMMENT ON TABLE user_presence IS 'Tracks online/offline status of users';
COMMENT ON TABLE typing_indicators IS 'Temporary table for typing indicators';
