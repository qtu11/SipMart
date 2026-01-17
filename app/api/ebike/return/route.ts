import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const returnSchema = z.object({
    rentalId: z.string().uuid(),
    stationId: z.string().uuid(),
    distanceKm: z.number().min(0.1).max(500),
    gpsRoute: z.array(
        z.object({
            lat: z.number(),
            lng: z.number(),
            timestamp: z.string(),
        })
    ).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse and validate
        const body = await req.json();
        const validated = returnSchema.parse(body);

        // 3. Verify rental belongs to user
        const { data: rental, error: rentalError } = await supabase
            .from('ebike_rentals')
            .select('rental_id, user_id, bike_id, status')
            .eq('rental_id', validated.rentalId)
            .single();

        if (rentalError || !rental) {
            return NextResponse.json(
                { error: 'Rental not found' },
                { status: 404 }
            );
        }

        if (rental.user_id !== user.id) {
            return NextResponse.json(
                { error: 'This rental does not belong to you' },
                { status: 403 }
            );
        }

        if (rental.status !== 'ongoing') {
            return NextResponse.json(
                { error: 'Rental already completed' },
                { status: 400 }
            );
        }

        // 4. Verify bike location is at station (geofencing check)
        const isAtStation = await verifyBikeAtStation(
            rental.bike_id,
            validated.stationId
        );

        if (!isAtStation) {
            return NextResponse.json(
                {
                    error: 'Bike must be returned to a station',
                    message: 'Vui lòng đưa xe về trạm sạc để kết thúc chuyến đi.',
                },
                { status: 400 }
            );
        }

        // 5. Call RPC function to return bike
        const { data: result, error: rpcError } = await supabase.rpc('return_ebike', {
            p_rental_id: validated.rentalId,
            p_end_station_id: validated.stationId,
            p_distance_km: validated.distanceKm,
        });

        if (rpcError) {
            console.error('Return bike RPC error:', rpcError);
            return NextResponse.json(
                { error: rpcError.message || 'Failed to return bike' },
                { status: 500 }
            );
        }

        const returnData = result[0];

        // 6. Update GPS route if provided
        if (validated.gpsRoute && validated.gpsRoute.length > 0) {
            await supabase
                .from('ebike_rentals')
                .update({
                    gps_route: validated.gpsRoute,
                })
                .eq('rental_id', validated.rentalId);
        }

        // 7. Send IoT lock command
        await sendIoTLockCommand(rental.bike_id);

        // 8. Update green credit score (positive)
        await supabase.rpc('update_green_credit_score', {
            p_user_id: user.id,
            p_action: 'trip_completed',
            p_score_change: 5, // +5 points per trip
            p_reason: 'Completed e-bike rental successfully',
            p_resource_type: 'ebike_rental',
            p_resource_id: validated.rentalId,
        });

        // 9. Send notification
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'success',
            title: '✅ Trả xe thành công!',
            message: `Bạn đã đi ${validated.distanceKm}km, tiết kiệm ${returnData.co2_saved.toFixed(2)}kg CO₂! +${returnData.vnes_points} VNES points.`,
            data: {
                rental_id: validated.rentalId,
                distance_km: validated.distanceKm,
                payment_amount: returnData.payment_amount,
                co2_saved: returnData.co2_saved,
                vnes_points: returnData.vnes_points,
            },
        });

        // 10. Return success
        return NextResponse.json({
            success: true,
            rental_id: validated.rentalId,
            payment_amount: returnData.payment_amount,
            commission_amount: returnData.commission_amount,
            distance_km: validated.distanceKm,
            co2_saved_kg: returnData.co2_saved,
            vnes_points_earned: returnData.vnes_points,
            message: returnData.message,
        });
    } catch (error: any) {
        console.error('Return bike error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Get active rental info
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get active rental
        const { data: rental, error } = await supabase
            .from('ebike_rentals')
            .select(
                `
        rental_id,
        bike_id,
        start_time,
        planned_duration_hours,
        fare,
        ebikes:bike_id (
          battery_level,
          gps_lat,
          gps_lng,
          last_gps_update
        ),
        ebike_stations!ebike_rentals_start_station_id_fkey (
          name,
          address,
          gps_lat,
          gps_lng
        )
      `
            )
            .eq('user_id', user.id)
            .eq('status', 'ongoing')
            .single();

        if (error) {
            return NextResponse.json({
                has_active_rental: false,
            });
        }

        // Calculate elapsed time
        const startTime = new Date(rental.start_time);
        const now = new Date();
        const elapsedHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

        return NextResponse.json({
            has_active_rental: true,
            rental: {
                rental_id: rental.rental_id,
                bike_id: rental.bike_id,
                start_time: rental.start_time,
                elapsed_hours: elapsedHours.toFixed(2),
                planned_duration_hours: rental.planned_duration_hours,
                fare: rental.fare,
                bike: rental.ebikes,
                start_station: rental.ebike_stations,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Verify bike is at station (geofencing)
 * TODO: Integrate with actual GPS tracking
 */
async function verifyBikeAtStation(
    bikeId: string,
    stationId: string
): Promise<boolean> {
    // Mock implementation - always return true
    // In production, check GPS coordinates against station geofence

    console.log(`[Geofence] Verifying bike ${bikeId} at station ${stationId}`);

    // TODO: 
    // 1. Get bike GPS coordinates
    // 2. Get station GPS coordinates
    // 3. Calculate distance
    // 4. Return true if distance < 50m

    return true;
}

/**
 * Send IoT lock command to bike
 */
async function sendIoTLockCommand(bikeId: string): Promise<void> {
    console.log(`[IoT] Sending lock command to bike: ${bikeId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
}
