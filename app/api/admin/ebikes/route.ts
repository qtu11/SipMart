import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/admin/ebikes
 * Get all e-bikes and stations
 */
export async function GET(request: NextRequest) {
    try {
        const isAdmin = await verifyAdminFromRequest(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();

        // Get all bikes with station info
        const { data: bikes, error: bikesError } = await supabase
            .from('ebikes')
            .select(`
                bike_id,
                bike_code,
                status,
                battery_level,
                current_station_id,
                ebike_stations (name)
            `)
            .order('created_at', { ascending: false });

        if (bikesError) throw bikesError;

        // Get all stations
        const { data: stations, error: stationsError } = await supabase
            .from('ebike_stations')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (stationsError) throw stationsError;

        // Format bikes with station name
        const formattedBikes = (bikes || []).map((bike: any) => ({
            bike_id: bike.bike_id,
            bike_code: bike.bike_code,
            status: bike.status,
            battery_level: bike.battery_level,
            current_station_id: bike.current_station_id,
            station_name: bike.ebike_stations?.name || null,
        }));

        // Calculate available bikes per station
        const stationsWithCount = (stations || []).map((station: any) => {
            const availableCount = formattedBikes.filter(
                (b: any) => b.current_station_id === station.station_id && b.status === 'available'
            ).length;
            return {
                ...station,
                available_bikes: availableCount,
            };
        });

        return NextResponse.json({
            bikes: formattedBikes,
            stations: stationsWithCount,
        });

    } catch (error: any) {
        console.error('[Admin E-Bikes] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/ebikes
 * Create e-bike or station
 */
export async function POST(req: NextRequest) {
    try {
        const isAdmin = await verifyAdminFromRequest(req);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { action } = body;

        // Create E-Bike
        if (action === 'create_bike') {
            const { bikeCode, stationId, batteryLevel = 100 } = body;

            if (!bikeCode || !stationId) {
                return NextResponse.json(
                    { error: 'bikeCode and stationId are required' },
                    { status: 400 }
                );
            }

            // Check if bike code exists
            const { data: existing } = await supabase
                .from('ebikes')
                .select('bike_id')
                .eq('bike_code', bikeCode)
                .single();

            if (existing) {
                return NextResponse.json(
                    { error: 'Mã xe đã tồn tại' },
                    { status: 400 }
                );
            }

            const bikeId = uuidv4();
            const { data: bike, error } = await supabase
                .from('ebikes')
                .insert({
                    bike_id: bikeId,
                    bike_code: bikeCode,
                    current_station_id: stationId,
                    battery_level: batteryLevel,
                    status: 'available',
                    is_locked: true,
                    gps_lat: 0,
                    gps_lng: 0,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({
                success: true,
                bike,
                qrData: {
                    type: 'ebike',
                    id: bikeId,
                    code: bikeCode,
                },
            });
        }

        // Create Station
        if (action === 'create_station') {
            const { name, address, gpsLat, gpsLng, totalSlots = 10, solarCapacity = 0 } = body;

            if (!name || !address || gpsLat === undefined || gpsLng === undefined) {
                return NextResponse.json(
                    { error: 'name, address, gpsLat, gpsLng are required' },
                    { status: 400 }
                );
            }

            const stationId = uuidv4();
            const { data: station, error } = await supabase
                .from('ebike_stations')
                .insert({
                    station_id: stationId,
                    name,
                    address,
                    gps_lat: gpsLat,
                    gps_lng: gpsLng,
                    total_slots: totalSlots,
                    solar_capacity_kw: solarCapacity,
                    is_active: true,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({
                success: true,
                station,
                qrData: {
                    type: 'station',
                    id: stationId,
                    code: name,
                },
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[Admin E-Bikes] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/ebikes
 * Delete e-bike or station
 */
export async function DELETE(req: NextRequest) {
    try {
        const isAdmin = await verifyAdminFromRequest(req);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const bikeId = searchParams.get('bikeId');
        const stationId = searchParams.get('stationId');

        if (bikeId) {
            const { error } = await supabase
                .from('ebikes')
                .delete()
                .eq('bike_id', bikeId);

            if (error) throw error;
            return NextResponse.json({ success: true, deleted: 'bike' });
        }

        if (stationId) {
            // Soft delete - set inactive
            const { error } = await supabase
                .from('ebike_stations')
                .update({ is_active: false })
                .eq('station_id', stationId);

            if (error) throw error;
            return NextResponse.json({ success: true, deleted: 'station' });
        }

        return NextResponse.json({ error: 'bikeId or stationId required' }, { status: 400 });

    } catch (error: any) {
        console.error('[Admin E-Bikes] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
