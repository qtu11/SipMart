import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const unlockSchema = z.object({
    bikeId: z.string().min(4),
    stationId: z.string().uuid(),
    plannedDurationHours: z.number().min(1).max(24),
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
        const validated = unlockSchema.parse(body);

        // 3. Check if user has active rental
        const { data: activeRental } = await supabase
            .from('ebike_rentals')
            .select('rental_id')
            .eq('user_id', user.id)
            .eq('status', 'ongoing')
            .single();

        if (activeRental) {
            return NextResponse.json(
                { error: 'You already have an active bike rental. Please return it first.' },
                { status: 400 }
            );
        }

        // 4. Call RPC function to unlock bike
        const { data: result, error: rpcError } = await supabase.rpc('unlock_ebike', {
            p_user_id: user.id,
            p_bike_id: validated.bikeId,
            p_station_id: validated.stationId,
            p_planned_duration_hours: validated.plannedDurationHours,
        });

        if (rpcError) {
            console.error('Unlock bike RPC error:', rpcError);

            // Handle specific errors
            if (rpcError.message.includes('eKYC verification required')) {
                return NextResponse.json(
                    {
                        error: 'eKYC verification required',
                        message: 'Please complete identity verification to rent e-bikes.',
                        action_required: 'complete_ekyc',
                    },
                    { status: 403 }
                );
            }

            if (rpcError.message.includes('not available')) {
                return NextResponse.json(
                    { error: 'Bike is not available at the moment' },
                    { status: 400 }
                );
            }

            if (rpcError.message.includes('Insufficient balance')) {
                return NextResponse.json(
                    { error: rpcError.message },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: rpcError.message || 'Failed to unlock bike' },
                { status: 500 }
            );
        }

        const unlockData = result[0];

        // 5. Send IoT command to unlock (mock - integrate with actual IoT platform)
        await sendIoTUnlockCommand(validated.bikeId);

        // 6. Send notification
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'success',
            title: '🚲 Xe đã mở khóa!',
            message: `Chuyến đi của bạn đã bắt đầu. Phí: ${unlockData.fare.toLocaleString('vi-VN')} VNĐ.`,
            data: {
                rental_id: unlockData.rental_id,
                bike_id: validated.bikeId,
                fare: unlockData.fare,
            },
        });

        // 7. Return success
        return NextResponse.json({
            success: true,
            rental_id: unlockData.rental_id,
            bike_id: validated.bikeId,
            fare: unlockData.fare,
            message: unlockData.message,
            planned_duration_hours: validated.plannedDurationHours,
        });
    } catch (error: any) {
        console.error('Unlock bike error:', error);

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

// GET - Get available bikes at station
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const { searchParams } = new URL(req.url);
        const stationId = searchParams.get('stationId');

        if (!stationId) {
            return NextResponse.json(
                { error: 'stationId is required' },
                { status: 400 }
            );
        }

        // Get station info and bikes
        const { data: station, error: stationError } = await supabase
            .from('ebike_stations')
            .select('*')
            .eq('station_id', stationId)
            .single();

        if (stationError || !station) {
            return NextResponse.json(
                { error: 'Station not found' },
                { status: 404 }
            );
        }

        const { data: bikes, error: bikesError } = await supabase
            .from('ebikes')
            .select('bike_id, battery_level, status')
            .eq('current_station_id', stationId)
            .in('status', ['available', 'charging'])
            .order('battery_level', { ascending: false });

        if (bikesError) {
            return NextResponse.json(
                { error: bikesError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            station: {
                id: station.station_id,
                name: station.name,
                address: station.address,
                available_bikes: station.available_bikes,
                total_slots: station.total_slots,
                solar_production_kw: station.current_energy_production_kw,
            },
            bikes: bikes.map((bike) => ({
                bike_id: bike.bike_id,
                battery_level: bike.battery_level,
                available: bike.status === 'available',
            })),
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Send IoT unlock command to bike
 * TODO: Integrate with actual IoT platform (MQTT, HTTP API, etc.)
 */
async function sendIoTUnlockCommand(bikeId: string): Promise<void> {
    // Mock implementation
    console.log(`[IoT] Sending unlock command to bike: ${bikeId}`);

    // In production, integrate with:
    // - MQTT broker
    // - HTTP API to smart lock
    // - WebSocket connection

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
}
