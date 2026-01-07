import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/cleaning-sessions
 * List cleaning sessions
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

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch data
        const { data: sessions, error } = await supabase
            .from('cleaning_sessions')
            .select(`
                *,
                hub:cleaning_hubs(name),
                staff:admins(admin_id)
            `)
            .order('started_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ sessions: sessions || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/cleaning-sessions
 * Start new cleaning session
 */
export async function POST(request: NextRequest) {
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

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { hub_id, cup_count, notes } = body;

        if (!hub_id || !cup_count) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Start session
        const { data: session, error } = await supabase
            .from('cleaning_sessions')
            .insert({
                hub_id,
                cup_count,
                started_at: new Date().toISOString(),
                staff_id: admin.admin_id,
                status: 'in_progress',
                notes
            })
            .select()
            .single();

        if (error) throw error;

        // Update hub load
        await supabase.rpc('increment_hub_load', { hub_id_param: hub_id, count: cup_count });
        // Start transaction if RPC not available, but for now simple update:
        // Note: Ideally use RPC or transaction. 
        // For MVP, simplified:
        const { data: hub } = await supabase.from('cleaning_hubs').select('current_load').eq('hub_id', hub_id).single();
        if (hub) {
            await supabase.from('cleaning_hubs')
                .update({ current_load: (hub.current_load || 0) + cup_count })
                .eq('hub_id', hub_id);
        }

        return NextResponse.json({ session }, { status: 201 });

    } catch (error: any) {
        console.error('POST cleaning-session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
