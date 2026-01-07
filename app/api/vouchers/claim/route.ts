import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/vouchers/claim
 * Claim voucher cho user
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { voucher_code } = body;

        if (!voucher_code) {
            return NextResponse.json(
                { error: 'Missing voucher_code' },
                { status: 400 }
            );
        }

        // Get voucher
        const { data: voucher, error: voucherError } = await supabase
            .from('vouchers')
            .select('*')
            .eq('code', voucher_code.toUpperCase())
            .single();

        if (voucherError || !voucher) {
            return NextResponse.json(
                { error: 'Voucher not found' },
                { status: 404 }
            );
        }

        // Check if voucher is active
        if (!voucher.is_active) {
            return NextResponse.json(
                { error: 'Voucher is not active' },
                { status: 400 }
            );
        }

        // Check validity dates
        const now = new Date();
        const validFrom = new Date(voucher.valid_from);
        const validUntil = voucher.valid_until ? new Date(voucher.valid_until) : null;

        if (now < validFrom) {
            return NextResponse.json(
                { error: 'Voucher is not yet valid' },
                { status: 400 }
            );
        }

        if (validUntil && now > validUntil) {
            return NextResponse.json(
                { error: 'Voucher has expired' },
                { status: 400 }
            );
        }

        // Check user rank if target_rank is set
        if (voucher.target_rank) {
            const { data: userData } = await supabase
                .from('users')
                .select('rank')
                .eq('user_id', user.id)
                .single();

            if (userData?.rank !== voucher.target_rank) {
                return NextResponse.json(
                    { error: `This voucher is only for ${voucher.target_rank} rank` },
                    { status: 403 }
                );
            }
        }

        // Check if user already claimed
        const { data: existingClaim } = await supabase
            .from('user_vouchers')
            .select('id')
            .eq('user_id', user.id)
            .eq('voucher_id', voucher.voucher_id)
            .single();

        if (existingClaim) {
            return NextResponse.json(
                { error: 'You have already claimed this voucher' },
                { status: 409 }
            );
        }

        // Check usage limit
        if (voucher.usage_limit) {
            const { count: totalClaims } = await supabase
                .from('user_vouchers')
                .select('*', { count: 'exact', head: true })
                .eq('voucher_id', voucher.voucher_id);

            if (totalClaims && totalClaims >= voucher.usage_limit) {
                return NextResponse.json(
                    { error: 'Voucher usage limit reached' },
                    { status: 400 }
                );
            }
        }

        // Claim voucher
        const { data: claim, error: claimError } = await supabase
            .from('user_vouchers')
            .insert({
                user_id: user.id,
                voucher_id: voucher.voucher_id
            })
            .select()
            .single();

        if (claimError) throw claimError;

        return NextResponse.json({
            message: 'Voucher claimed successfully',
            claim,
            voucher
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST /api/vouchers/claim error:', error);
        return NextResponse.json(
            { error: 'Failed to claim voucher', details: error.message },
            { status: 500 }
        );
    }
}
