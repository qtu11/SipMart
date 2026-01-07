import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/notifications
 * User xem thông báo của mình
 */
export async function GET(request: NextRequest) {
    try {
        // Check auth using verifyAuth middleware
        const { verifyAuth } = await import('@/lib/middleware/auth');
        const authResult = await verifyAuth(request);

        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = authResult.userId;
        const supabase = getSupabaseAdmin();

        // Get query params
        const searchParams = request.nextUrl.searchParams;
        const unread_only = searchParams.get('unread_only') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');

        // Get notifications for user via recipients table
        let query = supabase
            .from('notification_recipients')
            .select(`
        id,
        is_read,
        read_at,
        created_at,
        notification:system_notifications(
          notification_id,
          type,
          title,
          message,
          content_html,
          emoji,
          image_url,
          action_url,
          priority,
          start_at,
          created_at
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unread_only) {
            query = query.eq('is_read', false);
        }

        const { data: recipients, error } = await query;

        if (error) throw error;

        // Count unread
        const { count: unreadCount } = await supabase
            .from('notification_recipients')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        // Format response
        const notifications = recipients?.map((r: any) => ({
            recipient_id: r.id,
            is_read: r.is_read,
            read_at: r.read_at,
            received_at: r.created_at,
            ...r.notification
        })) || [];

        return NextResponse.json({
            notifications,
            unread_count: unreadCount || 0
        });

    } catch (error: any) {
        console.error('GET /api/notifications error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications', details: error.message },
            { status: 500 }
        );
    }
}
