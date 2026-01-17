import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'all';

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

        // Get ALL green mobility trips (global)
        const { data: trips } = await supabase
            .from('green_mobility_trips')
            .select('co2_saved_kg, vnes_points_earned, trip_type')
            .gte('start_time', startDate.toISOString())
            .eq('status', 'completed');

        // Get ALL e-bike rentals
        const { data: rentals } = await supabase
            .from('ebike_rentals')
            .select('co2_saved_kg, vnes_points_earned, distance_km')
            .gte('start_time', startDate.toISOString())
            .eq('status', 'completed');

        // Get ALL cup transactions
        const { data: cupTransactions } = await supabase
            .from('transactions')
            .select('transaction_id, green_points_earned')
            .gte('borrow_time', startDate.toISOString())
            .eq('status', 'completed');

        // Calculate global ESG metrics
        const mobility_co2 =
            (trips || []).reduce((sum, t) => sum + Number(t.co2_saved_kg || 0), 0) +
            (rentals || []).reduce((sum, r) => sum + Number(r.co2_saved_kg || 0), 0);

        const cups_saved = (cupTransactions || []).length;
        const plastic_reduced_kg = cups_saved * 0.02; // 0.02kg per cup
        const cup_co2_kg = plastic_reduced_kg * 2.5; // Plastic production CO2

        const total_co2_saved = mobility_co2 + cup_co2_kg;
        const water_saved_liters = cups_saved * 0.5;
        const energy_saved_kwh = cups_saved * 0.03;
        const trees_equivalent = Math.floor(total_co2_saved / 17);

        const total_distance_km = (rentals || []).reduce(
            (sum, r) => sum + Number(r.distance_km || 0),
            0
        );

        // Get active users count
        const { count: activeUsers } = await supabase
            .from('users')
            .select('user_id', { count: 'exact', head: true })
            .gte('last_activity', startDate.toISOString());

        // Breakdown by trip type
        const bus_trips = (trips || []).filter((t) => t.trip_type === 'bus').length;
        const metro_trips = (trips || []).filter((t) => t.trip_type === 'metro').length;

        return NextResponse.json({
            global_esg: {
                total_co2_saved_kg: total_co2_saved.toFixed(2),
                mobility_co2_kg: mobility_co2.toFixed(2),
                plastic_reduced_kg: plastic_reduced_kg.toFixed(2),
                cup_co2_kg: cup_co2_kg.toFixed(2),
                water_saved_liters: water_saved_liters.toFixed(1),
                energy_saved_kwh: energy_saved_kwh.toFixed(2),
                trees_equivalent,
                total_distance_km: total_distance_km.toFixed(1),
            },
            participation: {
                active_users: activeUsers || 0,
                bus_trips,
                metro_trips,
                ebike_rentals: (rentals || []).length,
                cups_saved,
            },
            period,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
