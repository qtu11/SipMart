import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/notifications/[recipientId]/read
 * Đánh dấu thông báo đã đọc
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { recipientId: string } }
) {
    try {
        const supabase = getSupabaseAdmin();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const recipientId = params.recipientId;

        // Update read status
        const { data: recipient, error } = await supabase
            .from('notification_recipients')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', recipientId)
            .eq('user_id', user.id) // Security: only owner can update
            .select()
            .single();

        if (error) throw error;

        if (!recipient) {
            return NextResponse.json(
                { error: 'Notification not found or access denied' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Notification marked as read',
            recipient
        });

    } catch (error: any) {
        console.error('POST /api/notifications/[recipientId]/read error:', error);
        return NextResponse.json(
            { error: 'Failed to mark notification as read', details: error.message },
            { status: 500 }
        );
    }
}
