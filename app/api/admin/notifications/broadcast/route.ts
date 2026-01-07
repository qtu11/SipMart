import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';

/**
 * API Admin gửi thông báo hệ thống (broadcast)
 * POST: Tạo thông báo mới và gửi đến tất cả users
 * GET: Lấy danh sách thông báo hệ thống
 */

interface CreateNotificationBody {
    type: 'info' | 'warning' | 'promotion' | 'maintenance' | 'event';
    title: string;
    message: string;
    imageUrl?: string;
    actionUrl?: string;
    targetAudience?: 'all' | 'active' | 'inactive' | 'new' | 'premium';
    targetRank?: 'seed' | 'sprout' | 'sapling' | 'tree' | 'forest';
    priority?: number;
    startAt?: string;
    endAt?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Verify admin
        if (!verifyAdminFromRequest(request)) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin credentials required' },
                { status: 401 }
            );
        }

        const body: CreateNotificationBody = await request.json();
        const { type, title, message, imageUrl, actionUrl, targetAudience, targetRank, priority, startAt, endAt } = body;

        // Validation
        if (!type || !title || !message) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: type, title, message' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // 1. Tạo system notification record
        const { data: notification, error: notifError } = await supabase
            .from('system_notifications')
            .insert({
                type,
                title,
                message,
                image_url: imageUrl,
                action_url: actionUrl,
                target_audience: targetAudience || 'all',
                target_rank: targetRank,
                priority: priority || 0,
                start_at: startAt || new Date().toISOString(),
                end_at: endAt,
                is_active: true,
            })
            .select()
            .single();

        if (notifError) {
            throw new Error(`Failed to create system notification: ${notifError.message}`);
        }

        // 2. Query target users
        let usersQuery = supabase.from('users').select('user_id');

        // Filter by target audience
        switch (targetAudience) {
            case 'active':
                // Active trong 7 ngày
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                usersQuery = usersQuery.gte('last_activity', sevenDaysAgo.toISOString());
                break;
            case 'inactive':
                // Không active trong 30 ngày
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                usersQuery = usersQuery.lt('last_activity', thirtyDaysAgo.toISOString());
                break;
            case 'new':
                // Đăng ký trong 7 ngày
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                usersQuery = usersQuery.gte('created_at', weekAgo.toISOString());
                break;
            case 'premium':
                // Rank tree hoặc forest
                usersQuery = usersQuery.in('rank_level', ['tree', 'forest']);
                break;
        }

        // Filter by target rank
        if (targetRank) {
            usersQuery = usersQuery.eq('rank_level', targetRank);
        }

        // Exclude blacklisted users
        usersQuery = usersQuery.eq('is_blacklisted', false);

        const { data: users, error: usersError } = await usersQuery;

        if (usersError) {
            throw new Error(`Failed to query users: ${usersError.message}`);
        }

        // 3. Tạo individual notifications cho từng user
        const notifications = users?.map(user => ({
            user_id: user.user_id,
            type: type === 'warning' ? 'warning' : type === 'promotion' ? 'info' : 'info',
            title,
            message,
            url: actionUrl,
            data: JSON.stringify({ systemNotificationId: notification.notification_id }),
            read: false,
        })) || [];

        // Batch insert (chunk 1000)
        let insertedCount = 0;
        const chunkSize = 1000;

        for (let i = 0; i < notifications.length; i += chunkSize) {
            const chunk = notifications.slice(i, i + chunkSize);
            const { error: insertError } = await supabase
                .from('notifications')
                .insert(chunk);

            if (insertError) {
                console.error(`Failed to insert notification chunk ${i}:`, insertError);
            } else {
                insertedCount += chunk.length;
            }
        }

        // 4. Create audit log
        await supabase.from('audit_logs').insert({
            actor_type: 'admin',
            action: 'broadcast_notification',
            resource_type: 'system_notifications',
            resource_id: notification.notification_id,
            new_value: { title, message, targetAudience, usersNotified: insertedCount },
        });

        return NextResponse.json({
            success: true,
            data: {
                notificationId: notification.notification_id,
                usersNotified: insertedCount,
                totalTargeted: users?.length || 0,
            },
            message: `Đã gửi thông báo đến ${insertedCount} người dùng`,
        });

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Broadcast notification error:', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verify admin
        if (!verifyAdminFromRequest(request)) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseAdmin();

        const { data: notifications, error } = await supabase
            .from('system_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            notifications,
        });

    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
