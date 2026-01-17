import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server-client';

/**
 * GET /api/admin/partners/contracts
 * List contracts
 */
export async function GET(request: NextRequest) {
    try {
        const supabaseAuth = await createClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        // Check admin role
        const { data: admin } = await supabase.from('admins').select('role').eq('admin_id', user.id).single();
        if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const searchParams = request.nextUrl.searchParams;
        const storeId = searchParams.get('storeId');

        let query = supabase
            .from('partner_contracts')
            .select(`
                *,
                store:stores(name)
            `)
            .order('created_at', { ascending: false });

        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        const { data: contracts, error } = await query;

        if (error) throw error;

        return NextResponse.json({ contracts: contracts || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/partners/contracts
 * Create new contract
 */
export async function POST(request: NextRequest) {
    try {
        const supabaseAuth = await createClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        // Check admin role
        const { data: admin } = await supabase.from('admins').select('role').eq('admin_id', user.id).single();
        if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();

        // Basic validation
        if (!body.store_id || !body.start_date || !body.contract_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: contract, error } = await supabase
            .from('partner_contracts')
            .insert(body)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ contract }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
