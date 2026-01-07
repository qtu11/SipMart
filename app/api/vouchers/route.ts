import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/vouchers
 * Lấy danh sách voucher available cho user
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user info to check rank
        const { data: userData } = await supabase
            .from('users')
            .select('rank')
            .eq('user_id', user.id)
            .single();

        const userRank = userData?.rank || 'seed';

        // Get available vouchers
        const now = new Date().toISOString();
        let query = supabase
            .from('vouchers')
            .select('*')
            .eq('is_active', true)
            .lte('valid_from', now)
            .or(`valid_until.is.null,valid_until.gte.${now}`)
            .order('created_at', { ascending: false });

        // Filter by rank if target_rank is set
        query = query.or(`target_rank.is.null,target_rank.eq.${userRank}`);

        const { data: vouchers, error } = await query;

        if (error) throw error;

        // Get user's claimed vouchers
        const { data: claimedVouchers } = await supabase
            .from('user_vouchers')
            .select('voucher_id')
            .eq('user_id', user.id);

        const claimedIds = new Set(claimedVouchers?.map((v: { voucher_id: string }) => v.voucher_id) || []);

        // Add claimed status to each voucher
        const vouchersWithStatus = vouchers?.map((voucher: any) => ({
            ...voucher,
            is_claimed: claimedIds.has(voucher.voucher_id)
        })) || [];

        return NextResponse.json({
            vouchers: vouchersWithStatus
        });

    } catch (error: any) {
        console.error('GET /api/vouchers error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vouchers', details: error.message },
            { status: 500 }
        );
    }
}
