import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/redistribution
 * Get cup and e-bike redistribution recommendations
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get stores with low inventory
        const { data: stores } = await supabase
            .from('stores')
            .select('store_id, name, address, cup_available, cup_total, gps_lat, gps_lng')
            .lt('cup_available', 10)
            .eq('is_active', true);

        // Get stores with excess inventory
        const { data: excessStores } = await supabase
            .from('stores')
            .select('store_id, name, cup_available, cup_total')
            .gt('cup_available', 50)
            .eq('is_active', true);

        // Get e-bike stations needing balancing
        const { data: lowBikeStations } = await supabase
            .from('ebike_stations')
            .select('station_id, name, available_bikes, total_slots, gps_lat, gps_lng')
            .lt('available_bikes', 3)
            .eq('is_active', true);

        const { data: fullStations } = await supabase
            .from('ebike_stations')
            .select('station_id, name, available_bikes, total_slots')
            .gt('available_bikes', 8)
            .eq('is_active', true);

        // Generate recommendations
        const cupRecommendations = generateRedistributionPlan(
            excessStores || [],
            stores || [],
            'cups'
        );

        const bikeRecommendations = generateRedistributionPlan(
            fullStations || [],
            lowBikeStations || [],
            'bikes'
        );

        return NextResponse.json({
            cups: {
                lowInventoryStores: stores || [],
                excessInventoryStores: excessStores || [],
                recommendations: cupRecommendations,
            },
            bikes: {
                lowBikeStations: lowBikeStations || [],
                fullStations: fullStations || [],
                recommendations: bikeRecommendations,
            },
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Generate redistribution recommendations
 */
function generateRedistributionPlan(
    sourceLocations: any[],
    destLocations: any[],
    assetType: 'cups' | 'bikes'
): any[] {
    const recommendations: any[] = [];

    for (const dest of destLocations) {
        // Find nearest source with excess
        let bestSource = null;
        let minDistance = Infinity;

        for (const source of sourceLocations) {
            const distance = calculateDistance(
                source.gps_lat || 0,
                source.gps_lng || 0,
                dest.gps_lat || 0,
                dest.gps_lng || 0
            );

            if (distance < minDistance) {
                minDistance = distance;
                bestSource = source;
            }
        }

        if (bestSource) {
            const quantity = assetType === 'cups'
                ? Math.min(20, bestSource.cup_available - 30)
                : Math.min(3, bestSource.available_bikes - 5);

            if (quantity > 0) {
                recommendations.push({
                    from: {
                        id: bestSource.store_id || bestSource.station_id,
                        name: bestSource.name,
                    },
                    to: {
                        id: dest.store_id || dest.station_id,
                        name: dest.name,
                    },
                    quantity,
                    assetType,
                    distanceKm: Math.round(minDistance * 10) / 10,
                    priority: quantity > 10 ? 'high' : 'medium',
                });
            }
        }
    }

    return recommendations.sort((a, b) =>
        a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0
    );
}

/**
 * Calculate distance between two GPS points (Haversine formula)
 */
function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * POST /api/admin/redistribution
 * Log completed redistribution task
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { from_id, to_id, quantity, asset_type, notes } = body;

        // Log redistribution
        const { error } = await supabase
            .from('redistribution_logs')
            .insert({
                from_location_id: from_id,
                to_location_id: to_id,
                quantity,
                asset_type,
                executed_by: user.id,
                notes,
                status: 'completed',
            });

        if (error) throw error;

        // Update inventory at both locations
        if (asset_type === 'cups') {
            await supabase.rpc('transfer_cup_inventory', {
                p_from_store: from_id,
                p_to_store: to_id,
                p_quantity: quantity,
            });
        }

        return NextResponse.json({
            success: true,
            message: `Transferred ${quantity} ${asset_type}`,
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
