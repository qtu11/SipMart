import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/notifications/[notificationId]
 * Get notification detail with stats
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { notificationId: string } }
) {
    try {
        const supabase = getSupabaseAdmin();

        // Get auth token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        // Verify user with token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const notificationId = params.notificationId;

        // Get notification
        const { data: notification, error } = await supabase
            .from('system_notifications')
            .select('*')
            .eq('notification_id', notificationId)
            .single();

        if (error) throw error;
        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ notification });

    } catch (error: any) {
        console.error('GET /api/admin/notifications/[id] error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notification', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/notifications/[notificationId]
 * Update notification
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { notificationId: string } }
) {
    try {
        const supabase = getSupabaseAdmin();

        // Check admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const notificationId = params.notificationId;
        const body = await request.json();

        const updateData: any = {};
        const allowedFields = [
            'type', 'title', 'message', 'content_html', 'emoji', 'image_url',
            'action_url', 'priority', 'is_active', 'start_at', 'end_at', 'attachments'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        const { data: notification, error } = await supabase
            .from('system_notifications')
            .update(updateData)
            .eq('notification_id', notificationId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            message: 'Notification updated successfully',
            notification
        });

    } catch (error: any) {
        console.error('PATCH /api/admin/notifications/[id] error:', error);
        return NextResponse.json(
            { error: 'Failed to update notification', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/notifications/[notificationId]
 * Delete notification
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { notificationId: string } }
) {
    try {
        const supabase = getSupabaseAdmin();

        // Check admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const notificationId = params.notificationId;

        // Cascade delete will handle notification_recipients
        const { error } = await supabase
            .from('system_notifications')
            .delete()
            .eq('notification_id', notificationId);

        if (error) throw error;

        return NextResponse.json({
            message: 'Notification deleted successfully'
        });

    } catch (error: any) {
        console.error('DELETE /api/admin/notifications/[id] error:', error);
        return NextResponse.json(
            { error: 'Failed to delete notification', details: error.message },
            { status: 500 }
        );
    }
}
