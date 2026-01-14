import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET: Find nearby vehicles
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');
        const radiusKm = parseFloat(searchParams.get('radius') || '1'); // Default 1km
        const type = searchParams.get('type'); // optional: ebus, ebike

        if (!lat || !lng) {
            return errorResponse('Latitude and Longitude are required', 400);
        }

        const supabase = getSupabaseAdmin();

        // Perform geospatial query (simplified haversine approximation for PostGIS-less environments)
        // In real prod with PostGIS: ST_DWithin(location, ST_MakePoint(lng, lat), radius_meters)

        let query = supabase
            .from('transport_vehicles')
            .select('*')
            .eq('status', 'active')
            .gte('battery_level', 15); // Filter out low battery

        if (type) {
            query = query.eq('type', type);
        }

        const { data: vehicles, error } = await query;

        if (error) {
            logger.error('Find Vehicles Error', error);
            return errorResponse('Lỗi tìm kiếm xe', 500);
        }

        // Filter by distance in memory (for small dataset)
        // Haversine formula
        const nearbyVehicles = vehicles?.filter(v => {
            if (!v.current_lat || !v.current_lng) return false;

            const R = 6371; // km
            const dLat = (v.current_lat - lat) * Math.PI / 180;
            const dLng = (v.current_lng - lng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(v.current_lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return distance <= radiusKm;
        }).map(v => ({
            ...v,
            distance: calculateDistance(lat, lng, v.current_lat, v.current_lng)
        })).sort((a, b) => a.distance - b.distance);

        return jsonResponse({
            vehicles: nearbyVehicles || [],
            count: nearbyVehicles?.length || 0,
            location: { lat, lng, radiusKm }
        });

    } catch (error: any) {
        logger.error('Nearby Vehicles API Error', error);
        return errorResponse(error.message, 500);
    }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
}
