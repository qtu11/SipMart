import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// POST: Control IoT Device (Simulated)
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const { deviceId, command, params } = body;

        if (!deviceId || !command) {
            return errorResponse('Device ID and command are required', 400);
        }

        const supabase = getSupabaseAdmin();

        // Verify device access
        const { data: device } = await supabase
            .from('smart_devices')
            .select('*')
            .eq('device_id', deviceId)
            .single();

        if (!device) {
            return errorResponse('Device not found', 404);
        }

        if (device.status === 'maintenance') {
            return errorResponse('Thiết bị đang bảo trì', 503);
        }

        // Simulate MQTT Command
        logger.info(`[MQTT] Sending command ${command} to device ${deviceId}`, params || {});

        // Simulate successful action and log usage
        if (command === 'optimize' || command === 'activate') {
            let info = params?.info || 'usage';

            // Log usage if applicable
            if (device.type === 'hand_dryer') {
                await supabase.from('device_usage_logs').insert({
                    device_id: deviceId,
                    user_id: authResult.userId,
                    duration_seconds: 15, // estimated
                    energy_consumed_kwh: 0.005,
                    resource_saved_type: 'paper_towel',
                    resource_saved_amount: 2, // 2 sheets saved
                    eco_points_earned: 1
                });
                info = 'Saved 2 paper towels';
            }

            return jsonResponse({
                success: true,
                deviceId,
                command,
                status: 'executed',
                message: `Lệnh ${command} đã được gửi thành công.`,
                info
            });
        }

        return jsonResponse({
            success: true,
            deviceId,
            command,
            status: 'queued',
            message: 'Lệnh đang được xử lý.'
        });

    } catch (error: any) {
        logger.error('Device Control API Error', error);
        return errorResponse(error.message, 500);
    }
}
