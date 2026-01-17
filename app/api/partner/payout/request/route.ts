import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get partner info
        const { data: partner } = await supabase
            .from('stores')
            .select('store_id, name, bank_account_number, bank_name')
            .eq('user_id', user.id)
            .single();

        if (!partner) {
            return NextResponse.json(
                { error: 'Partner not found' },
                { status: 404 }
            );
        }

        if (!partner.bank_account_number || !partner.bank_name) {
            return NextResponse.json(
                { error: 'Bank account information required. Please update your profile.' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { period_start, period_end } = body;

        // Get total revenue for period
        const startDate = new Date(period_start);
        const endDate = new Date(period_end);

        const { data: trips } = await supabase
            .from('green_mobility_trips')
            .select('partner_amount, commission_amount')
            .eq('transport_partner_id', partner.store_id)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString())
            .eq('status', 'completed');

        const { data: rentals } = await supabase
            .from('ebike_rentals')
            .select('partner_amount, commission_amount')
            .eq('start_station_id', partner.store_id)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString())
            .eq('status', 'completed');

        const allTransactions = [...(trips || []), ...(rentals || [])];
        const totalRevenue = allTransactions.reduce(
            (sum, t) => sum + Number(t.partner_amount), 0
        );

        if (totalRevenue === 0) {
            return NextResponse.json(
                { error: 'No revenue to payout for this period' },
                { status: 400 }
            );
        }

        // Create payout request
        const { data: payout, error: payoutError } = await supabase
            .from('partner_payouts')
            .insert({
                partner_id: partner.store_id,
                payout_period_start: startDate.toISOString(),
                payout_period_end: endDate.toISOString(),
                total_revenue: totalRevenue,
                transaction_count: allTransactions.length,
                status: 'pending',
            })
            .select()
            .single();

        if (payoutError) {
            return NextResponse.json(
                { error: payoutError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            payout_id: payout.payout_id,
            amount: totalRevenue,
            transaction_count: allTransactions.length,
            message: 'Payout request submitted successfully',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
