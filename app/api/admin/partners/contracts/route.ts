import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/partners/contracts
 * List contracts
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
        const { error: authError } = await supabase.auth.getUser(token);
        if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        const supabase = getSupabaseAdmin();

        // Auth check
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { error: authError } = await supabase.auth.getUser(token);
        if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
