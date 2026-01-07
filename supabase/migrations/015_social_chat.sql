-- ========================================
-- Migration 015: Social Chat & Messaging System
-- Create tables for Real-time Messaging & Social Interactions
-- ========================================

-- ========================================
-- 1. CONVERSATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('private', 'group')),
  name TEXT, -- Nullable for private chats (display name of other user)
  image_url TEXT, -- Group icon
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sorting conversations by last activity
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ========================================
-- 2. CONVERSATION_PARTICIPANTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  participant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);

-- ========================================
-- 3. MESSAGES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'sticker', 'video', 'voucher', 'borrow_request', 'system')),
  content TEXT, -- stores text content, image URL, or JSON string for special types
  metadata JSONB, -- stores extra data like voucher_id, borrow_request_id, sticker_id
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- ========================================
-- 4. RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is participant
CREATE OR REPLACE FUNCTION is_conversation_participant(check_conversation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = check_conversation_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CONVERSATIONS POLICIES
-- Users can view conversations they are part of
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Users can create conversations (implicitly allowed if they insert into participants too)
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true); -- Logic handled by application to insert participants transactionally

-- CONVERSATION_PARTICIPANTS POLICIES
-- Users can view participants of their conversations
DROP POLICY IF EXISTS "Users can view participants" ON conversation_participants;
CREATE POLICY "Users can view participants"
  ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Users can join/leave (logic usually handled by invite or creation)
DROP POLICY IF EXISTS "Users can insert participants" ON conversation_participants;
CREATE POLICY "Users can insert participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (
     -- Allow if creating a new chat (self) or adding someone to a chat they are in
     user_id = auth.uid() OR
     is_conversation_participant(conversation_id)
  );

-- MESSAGES POLICIES
-- Users can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages" ON messages;
CREATE POLICY "Users can view messages"
  ON messages FOR SELECT
  USING (is_conversation_participant(conversation_id));

-- Users can send messages to their conversations
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    is_conversation_participant(conversation_id)
  );

-- ========================================
-- 5. TRIGGERS & FUNCTIONS
-- ========================================

-- Trigger to update conversation.last_message_at on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_text = CASE 
      WHEN NEW.type = 'text' THEN NEW.content 
      WHEN NEW.type = 'image' THEN 'Đã gửi một ảnh 📷'
      WHEN NEW.type = 'sticker' THEN 'Đã gửi một nhãn dán'
      WHEN NEW.type = 'voucher' THEN 'Đã gửi một Voucher 🎁'
      ELSE 'Tin nhắn mới'
    END,
    updated_at = NOW()
  WHERE conversation_id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Trigger to update updated_at on text edit
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. REALTIME ENABLEMENT
-- ========================================
-- Note: In Supabase, you typically enable Realtime via the Dashboard or API. 
-- However, we can set the replica identity to full to ensure all columns are sent.
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE user_green_streaks REPLICA IDENTITY FULL; -- For streak updates

-- ========================================
-- ✅ MIGRATION COMPLETE
-- ========================================
