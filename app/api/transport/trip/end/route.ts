import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// POST: End trip and process payment
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const { tripId, endLat, endLng, distanceKm } = body;

        if (!tripId || distanceKm === undefined) {
            return errorResponse('Trip ID và khoảng cách là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Get trip info
        const { data: trip } = await supabase
            .from('transport_trips')
            .select(`
                trip_id, 
                user_id, 
                vehicle_id, 
                status,
                transport_vehicles (type)
            `)
            .eq('trip_id', tripId)
            .single();

        if (!trip) {
            return errorResponse('Chuyến đi không tồn tại', 404);
        }

        if (trip.status !== 'ongoing') {
            return errorResponse('Chuyến đi đã kết thúc trước đó', 400);
        }

        if (trip.user_id !== authResult.userId) {
            return errorResponse('Bạn không có quyền kết thúc chuyến đi này', 403);
        }

        const vehicleType = (trip.transport_vehicles as any)?.type || 'ebike';

        // Calculate Fare using Database Function
        const { data: fareData, error: calcError } = await supabase
            .rpc('calculate_transport_fare', {
                distance_km: distanceKm,
                vehicle_type: vehicleType
            });

        if (calcError || !fareData || fareData.length === 0) {
            logger.error('Calculate Fare Error', calcError);
            return errorResponse('Lỗi tính cước phí', 500);
        }

        const { fare, commission } = fareData[0];

        // Calculate CO2 Saved
        // Ebus: 0.12kg/km saved vs car/moto
        // Ebike: 0.15kg/km saved vs car/moto
        const co2Factor = vehicleType === 'ebus' ? 0.12 : 0.15;
        const co2Saved = Math.round(distanceKm * co2Factor * 1000) / 1000;

        // Process Walltet Payment (Simulated)
        // 1. Check balance
        const { data: user } = await supabase
            .from('users')
            .select('wallet_balance, green_points')
            .eq('user_id', authResult.userId)
            .single();

        if ((user?.wallet_balance || 0) < fare) {
            return errorResponse(`Số dư không đủ (${user?.wallet_balance}đ). Cần ${fare}đ.`, 402);
        }

        // 2. Atomic Update using RPC or Transaction (Here using sequential updates for MVP)
        // Deduct user wallet
        await supabase.from('users').update({
            wallet_balance: (user?.wallet_balance || 0) - fare,
            green_points: (user?.green_points || 0) + Math.ceil(co2Saved * 10) // Bonus points
        }).eq('user_id', authResult.userId);

        // 3. Update Trip
        const { error: updateError } = await supabase
            .from('transport_trips')
            .update({
                end_time: new Date().toISOString(),
                end_lat: endLat || 0,
                end_lng: endLng || 0,
                distance_km: distanceKm,
                fare_amount: fare,
                commission_amount: commission,
                co2_saved_kg: co2Saved,
                status: 'completed',
                payment_status: 'paid'
            })
            .eq('trip_id', tripId);

        if (updateError) {
            logger.error('Update Trip Error', updateError);
            return errorResponse('Lỗi cập nhật trạng thái chuyến đi', 500);
        }

        // 4. Update Vehicle
        await supabase
            .from('transport_vehicles')
            .update({
                status: 'active',
                current_lat: endLat,
                current_lng: endLng
                // In real app, battery would be updated from IoT
            })
            .eq('vehicle_id', trip.vehicle_id);

        // 5. Send Notification
        await supabase.from('system_notifications').insert({
            type: 'info',
            title: 'Thanh toán thành công',
            message: `Bạn đã thanh toán ${fare.toLocaleString()}đ cho chuyến đi ${distanceKm}km. Giảm được ${co2Saved}kg CO2! 🌍`,
            target_audience: 'user',
            user_id: authResult.userId
        });

        // 6. Log Split Payment (Commission to Admin, Net to Partner would go here)
        // Assuming partner is linked to vehicle owner, we would credit them here.

        return jsonResponse({
            success: true,
            fare,
            co2Saved,
            greenPointsEarned: Math.ceil(co2Saved * 10),
            message: 'Chuyến đi hoàn tất'
        });

    } catch (error: any) {
        logger.error('End Trip API Error', error);
        return errorResponse(error.message, 500);
    }
}
