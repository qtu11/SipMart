import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

async function verifyPartnerAccess(supabase: any, userId: string) {
    const { data: partner } = await supabase
        .from('stores')
        .select('store_id, name, partner_type')
        .eq('user_id', userId)
        .single();

    if (!partner) {
        throw new Error('Partner access denied');
    }

    return partner;
}

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const partner = await verifyPartnerAccess(supabase, user.id);

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'all';
        const format = searchParams.get('format') || 'json'; // json or pdf

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'month':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case 'quarter':
                startDate = new Date(now.setDate(now.getDate() - 90));
                break;
            case 'year':
                startDate = new Date(now.setDate(now.getDate() - 365));
                break;
            default:
                startDate = new Date('2020-01-01');
        }

        // Get partner's trips
        const { data: trips } = await supabase
            .from('green_mobility_trips')
            .select('co2_saved_kg, distance_km, start_time')
            .eq('transport_partner_id', partner.store_id)
            .gte('start_time', startDate.toISOString())
            .eq('status', 'completed');

        // Get partner's rentals (if e-bike station)
        const { data: rentals } = await supabase
            .from('ebike_rentals')
            .select('co2_saved_kg, distance_km, start_time')
            .eq('start_station_id', partner.store_id)
            .gte('start_time', startDate.toISOString())
            .eq('status', 'completed');

        const allTransactions = [...(trips || []), ...(rentals || [])];

        // Calculate ESG metrics
        const total_co2_saved = allTransactions.reduce(
            (sum, t) => sum + Number(t.co2_saved_kg || 0),
            0
        );

        const total_distance = allTransactions.reduce(
            (sum, t) => sum + Number(t.distance_km || 0),
            0
        );

        const trees_equivalent = Math.floor(total_co2_saved / 17);

        // Monthly breakdown
        const monthlyData = allTransactions.reduce((acc: any, t) => {
            const month = new Date(t.start_time).toISOString().slice(0, 7);
            if (!acc[month]) {
                acc[month] = { co2: 0, distance: 0, count: 0 };
            }
            acc[month].co2 += Number(t.co2_saved_kg || 0);
            acc[month].distance += Number(t.distance_km || 0);
            acc[month].count += 1;
            return acc;
        }, {});

        const report = {
            partner: {
                id: partner.store_id,
                name: partner.name,
                type: partner.partner_type,
            },
            period: {
                start: startDate.toISOString(),
                end: new Date().toISOString(),
                label: period,
            },
            esg_impact: {
                total_co2_saved_kg: total_co2_saved.toFixed(2),
                total_distance_km: total_distance.toFixed(1),
                trees_equivalent,
                total_trips: allTransactions.length,
            },
            scope_3_emissions: {
                description:
                    'Indirect emissions from customer transportation using our green mobility services',
                emissions_avoided_kg: total_co2_saved.toFixed(2),
                calculation_method: 'IPCC Guidelines (2006)',
                emission_factor: '0.12 kg CO2/km (electric vs gasoline)',
            },
            monthly_breakdown: Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
                month,
                co2_saved_kg: data.co2.toFixed(2),
                distance_km: data.distance.toFixed(1),
                trip_count: data.count,
            })),
            certification: {
                report_date: new Date().toISOString(),
                standard: 'IPCC 2006 Guidelines',
                verified_by: 'SipMart Carbon Tracking System',
            },
        };

        if (format === 'pdf') {
            // TODO: Generate PDF report
            return NextResponse.json(
                { error: 'PDF generation not yet implemented' },
                { status: 501 }
            );
        }

        return NextResponse.json(report);
    } catch (error: any) {
        if (error.message === 'Partner access denied') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
