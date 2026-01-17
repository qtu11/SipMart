import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const scanSchema = z.object({
    partnerId: z.string().uuid(),
    tripType: z.enum(['bus', 'metro']),
    fare: z.number().min(5000).max(200000),
    routeInfo: z.object({
        from: z.string(),
        to: z.string(),
        distance_km: z.number().min(0.1).max(500),
        route_name: z.string().optional(),
        vehicle_number: z.string().optional(),
    }),
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
        const validated = scanSchema.parse(body);

        // 3. Check user wallet balance
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('wallet_balance, is_blacklisted')
            .eq('user_id', user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (userData.is_blacklisted) {
            return NextResponse.json(
                { error: 'Account is blacklisted' },
                { status: 403 }
            );
        }

        if (userData.wallet_balance < validated.fare) {
            return NextResponse.json(
                {
                    error: 'Insufficient balance',
                    required: validated.fare,
                    current: userData.wallet_balance,
                },
                { status: 400 }
            );
        }

        // 4. Verify partner exists
        const { data: partner, error: partnerError } = await supabase
            .from('stores')
            .select('store_id, name, partner_type')
            .eq('store_id', validated.partnerId)
            .single();

        if (partnerError || !partner || partner.partner_type !== 'transport') {
            return NextResponse.json(
                { error: 'Invalid transport partner' },
                { status: 400 }
            );
        }

        // 5. Call RPC function to process payment
        const { data: result, error: rpcError } = await supabase.rpc(
            'process_green_mobility_payment',
            {
                p_user_id: user.id,
                p_partner_id: validated.partnerId,
                p_trip_type: validated.tripType,
                p_fare: validated.fare,
                p_distance_km: validated.routeInfo.distance_km,
                p_route_info: validated.routeInfo,
            }
        );

        if (rpcError) {
            console.error('RPC error:', rpcError);
            return NextResponse.json(
                { error: rpcError.message || 'Payment processing failed' },
                { status: 500 }
            );
        }

        const tripData = result[0];

        // 6. Send notification
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'success',
            title: '🚌 Thanh toán thành công!',
            message: `Bạn đã đi ${validated.routeInfo.distance_km}km bằng ${validated.tripType === 'bus' ? 'Bus điện' : 'Tàu cao tốc'}. Tiết kiệm ${tripData.co2_saved.toFixed(2)}kg CO₂!`,
            data: {
                trip_id: tripData.trip_id,
                vnes_points: tripData.vnes_points,
                co2_saved: tripData.co2_saved,
            },
        });

        // 7. Return success response
        return NextResponse.json({
            success: true,
            trip_id: tripData.trip_id,
            fare: validated.fare,
            new_balance: tripData.new_balance,
            co2_saved_kg: tripData.co2_saved,
            vnes_points_earned: tripData.vnes_points,
            message: `✅ Bạn đã tiết kiệm ${tripData.co2_saved.toFixed(2)}kg CO₂! +${tripData.vnes_points} VNES points`,
        });
    } catch (error: any) {
        console.error('Green mobility scan error:', error);

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

// GET - Get user's trip history
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
        const tripType = searchParams.get('type'); // 'bus', 'metro', or null for all
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('green_mobility_trips')
            .select(
                `
        trip_id,
        trip_type,
        fare,
        distance_km,
        co2_saved_kg,
        vnes_points_earned,
        route_info,
        start_time,
        end_time,
        status,
        stores:transport_partner_id (
          name,
          address
        )
      `
            )
            .eq('user_id', user.id)
            .order('start_time', { ascending: false })
            .limit(limit);

        if (tripType && ['bus', 'metro'].includes(tripType)) {
            query = query.eq('trip_type', tripType);
        }

        const { data: trips, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate totals
        const totals = trips.reduce(
            (acc, trip) => ({
                total_trips: acc.total_trips + 1,
                total_distance: acc.total_distance + (Number(trip.distance_km) || 0),
                total_co2_saved: acc.total_co2_saved + (Number(trip.co2_saved_kg) || 0),
                total_points: acc.total_points + (trip.vnes_points_earned || 0),
                total_spent: acc.total_spent + (Number(trip.fare) || 0),
            }),
            {
                total_trips: 0,
                total_distance: 0,
                total_co2_saved: 0,
                total_points: 0,
                total_spent: 0,
            }
        );

        return NextResponse.json({
            trips,
            totals,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
