import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET: User Eco Impact Dashboard
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return unauthorizedResponse();
        }

        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || authResult.userId;

        // 1. Get total trips impact
        const { data: tripStats } = await supabase
            .from('transport_trips')
            .select('co2_saved_kg, distance_km')
            .eq('user_id', userId)
            .eq('status', 'completed');

        let transportCO2 = 0;
        let totalDistance = 0;
        tripStats?.forEach(t => {
            transportCO2 += Number(t.co2_saved_kg) || 0;
            totalDistance += Number(t.distance_km) || 0;
        });

        // 2. Get device usage impact (hand dryer, etc.)
        // Note: device_usage_logs table needs to be populated
        const { data: deviceLogs } = await supabase
            .from('device_usage_logs')
            .select('resource_saved_type, resource_saved_amount')
            .eq('user_id', userId);

        const waterSaved = 0; // Liters
        let paperSaved = 0; // Sheets

        deviceLogs?.forEach(log => {
            if (log.resource_saved_type === 'paper_towel') {
                paperSaved += Number(log.resource_saved_amount) || 0;
            }
            // Add more resource types logic here
        });

        // 3. Get reused cups impact (from transactions)
        const { count: cupsReused } = await supabase
            .from('transactions')
            .select('transaction_id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        const cupCO2 = (cupsReused || 0) * 0.02; // 20g per cup
        const cupWater = (cupsReused || 0) * 0.5; // 0.5L per cup

        // Total Impact
        const totalCO2 = transportCO2 + cupCO2;
        const totalWater = cupWater + waterSaved;
        const treesEquivalent = Math.round((totalCO2 / 21) * 100) / 100; // 21kg CO2/tree/year

        return jsonResponse({
            userId,
            summary: {
                totalCO2SavedKg: Math.round(totalCO2 * 100) / 100,
                treesPlantedEquivalent: treesEquivalent,
                plasticAvoidedCount: cupsReused || 0,
                waterSavedLiters: Math.round(totalWater * 10) / 10,
                paperSavedSheets: paperSaved
            },
            breakdown: {
                transport: {
                    distanceKm: Math.round(totalDistance * 10) / 10,
                    co2SavedKg: Math.round(transportCO2 * 100) / 100
                },
                consumption: {
                    cupsReused: cupsReused || 0,
                    co2SavedKg: Math.round(cupCO2 * 100) / 100
                }
            },
            nextMilestone: {
                target: Math.ceil((totalCO2 + 0.1) / 5) * 5, // Next multiple of 5kg
                current: totalCO2,
                percent: Math.min(100, Math.round((totalCO2 / (Math.ceil((totalCO2 + 0.1) / 5) * 5)) * 100))
            }
        });

    } catch (error: any) {
        logger.error('Eco Dashboard API Error', error);
        return errorResponse(error.message, 500);
    }
}
