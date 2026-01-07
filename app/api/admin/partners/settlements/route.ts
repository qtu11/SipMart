import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/partners/settlements
 * List settlements
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
        const status = searchParams.get('status');

        let query = supabase
            .from('settlements')
            .select(`
                *,
                store:stores(name),
                approved_by_admin:admins!settlements_approved_by_fkey(admin_id)
            `)
            .order('period_start', { ascending: false });

        if (storeId) query = query.eq('store_id', storeId);
        if (status) query = query.eq('status', status);

        const { data: settlements, error } = await query;

        if (error) throw error;

        return NextResponse.json({ settlements: settlements || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/partners/settlements
 * Generate new settlement (Mock calculation for now)
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
        const { store_id, period_start, period_end } = body;

        // 1. Fetch contract
        const { data: contract } = await supabase
            .from('partner_contracts')
            .select('*')
            .eq('store_id', store_id)
            .eq('status', 'active')
            .single();

        if (!contract) {
            return NextResponse.json({ error: 'No active contract found for this store' }, { status: 400 });
        }

        // 2. Fetch transactions count & revenue (Mock)
        // In real app: sum amounts from transactions table where store_id = store_id and date between period
        const total_transactions = 150;
        const total_revenue = 4500000; // 4.5M VND

        // 3. Calculate commission
        let commission_amount = 0;
        let fixed_fee = Number(contract.fixed_fee) || 0;

        if (contract.contract_type === 'revenue_share' || contract.contract_type === 'hybrid') {
            commission_amount = total_revenue * (Number(contract.commission_rate) / 100);
        }

        const net_payable = total_revenue - commission_amount - fixed_fee;

        const { data: settlement, error } = await supabase
            .from('settlements')
            .insert({
                store_id,
                period_start,
                period_end,
                total_transactions,
                total_revenue,
                commission_amount,
                fixed_fee,
                net_payable,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ settlement }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
