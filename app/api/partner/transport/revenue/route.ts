export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Partner Transport Revenue
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'financial', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'monthly';

        // 1. Get partner vehicles
        const { data: vehicles } = await supabase
            .from('transport_vehicles')
            .select('vehicle_id, type, code, status')
            .eq('partner_id', authResult.partnerId);

        const vehicleIds = vehicles?.map(v => v.vehicle_id) || [];

        if (vehicleIds.length === 0) {
            return jsonResponse({
                totalTrips: 0,
                totalRevenue: 0,
                totalCommission: 0,
                netIncome: 0,
                vehicles: [],
                trips: []
            });
        }

        // 2. Get trips for these vehicles
        const now = new Date();
        let startDate: Date;

        // Simple period logic
        if (period === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // weekly default
        }

        const { data: trips } = await supabase
            .from('transport_trips')
            .select('*')
            .in('vehicle_id', vehicleIds)
            .gte('start_time', startDate.toISOString())
            .eq('status', 'completed');

        // 3. Calculate totals
        let totalRevenue = 0;
        let totalCommission = 0;

        trips?.forEach(t => {
            totalRevenue += Number(t.fare_amount) || 0;
            totalCommission += Number(t.commission_amount) || 0;
        });

        const netIncome = totalRevenue - totalCommission;

        return jsonResponse({
            summary: {
                totalTrips: trips?.length || 0,
                totalRevenue,
                totalCommission,
                netIncome,
                period
            },
            vehicleCount: vehicles?.length || 0,
            vehicles: vehicles?.map(v => ({
                id: v.vehicle_id,
                code: v.code,
                type: v.type,
                status: v.status,
                trips: trips?.filter(t => t.vehicle_id === v.vehicle_id).length || 0,
                revenue: trips?.filter(t => t.vehicle_id === v.vehicle_id)
                    .reduce((sum, t) => sum + (Number(t.fare_amount) || 0), 0) || 0
            }))
        });

    } catch (error: any) {
        logger.error('Partner Transport Revenue API Error', error);
        return errorResponse(error.message, 500);
    }
}
