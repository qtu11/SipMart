import { supabase } from '.';

export interface Conversation {
    conversation_id: string;
    type: 'private' | 'group';
    name?: string;
    image_url?: string;
    participants?: any[];
}

// Find existing private conversation or create a new one
export async function getOrCreateConversation(currentUserId: string, otherUserId: string): Promise<string | null> {
    try {
        // 1. Check if conversation already exists
        // We need to find a conversation where both users are participants and type is private
        // This is a bit complex in Supabase simple query, so we might use an RPC if available, 
        // or just query conversations via participants.

        // Strategy: Get all conversation_ids for currentUser
        const { data: myConvos } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', currentUserId);

        if (myConvos && myConvos.length > 0) {
            const myConvoIds = myConvos.map(c => c.conversation_id);

            // Check if otherUser is in any of these conversations AND it is private
            const { data: commonConvos } = await supabase
                .from('conversation_participants')
                .select('conversation_id, conversations(type)')
                .in('conversation_id', myConvoIds)
                .eq('user_id', otherUserId);

            // Filter for PRIVATE type
            const existing = commonConvos?.find((c: any) => c.conversations?.type === 'private');

            if (existing) {
                return existing.conversation_id;
            }
        }

        // 2. Create new conversation if not found
        // Start transaction (simulated)
        const { data: newConvo, error: createError } = await supabase
            .from('conversations')
            .insert({ type: 'private' })
            .select()
            .single();

        if (createError || !newConvo) throw createError;

        // Add participants
        const { error: partError } = await supabase
            .from('conversation_participants')
            .insert([
                { conversation_id: newConvo.conversation_id, user_id: currentUserId },
                { conversation_id: newConvo.conversation_id, user_id: otherUserId }
            ]);

        if (partError) throw partError;

        return newConvo.conversation_id;
    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        return null;
    }
}

export async function sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'sticker' | 'system' = 'text',
    metadata: any = null
) {
    try {
        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content,
                type,
                metadata
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
}
