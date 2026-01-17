import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { getSupabaseAdmin } from '@/lib/supabase/server';

async function verifyAdminAccess(supabase: any, userId: string) {
    const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', userId)
        .single();


    if (!admin || !['super_admin', 'admin'].includes(admin.role)) {
        throw new Error('Admin access required');
    }

    return admin;
}

export async function GET(req: NextRequest) {
    try {
        // Use createClient to get the current authenticated user from cookies
        const supabaseAuth = await createClient();
        const {
            data: { user },
        } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use admin client for database operations to bypass RLS
        const supabase = getSupabaseAdmin();


        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyAdminAccess(supabase, user.id);

        // Get system-wide statistics
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'today';

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            default:
                startDate = new Date('2020-01-01');
        }

        // Get all green mobility trips
        const { data: trips } = await supabase
            .from('green_mobility_trips')
            .select('trip_id, fare, commission_amount, partner_amount, co2_saved_kg, status')
            .gte('start_time', startDate.toISOString());

        // Get all e-bike rentals
        const { data: rentals } = await supabase
            .from('ebike_rentals')
            .select('rental_id, fare, commission_amount, partner_amount, co2_saved_kg, status')
            .gte('start_time', startDate.toISOString());

        // Get cup transactions
        const { data: cupTransactions } = await supabase
            .from('transactions')
            .select('transaction_id, deposit_amount, refund_amount, status')
            .gte('borrow_time', startDate.toISOString());

        // Get payment transactions
        const { data: payments } = await supabase
            .from('payment_transactions')
            .select('payment_id, amount, transaction_type, status')
            .gte('created_at', startDate.toISOString());

        // Calculate financial metrics
        const allTransactions = [...(trips || []), ...(rentals || [])];

        const totalRevenue = allTransactions.reduce(
            (sum, t) => sum + Number(t.fare || 0),
            0
        );

        const totalCommission = allTransactions.reduce(
            (sum, t) => sum + Number(t.commission_amount || 0),
            0
        );

        const partnerRevenue = allTransactions.reduce(
            (sum, t) => sum + Number(t.partner_amount || 0),
            0
        );

        // Cup deposit pool
        const escrowBalance = (cupTransactions || []).reduce(
            (sum, t) =>
                sum +
                (t.status === 'ongoing' ? Number(t.deposit_amount || 0) : 0),
            0
        );

        // Total top-ups
        const totalTopups = (payments || [])
            .filter((p) => p.transaction_type === 'topup' && p.status === 'completed')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        // Calculate CO2 savings
        const totalCO2Saved = allTransactions.reduce(
            (sum, t) => sum + Number(t.co2_saved_kg || 0),
            0
        );

        const cupCO2 = (cupTransactions || []).length * 0.05; // 0.05kg CO2 per cup
        const globalCO2 = totalCO2Saved + cupCO2;

        // Transaction counts
        const stats = {
            financial: {
                total_revenue: totalRevenue,
                sipsmart_commission: totalCommission,
                partner_revenue: partnerRevenue,
                escrow_balance: escrowBalance,
                total_topups: totalTopups,
            },
            transactions: {
                green_mobility: (trips || []).length,
                ebike_rentals: (rentals || []).length,
                cup_transactions: (cupTransactions || []).length,
                payment_topups: (payments || []).filter(
                    (p) => p.transaction_type === 'topup'
                ).length,
            },
            esg: {
                total_co2_saved_kg: globalCO2.toFixed(2),
                mobility_co2_kg: totalCO2Saved.toFixed(2),
                cup_co2_kg: cupCO2.toFixed(2),
                trees_equivalent: Math.floor(globalCO2 / 17),
            },
            period,
        };

        return NextResponse.json(stats);
    } catch (error: any) {
        if (error.message === 'Super admin access required') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
