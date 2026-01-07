import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/hygiene/stats
 * Aggregate stats for Hygiene Dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Auth check
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Count Active Hubs
        const { count: activeHubs } = await supabase
            .from('cleaning_hubs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // 2. Sum Cups Cleaning (in_progress sessions)
        const { data: cleaningSessions } = await supabase
            .from('cleaning_sessions')
            .select('cup_count')
            .eq('status', 'in_progress');

        const cupsCleaning = cleaningSessions?.reduce((sum, session) => sum + session.cup_count, 0) || 0;

        // 3. Sum Cups Cleaned Today (completed sessions today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: cleanedSessions } = await supabase
            .from('cleaning_sessions')
            .select('cup_count')
            .eq('status', 'completed')
            .gte('completed_at', todayStart.toISOString());

        const cupsCleanedToday = cleanedSessions?.reduce((sum, session) => sum + session.cup_count, 0) || 0;

        // 4. Count Pending Redistribution Orders
        const { count: pendingRedistribution } = await supabase
            .from('redistribution_orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        return NextResponse.json({
            stats: {
                activeHubs: activeHubs || 0,
                cupsCleaning,
                cupsCleanedToday,
                pendingRedistribution: pendingRedistribution || 0
            }
        });

    } catch (error: any) {
        console.error('Hygiene stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
