import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// POST: Calculate Carbon Impact
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { actionType, quantity } = body; // actionType: ebus_km, cup_reuse... reference 'eco_impact_factors'

        if (!actionType || !quantity) {
            return errorResponse('Missing actionType or quantity', 400);
        }

        const supabase = getSupabaseAdmin();

        // Get emission factor
        const { data: factor } = await supabase
            .from('eco_impact_factors')
            .select('*')
            .eq('action_type', actionType)
            .single();

        if (!factor) {
            // Fallback default factors if db is empty or type not found
            const defaults: Record<string, number> = {
                ebus_km: 0.12,
                ebike_km: 0.15,
                hand_dryer_use: 0.005,
                cup_reuse: 0.02,
                solar_charge: 0.5
            };
            const defaultFactor = defaults[actionType] || 0;
            const co2Saved = Number(quantity) * defaultFactor;

            return jsonResponse({
                actionType,
                quantity,
                co2SavedKg: Math.round(co2Saved * 1000) / 1000,
                unit: 'unknown',
                source: 'default_fallback'
            });
        }

        const co2Saved = Number(quantity) * Number(factor.co2_saved_kg_per_unit);

        return jsonResponse({
            actionType,
            quantity,
            co2SavedKg: Math.round(co2Saved * 1000) / 1000,
            unit: factor.unit,
            description: factor.description,
            source: 'eco_impact_factors'
        });

    } catch (error: any) {
        logger.error('Carbon Calculator API Error', error);
        return errorResponse(error.message, 500);
    }
}
