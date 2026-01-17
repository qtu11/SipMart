import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/middleware/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// PATCH /api/messaging/conversations/[id]/settings - Update conversation settings
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conversationId = params.id;
        const userId = auth.userId;
        const body = await request.json();

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        // Build update object with only provided fields
        const updateData: Record<string, any> = {};

        if (body.nickname !== undefined) {
            updateData.nickname = body.nickname;
        }
        if (body.themeColor !== undefined) {
            updateData.theme_color = body.themeColor;
        }
        if (body.bgColor !== undefined) {
            updateData.bg_color = body.bgColor;
        }
        if (body.isMuted !== undefined) {
            updateData.is_muted = body.isMuted;
        }

        // Update participant settings
        const { data, error } = await supabase
            .from('conversation_participants')
            .update(updateData)
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            settings: {
                nickname: data.nickname,
                themeColor: data.theme_color,
                bgColor: data.bg_color,
                isMuted: data.is_muted,
            }
        });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/messaging/conversations/[id]/read - Mark conversation as read
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conversationId = params.id;
        const userId = auth.userId;

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        // Update last_read_at
        const { error } = await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error marking as read:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
