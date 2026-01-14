import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// POST: Start a new trip
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const { vehicleId, startLat, startLng } = body;

        if (!vehicleId) {
            return errorResponse('Vehicle ID is required', 400);
        }

        const supabase = getSupabaseAdmin();

        // Check vehicle availability and type
        const { data: vehicle } = await supabase
            .from('transport_vehicles')
            .select('status, type, battery_level')
            .eq('vehicle_id', vehicleId)
            .single();

        if (!vehicle) {
            return errorResponse('Xe không tồn tại', 404);
        }

        if (vehicle.status !== 'active') {
            return errorResponse(`Xe đang ở trạng thái ${vehicle.status}, không thể sử dụng`, 400);
        }

        if (vehicle.battery_level < 10) {
            return errorResponse('Pin xe quá thấp (< 10%), vui lòng chọn xe khác', 400);
        }

        // Start Trip Transaction
        // 1. Update vehicle status to in_use
        await supabase
            .from('transport_vehicles')
            .update({ status: 'in_use' })
            .eq('vehicle_id', vehicleId);

        // 2. Create trip record
        const { data: trip, error } = await supabase
            .from('transport_trips')
            .insert({
                user_id: authResult.userId,
                vehicle_id: vehicleId,
                start_time: new Date().toISOString(),
                start_lat: startLat || 0,
                start_lng: startLng || 0,
                status: 'ongoing',
                payment_status: 'pending'
            })
            .select()
            .single();

        if (error) {
            // Rollback status
            await supabase.from('transport_vehicles').update({ status: 'active' }).eq('vehicle_id', vehicleId);
            logger.error('Start Trip Error', error);
            return errorResponse('Không thể bắt đầu chuyến đi', 500);
        }

        // Send MQTT command to unlock vehicle (Mock for now)
        logger.info(`[MQTT] Sending UNLOCK command to vehicle ${vehicleId}`);

        return jsonResponse({
            success: true,
            tripId: trip.trip_id,
            startTime: trip.start_time,
            message: 'Đã mở khóa xe thành công. Chúc bạn thượng lộ bình an!'
        });

    } catch (error: any) {
        logger.error('Start Trip API Error', error);
        return errorResponse(error.message, 500);
    }
}
