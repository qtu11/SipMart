import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getBikeStatus, sendBikeCommand, isWithinGeofence } from '@/lib/iot/commands';

// Verify admin or operator access
async function verifyIoTAccess(supabase: any, userId: string) {
    const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (!admin || !['super_admin', 'store_admin', 'operator'].includes(admin.role)) {
        throw new Error('IoT access required');
    }

    return admin;
}

/**
 * GET /api/admin/iot
 * Get IoT device status overview
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyIoTAccess(supabase, user.id);

        const { searchParams } = new URL(req.url);
        const view = searchParams.get('view') || 'overview';
        const stationId = searchParams.get('stationId');

        // Get all bikes with latest status
        let bikeQuery = supabase
            .from('ebikes')
            .select(`
                bike_id,
                bike_code,
                status,
                battery_level,
                last_gps_lat,
                last_gps_lng,
                last_seen,
                current_station_id,
                firmware_version,
                ebike_stations:current_station_id (
                    station_id,
                    name,
                    address
                )
            `)
            .order('last_seen', { ascending: false });

        if (stationId) {
            bikeQuery = bikeQuery.eq('current_station_id', stationId);
        }

        const { data: bikes, error: bikesError } = await bikeQuery;
        if (bikesError) throw bikesError;

        // Get stations status
        const { data: stations, error: stationsError } = await supabase
            .from('ebike_stations')
            .select(`
                station_id,
                name,
                address,
                gps_lat,
                gps_lng,
                total_slots,
                available_bikes,
                current_energy_production_kw,
                battery_storage_kwh,
                is_active
            `)
            .eq('is_active', true);

        if (stationsError) throw stationsError;

        // Calculate statistics
        const stats = {
            totalBikes: bikes?.length || 0,
            availableBikes: bikes?.filter(b => b.status === 'available').length || 0,
            inUseBikes: bikes?.filter(b => b.status === 'in_use').length || 0,
            chargingBikes: bikes?.filter(b => b.status === 'charging').length || 0,
            maintenanceBikes: bikes?.filter(b => b.status === 'maintenance').length || 0,
            lowBatteryBikes: bikes?.filter(b => (b.battery_level || 0) < 20).length || 0,
            offlineBikes: bikes?.filter(b => {
                const lastSeen = new Date(b.last_seen);
                return (Date.now() - lastSeen.getTime()) > 15 * 60 * 1000; // 15 mins
            }).length || 0,
            totalStations: stations?.length || 0,
            totalSolarKw: stations?.reduce((sum, s) => sum + (s.current_energy_production_kw || 0), 0) || 0,
        };

        // Format bikes for response
        const formattedBikes = (bikes || []).map(bike => ({
            bikeId: bike.bike_id,
            code: bike.bike_code,
            status: bike.status,
            batteryLevel: bike.battery_level || 0,
            location: {
                lat: bike.last_gps_lat,
                lng: bike.last_gps_lng,
            },
            lastSeen: bike.last_seen,
            station: bike.ebike_stations,
            firmwareVersion: bike.firmware_version,
            isOnline: bike.last_seen
                ? (Date.now() - new Date(bike.last_seen).getTime()) < 15 * 60 * 1000
                : false,
        }));

        return NextResponse.json({
            stats,
            bikes: formattedBikes,
            stations: stations || [],
        });

    } catch (error: any) {
        if (error.message === 'IoT access required') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/iot
 * Send IoT command to bike
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyIoTAccess(supabase, user.id);

        const body = await req.json();
        const { bikeId, command, payload } = body;

        if (!bikeId || !command) {
            return NextResponse.json(
                { error: 'bikeId and command are required' },
                { status: 400 }
            );
        }

        // Validate command
        const validCommands = ['UNLOCK', 'LOCK', 'LOCATE', 'ALARM_ON', 'ALARM_OFF', 'BATTERY_CHECK'];
        if (!validCommands.includes(command)) {
            return NextResponse.json(
                { error: `Invalid command. Valid: ${validCommands.join(', ')}` },
                { status: 400 }
            );
        }

        // Send command
        const result = await sendBikeCommand(bikeId, command, payload);

        // Log command to database
        await supabase.from('iot_command_logs').insert({
            bike_id: bikeId,
            command_type: command,
            command_id: result.commandId,
            sent_by: user.id,
            payload,
            status: result.success ? 'sent' : 'failed',
        });

        return NextResponse.json({
            success: result.success,
            commandId: result.commandId,
            message: result.message,
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
