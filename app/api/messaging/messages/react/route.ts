import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// POST /api/messaging/messages/react - Add reaction to message
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (user as any).id || (user as any).user_id;
        const body = await request.json();
        const { messageId, emoji } = body;

        if (!messageId || !emoji) {
            return NextResponse.json(
                { error: 'Missing messageId or emoji' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Add reaction (upsert to prevent duplicates)
        const { data, error } = await supabase
            .from('message_reactions')
            .upsert(
                {
                    message_id: messageId,
                    user_id: userId,
                    emoji,
                },
                {
                    onConflict: 'message_id,user_id,emoji',
                }
            )
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            reaction: data,
        });
    } catch (error: any) {
        console.error('Error adding reaction:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/messaging/messages/react - Remove reaction from message
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (user as any).id || (user as any).user_id;
        const { searchParams } = new URL(request.url);
        const messageId = searchParams.get('messageId');
        const emoji = searchParams.get('emoji');

        if (!messageId || !emoji) {
            return NextResponse.json(
                { error: 'Missing messageId or emoji' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .eq('emoji', emoji);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error removing reaction:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// GET /api/messaging/messages/react - Get reactions for a message
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const messageId = searchParams.get('messageId');

        if (!messageId) {
            return NextResponse.json(
                { error: 'Missing messageId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: reactions, error } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', messageId);

        if (error) throw error;

        // Group by emoji and count
        const grouped = reactions?.reduce((acc: any, reaction: any) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: [],
                };
            }
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push(reaction.user_id);
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            reactions: Object.values(grouped || {}),
        });
    } catch (error: any) {
        console.error('Error fetching reactions:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
