import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/redistribution
 * List redistribution orders
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
            .eq('user_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch orders
        const { data: orders, error } = await supabase
            .from('redistribution_orders')
            .select(`
                *,
                from_store:stores!redistribution_orders_from_store_id_fkey(name),
                to_store:stores!redistribution_orders_to_store_id_fkey(name),
                creator:admins(user_id)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ orders: orders || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/redistribution
 * Create new redistribution order
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
            .eq('user_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { from_store_id, to_store_id, cup_count, priority, notes } = body;

        if (!from_store_id || !to_store_id || !cup_count) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (from_store_id === to_store_id) {
            return NextResponse.json({ error: 'Source and destination stores must be different' }, { status: 400 });
        }

        const { data: order, error } = await supabase
            .from('redistribution_orders')
            .insert({
                from_store_id,
                to_store_id,
                cup_count,
                priority: priority || 'medium',
                status: 'pending',
                notes,
                created_by: admin.admin_id
            })
            .select()
            .single();

        if (error) throw error;

        // In a real app, we might fire notifications to store managers here

        return NextResponse.json({ order }, { status: 201 });

    } catch (error: any) {
        console.error('POST redistribution error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
