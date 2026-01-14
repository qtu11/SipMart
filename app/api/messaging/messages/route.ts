import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/middleware/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/messaging/messages?conversationId=xxx&limit=50&before=xxx
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.userId;
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const before = searchParams.get('before'); // Message ID để pagination

        if (!conversationId) {
            return NextResponse.json(
                { error: 'Missing conversationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        // Kiểm tra user có phải participant không
        const { data: participant } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();

        if (!participant) {
            return NextResponse.json(
                { error: 'You are not a participant of this conversation' },
                { status: 403 }
            );
        }

        // Lấy messages
        let query = supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (before) {
            // Pagination: lấy messages trước message ID này
            const { data: beforeMsg } = await supabase
                .from('messages')
                .select('created_at')
                .eq('message_id', before)
                .single();

            if (beforeMsg) {
                query = query.lt('created_at', beforeMsg.created_at);
            }
        }

        const { data: messages, error } = await query;

        if (error) throw error;

        // Đánh dấu conversation là đã đọc
        await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        return NextResponse.json({
            success: true,
            messages: messages?.reverse() || [], // Reverse để hiển thị theo thứ tự thời gian tăng dần
        });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/messaging/messages - Gửi message mới
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.userId;
        const body = await request.json();
        const { conversationId, content, type = 'text', mediaUrl, replyTo } = body;

        if (!conversationId || (!content && !mediaUrl)) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        // Kiểm tra user có phải participant không
        const { data: participant } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();

        // Nếu chưa có participant record, có thể conversation chưa được setup đúng
        // Tự động thêm user vào participants nếu conversation tồn tại
        if (!participant) {
            const { data: conv } = await supabase
                .from('conversations')
                .select('conversation_id')
                .eq('conversation_id', conversationId)
                .single();

            if (conv) {
                // Conversation tồn tại nhưng user chưa là participant - thêm vào
                const { error: participantError } = await supabase
                    .from('conversation_participants')
                    .insert({
                        conversation_id: conversationId,
                        user_id: userId,
                    });

                if (participantError) {
                    console.error('Failed to add participant:', participantError);
                }
            } else {
                // Conversation không tồn tại - trả lỗi
                return NextResponse.json(
                    { error: 'Conversation not found. Please create conversation first.' },
                    { status: 404 }
                );
            }
        }

        // Tạo message mới
        const { data: newMessage, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                content,
                type,
                media_url: mediaUrl,
                reply_to: replyTo,
            })
            .select()
            .single();

        if (error) throw error;

        // Update last_message_at của conversation (trigger tự động làm việc này)
        // Nhưng để chắc chắn:
        await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('conversation_id', conversationId);

        return NextResponse.json({
            success: true,
            message: newMessage,
        });
    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PATCH /api/messaging/messages - Sửa message
export async function PATCH(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.userId;
        const body = await request.json();
        const { messageId, content } = body;

        if (!messageId || !content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        // Kiểm tra message có phải của user không
        const { data: message } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('message_id', messageId)
            .single();

        if (!message || message.sender_id !== userId) {
            return NextResponse.json(
                { error: 'You can only edit your own messages' },
                { status: 403 }
            );
        }

        // Update message
        const { error } = await supabase
            .from('messages')
            .update({
                content,
                is_edited: true,
                updated_at: new Date().toISOString(),
            })
            .eq('message_id', messageId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error editing message:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/messaging/messages - Xóa message
export async function DELETE(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.userId;
        const { searchParams } = new URL(request.url);
        const messageId = searchParams.get('messageId');

        if (!messageId) {
            return NextResponse.json(
                { error: 'Missing messageId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        // Kiểm tra message có phải của user không
        const { data: message } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('message_id', messageId)
            .single();

        if (!message || message.sender_id !== userId) {
            return NextResponse.json(
                { error: 'You can only delete your own messages' },
                { status: 403 }
            );
        }

        // Soft delete
        const { error } = await supabase
            .from('messages')
            .update({
                is_deleted: true,
                content: '[Tin nhắn đã bị xóa]',
                updated_at: new Date().toISOString(),
            })
            .eq('message_id', messageId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting message:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
