-- Migration 017: Chat RPC and Updates
-- Function to get existing private conversation or create valid UUID one

CREATE OR REPLACE FUNCTION get_or_create_conversation(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- 1. Try to find existing private conversation between these two users
  SELECT c.conversation_id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.conversation_id = cp1.conversation_id
  JOIN conversation_participants cp2 ON c.conversation_id = cp2.conversation_id
  WHERE c.type = 'private'
  AND cp1.user_id = auth.uid()
  AND cp2.user_id = target_user_id;

  -- 2. If found, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- 3. If not found, create new conversation
  INSERT INTO conversations (type)
  VALUES ('private')
  RETURNING conversation_id INTO v_conversation_id;

  -- 4. Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, auth.uid()),
    (v_conversation_id, target_user_id);

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID) TO authenticated;
