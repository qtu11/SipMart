import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/cleaning-hubs
 * List all cleaning hubs with stats
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Auth check
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin
        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch data
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');

        let query = supabase
            .from('cleaning_hubs')
            .select(`
                *,
                manager:admins(admin_id)
            `)
            .order('name', { ascending: true });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: hubs, error } = await query;

        if (error) throw error;

        // 3. Fetch active sessions count for each hub (optional enhancement)
        // For now returning basic hub info

        return NextResponse.json({ hubs });

    } catch (error: any) {
        console.error('GET /api/admin/cleaning-hubs error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/cleaning-hubs
 * Create new cleaning hub
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Auth check
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin
        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Parse body
        const body = await request.json();
        const { name, location, capacity, status } = body;

        if (!name) {
            return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
        }

        // 3. Insert
        const { data: newHub, error } = await supabase
            .from('cleaning_hubs')
            .insert({
                name,
                location,
                capacity: capacity || 100,
                status: status || 'active',
                manager_id: admin.admin_id // Default to creator as manager for now
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ hub: newHub }, { status: 201 });

    } catch (error: any) {
        console.error('POST /api/admin/cleaning-hubs error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
