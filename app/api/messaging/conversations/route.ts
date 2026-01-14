import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/middleware/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/messaging/conversations - Lấy danh sách conversations
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.userId;
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        // Lấy tất cả conversations mà user tham gia
        const { data: participants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select(`
        conversation_id,
        last_read_at,
        is_muted,
        is_archived,
        conversations (
          conversation_id,
          type,
          name,
          avatar,
          created_at,
          last_message_at
        )
      `)
            .eq('user_id', userId)
            .order('last_read_at', { ascending: false });

        if (participantsError) throw participantsError;

        // Lấy thông tin của người đối thoại và tin nhắn cuối
        const conversationsWithDetails = await Promise.all(
            (participants || []).map(async (p: any) => {
                const conv = p.conversations;

                // Lấy tin nhắn cuối cùng
                const { data: lastMessage } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conv.conversation_id)
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                // Nếu là direct chat, lấy thông tin người kia
                let otherUser = null;
                if (conv.type === 'direct') {
                    const { data: otherParticipant } = await supabase
                        .from('conversation_participants')
                        .select('user_id')
                        .eq('conversation_id', conv.conversation_id)
                        .neq('user_id', userId)
                        .single();

                    if (otherParticipant) {
                        // Lấy thông tin user từ users table thay vì Admin API
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select('user_id, email, display_name, avatar')
                            .eq('user_id', otherParticipant.user_id)
                            .single();

                        if (!userError && userData) {
                            otherUser = {
                                id: userData.user_id,
                                email: userData.email,
                                displayName: userData.display_name || userData.email,
                                avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.display_name || userData.email || 'User')}`,
                            };
                        }
                    }
                }

                // Tính số tin nhắn chưa đọc
                const { data: unreadMessages } = await supabase
                    .from('messages')
                    .select('message_id', { count: 'exact', head: true })
                    .eq('conversation_id', conv.conversation_id)
                    .gt('created_at', p.last_read_at)
                    .neq('sender_id', userId)
                    .eq('is_deleted', false);

                return {
                    ...conv,
                    lastMessage,
                    otherUser,
                    unreadCount: unreadMessages?.length || 0,
                    isMuted: p.is_muted,
                    isArchived: p.is_archived,
                };
            })
        );

        console.log('[API] Conversations fetched:', {
            participantsCount: participants?.length || 0,
            conversationsCount: conversationsWithDetails.length,
            sample: conversationsWithDetails[0] ? {
                id: conversationsWithDetails[0].conversation_id,
                hasOtherUser: !!conversationsWithDetails[0].otherUser,
                hasLastMessage: !!conversationsWithDetails[0].lastMessage,
            } : null
        });

        return NextResponse.json({
            success: true,
            conversations: conversationsWithDetails,
        });
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/messaging/conversations - Tạo conversation mới hoặc lấy existing
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.userId;
        const body = await request.json();
        const { otherUserId, type = 'direct' } = body;

        if (!otherUserId) {
            return NextResponse.json(
                { error: 'Missing otherUserId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        // Nếu là direct chat, kiểm tra xem đã có conversation chưa
        if (type === 'direct') {
            const { data: existingConv, error: checkError } = await supabase.rpc(
                'get_or_create_direct_conversation',
                { user1_id: userId, user2_id: otherUserId }
            );

            if (checkError) {
                // Fallback: tự tìm kiếm thủ công
                const { data: myConvs } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id')
                    .eq('user_id', userId);

                if (myConvs) {
                    for (const conv of myConvs) {
                        const { data: otherUserInConv } = await supabase
                            .from('conversation_participants')
                            .select('user_id')
                            .eq('conversation_id', conv.conversation_id)
                            .eq('user_id', otherUserId)
                            .single();

                        if (otherUserInConv) {
                            // Conversation đã tồn tại
                            return NextResponse.json({
                                success: true,
                                conversationId: conv.conversation_id,
                                isNew: false,
                            });
                        }
                    }
                }

                // Nếu không tìm thấy, tạo mới
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({ type: 'direct' })
                    .select()
                    .single();

                if (createError) throw createError;

                // Thêm participants
                await supabase.from('conversation_participants').insert([
                    { conversation_id: newConv.conversation_id, user_id: userId, role: 'member' },
                    { conversation_id: newConv.conversation_id, user_id: otherUserId, role: 'member' },
                ]);

                return NextResponse.json({
                    success: true,
                    conversationId: newConv.conversation_id,
                    isNew: true,
                });
            }

            return NextResponse.json({
                success: true,
                conversationId: existingConv,
                isNew: false,
            });
        }

        // Group chat - tạo mới
        const { name, participantIds } = body;
        const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({ type: 'group', name })
            .select()
            .single();

        if (createError) throw createError;

        // Thêm tất cả participants
        const participants = [userId, ...(participantIds || [])].map((uid) => ({
            conversation_id: newConv.conversation_id,
            user_id: uid,
            role: uid === userId ? 'owner' : 'member',
        }));

        await supabase.from('conversation_participants').insert(participants);

        return NextResponse.json({
            success: true,
            conversationId: newConv.conversation_id,
            isNew: true,
        });
    } catch (error: any) {
        console.error('Error creating conversation:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
