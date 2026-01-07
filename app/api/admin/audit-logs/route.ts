import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';

/**
 * API Admin lấy audit logs
 * GET: Lấy danh sách audit logs với filtering
 */

export async function GET(request: NextRequest) {
    try {
        // Verify admin
        if (!verifyAdminFromRequest(request)) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const actorId = searchParams.get('actorId');
        const actorType = searchParams.get('actorType');
        const action = searchParams.get('action');
        const resourceType = searchParams.get('resourceType');
        const resourceId = searchParams.get('resourceId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = getSupabaseAdmin();

        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (actorId) {
            query = query.eq('actor_id', actorId);
        }
        if (actorType) {
            query = query.eq('actor_type', actorType);
        }
        if (action) {
            query = query.eq('action', action);
        }
        if (resourceType) {
            query = query.eq('resource_type', resourceType);
        }
        if (resourceId) {
            query = query.eq('resource_id', resourceId);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        query = query.range(offset, offset + limit - 1);

        const { data: logs, error, count } = await query;

        if (error) throw error;

        // Transform logs
        const transformedLogs = logs?.map(log => ({
            logId: log.log_id,
            actorId: log.actor_id,
            actorType: log.actor_type,
            action: log.action,
            resourceType: log.resource_type,
            resourceId: log.resource_id,
            oldValue: log.old_value,
            newValue: log.new_value,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            metadata: log.metadata,
            createdAt: log.created_at,
        }));

        return NextResponse.json({
            success: true,
            logs: transformedLogs,
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (offset + limit) < (count || 0),
            },
        });

    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
