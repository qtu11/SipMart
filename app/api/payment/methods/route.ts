/**
 * Get Available Payment Methods API
 * GET /api/payment/methods - Returns active payment methods
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('payment_configs')
      .select('provider_id, provider_name, logo_url, min_amount, max_amount, fee_percent, fee_fixed')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[API] /api/payment/methods error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    const methods = (data || []).map((m: any) => ({
      id: m.provider_id,
      name: m.provider_name,
      logo: m.logo_url,
      minAmount: m.min_amount || 10000,
      maxAmount: m.max_amount || 100000000,
      feePercent: m.fee_percent || 0,
      feeFixed: m.fee_fixed || 0,
    }));

    return NextResponse.json({
      success: true,
      methods,
    });

  } catch (error: any) {
    console.error('[API] /api/payment/methods error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
