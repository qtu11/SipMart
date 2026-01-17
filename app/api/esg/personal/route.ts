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
        const period = searchParams.get('period') || 'all'; // today, week, month, all

        // Calculate date range
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

        // Get user's green mobility trips
        const { data: trips } = await supabase
            .from('green_mobility_trips')
            .select('trip_type, fare, distance_km, co2_saved_kg, vnes_points_earned, start_time')
            .eq('user_id', user.id)
            .gte('start_time', startDate.toISOString())
            .eq('status', 'completed');

        // Get user's e-bike rentals
        const { data: rentals } = await supabase
            .from('ebike_rentals')
            .select('fare, distance_km, co2_saved_kg, vnes_points_earned, start_time')
            .eq('user_id', user.id)
            .gte('start_time', startDate.toISOString())
            .eq('status', 'completed');

        // Get user's cup transactions
        const { data: cupTransactions } = await supabase
            .from('transactions')
            .select('green_points_earned, borrow_time')
            .eq('user_id', user.id)
            .gte('borrow_time', startDate.toISOString())
            .eq('status', 'completed');

        // Calculate totals
        const mobility_co2_saved = (trips || []).reduce(
            (sum: number, t: { co2_saved_kg?: number }) => sum + Number(t.co2_saved_kg || 0), 0
        ) + (rentals || []).reduce(
            (sum: number, r: { co2_saved_kg?: number }) => sum + Number(r.co2_saved_kg || 0), 0
        );

        const plastic_reduced_kg = (cupTransactions || []).length * 0.02; // 0.02kg per cup

        const total_co2_saved = mobility_co2_saved + (plastic_reduced_kg * 2.5); // Plastic production CO2
        const water_saved_liters = (cupTransactions || []).length * 0.5; // 0.5L per cup
        const energy_saved_kwh = (cupTransactions || []).length * 0.03; // 0.03kWh per cup

        const total_vnes_points = (trips || []).reduce(
            (sum: number, t: { vnes_points_earned?: number }) => sum + (t.vnes_points_earned || 0), 0
        ) + (rentals || []).reduce(
            (sum: number, r: { vnes_points_earned?: number }) => sum + (r.vnes_points_earned || 0), 0
        ) + (cupTransactions || []).reduce(
            (sum: number, c: { green_points_earned?: number }) => sum + (c.green_points_earned || 0), 0
        );

        const total_distance_km = (trips || []).reduce(
            (sum: number, t: { distance_km?: number }) => sum + Number(t.distance_km || 0), 0
        ) + (rentals || []).reduce(
            (sum: number, r: { distance_km?: number }) => sum + Number(r.distance_km || 0), 0
        );

        const trees_equivalent = Math.floor(total_co2_saved / 17); // 17kg CO2 = 1 tree/year

        return NextResponse.json({
            personal_esg: {
                co2_saved_kg: total_co2_saved.toFixed(2),
                plastic_reduced_kg: plastic_reduced_kg.toFixed(2),
                water_saved_liters: water_saved_liters.toFixed(1),
                energy_saved_kwh: energy_saved_kwh.toFixed(2),
                trees_equivalent,
                total_vnes_points,
                total_distance_km: total_distance_km.toFixed(1),
            },
            breakdown: {
                green_mobility_trips: (trips || []).length,
                ebike_rentals: (rentals || []).length,
                cups_saved: (cupTransactions || []).length,
            },
            period,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
