import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server-client';

/**
 * GET /api/admin/notifications
 * Lấy danh sách thông báo (Admin only)
 */
export async function GET(request: NextRequest) {
    try {
        const supabaseAuth = await createClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        // Get query params
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type');

        let query = supabase
            .from('system_notifications')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filter by type
        if (type) {
            query = query.eq('type', type);
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: notifications, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            notifications: notifications || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        });

    } catch (error: any) {
        console.error('GET /api/admin/notifications error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/notifications
 * Tạo và broadcast thông báo (Admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const supabaseAuth = await createClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const {
            type,
            title,
            message,
            content_html,
            emoji,
            image_url,
            action_url,
            target_audience = 'all',
            target_rank,
            priority = 0,
            is_active = true,
            start_at,
            end_at,
            template_id,
            attachments
        } = body;

        // Validation
        if (!type || !title || (!message && !content_html)) {
            return NextResponse.json(
                { error: 'Missing required fields: type, title, message or content_html' },
                { status: 400 }
            );
        }

        const validTypes = ['info', 'warning', 'promotion', 'maintenance', 'event'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Insert notification
        const { data: notification, error: notificationError } = await supabase
            .from('system_notifications')
            .insert({
                admin_id: admin.admin_id,
                type,
                title,
                message: message || '',
                content_html,
                emoji,
                image_url,
                action_url,
                target_audience,
                target_rank,
                priority,
                is_active,
                start_at: start_at || new Date().toISOString(),
                end_at,
                template_id,
                attachments
            })
            .select()
            .single();

        if (notificationError) throw notificationError;

        // Get target users for broadcast
        let usersQuery = supabase
            .from('users')
            .select('user_id');

        // Filter by target_audience
        if (target_audience === 'active') {
            // Users who borrowed in last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            usersQuery = usersQuery.gte('last_login_at', thirtyDaysAgo.toISOString());
        } else if (target_audience === 'inactive') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            usersQuery = usersQuery.lt('last_login_at', thirtyDaysAgo.toISOString());
        } else if (target_audience === 'new') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            usersQuery = usersQuery.gte('created_at', sevenDaysAgo.toISOString());
        }

        // Filter by rank if specified
        if (target_rank) {
            usersQuery = usersQuery.eq('rank', target_rank);
        }

        const { data: targetUsers, error: usersError } = await usersQuery;

        if (usersError) throw usersError;

        // Bulk insert recipients (batch to avoid timeout)
        const recipients = targetUsers?.map((u: { user_id: string }) => ({
            notification_id: notification.notification_id,
            user_id: u.user_id,
            is_read: false
        })) || [];

        if (recipients.length > 0) {
            // Insert in batches of 1000
            const batchSize = 1000;
            for (let i = 0; i < recipients.length; i += batchSize) {
                const batch = recipients.slice(i, i + batchSize);
                const { error: recipientsError } = await supabase
                    .from('notification_recipients')
                    .insert(batch);

                if (recipientsError) {
                    console.error('Error inserting recipients batch:', recipientsError);
                }
            }

            // Update recipients_count
            await supabase
                .from('system_notifications')
                .update({ recipients_count: recipients.length })
                .eq('notification_id', notification.notification_id);
        }

        return NextResponse.json({
            message: 'Notification created and broadcast successfully',
            notification: {
                ...notification,
                recipients_count: recipients.length
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST /api/admin/notifications error:', error);
        return NextResponse.json(
            { error: 'Failed to create notification', details: error.message },
            { status: 500 }
        );
    }
}
