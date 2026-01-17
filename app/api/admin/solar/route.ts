import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/solar
 * Get solar panel monitoring data
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const stationId = searchParams.get('stationId');
        const period = searchParams.get('period') || 'today';

        // Get all solar-enabled stations
        let stationQuery = supabase
            .from('ebike_stations')
            .select(`
                station_id,
                name,
                address,
                gps_lat,
                gps_lng,
                solar_capacity_kw,
                current_energy_production_kw,
                battery_storage_kwh,
                current_battery_level,
                last_maintenance,
                is_active
            `)
            .gt('solar_capacity_kw', 0)
            .eq('is_active', true);

        if (stationId) {
            stationQuery = stationQuery.eq('station_id', stationId);
        }

        const { data: stations, error } = await stationQuery;
        if (error) throw error;

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
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            default:
                startDate = new Date(now.setHours(0, 0, 0, 0));
        }

        // Get energy production logs (if table exists)
        const stationIds = (stations || []).map(s => s.station_id);

        // Calculate aggregate stats
        const totalCapacity = (stations || []).reduce(
            (sum, s) => sum + (s.solar_capacity_kw || 0), 0
        );
        const currentProduction = (stations || []).reduce(
            (sum, s) => sum + (s.current_energy_production_kw || 0), 0
        );
        const totalBatteryStorage = (stations || []).reduce(
            (sum, s) => sum + (s.battery_storage_kwh || 0), 0
        );
        const avgBatteryLevel = (stations || []).length > 0
            ? (stations || []).reduce((sum, s) => sum + (s.current_battery_level || 0), 0) / stations.length
            : 0;

        // Calculate environmental impact
        // 1 kWh solar = 0.5 kg CO2 saved (vs coal power)
        const estimatedDailyKwh = currentProduction * 6; // ~6 hours peak sun
        const dailyCO2SavedKg = estimatedDailyKwh * 0.5;
        const monthlyTrees = Math.floor((dailyCO2SavedKg * 30) / 21); // 21kg CO2/tree/year

        // Format station data
        const formattedStations = (stations || []).map(station => ({
            stationId: station.station_id,
            name: station.name,
            address: station.address,
            location: {
                lat: station.gps_lat,
                lng: station.gps_lng,
            },
            solar: {
                capacity: station.solar_capacity_kw,
                currentProduction: station.current_energy_production_kw,
                efficiency: station.solar_capacity_kw > 0
                    ? Math.round((station.current_energy_production_kw / station.solar_capacity_kw) * 100)
                    : 0,
            },
            battery: {
                capacity: station.battery_storage_kwh,
                currentLevel: station.current_battery_level,
            },
            lastMaintenance: station.last_maintenance,
            health: getSolarHealth(station),
        }));

        return NextResponse.json({
            overview: {
                totalCapacityKw: totalCapacity,
                currentProductionKw: currentProduction,
                efficiencyPercent: totalCapacity > 0
                    ? Math.round((currentProduction / totalCapacity) * 100)
                    : 0,
                totalBatteryKwh: totalBatteryStorage,
                avgBatteryPercent: Math.round(avgBatteryLevel),
                stationCount: (stations || []).length,
            },
            environmental: {
                estimatedDailyKwh,
                dailyCO2SavedKg: Math.round(dailyCO2SavedKg * 10) / 10,
                monthlyTrees,
                yearlyTrees: monthlyTrees * 12,
            },
            stations: formattedStations,
            period,
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Determine solar station health status
 */
function getSolarHealth(station: any): 'good' | 'warning' | 'critical' {
    const efficiency = station.solar_capacity_kw > 0
        ? station.current_energy_production_kw / station.solar_capacity_kw
        : 0;

    const batteryLevel = station.current_battery_level || 0;

    // Check for critical issues
    if (efficiency < 0.3 || batteryLevel < 10) return 'critical';
    if (efficiency < 0.5 || batteryLevel < 30) return 'warning';
    return 'good';
}

/**
 * POST /api/admin/solar
 * Update solar station data (for IoT integration)
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // This endpoint is for IoT devices to push data
        // In production, implement proper API key auth
        const apiKey = req.headers.get('X-API-Key');
        if (apiKey !== process.env.IOT_API_KEY) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

        const body = await req.json();
        const { stationId, productionKw, batteryLevel, batteryKwh } = body;

        if (!stationId) {
            return NextResponse.json(
                { error: 'stationId is required' },
                { status: 400 }
            );
        }

        // Update station data
        const updateData: any = { updated_at: new Date().toISOString() };
        if (productionKw !== undefined) updateData.current_energy_production_kw = productionKw;
        if (batteryLevel !== undefined) updateData.current_battery_level = batteryLevel;
        if (batteryKwh !== undefined) updateData.battery_storage_kwh = batteryKwh;

        const { error } = await supabase
            .from('ebike_stations')
            .update(updateData)
            .eq('station_id', stationId);

        if (error) throw error;

        // Log production data for analytics (ignore errors if table doesn't exist)
        try {
            await supabase.from('solar_production_logs').insert({
                station_id: stationId,
                production_kw: productionKw,
                battery_level: batteryLevel,
                logged_at: new Date().toISOString(),
            });
        } catch {
            // Table may not exist, ignore
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
