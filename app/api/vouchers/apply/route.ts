import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/vouchers/apply
 * Apply voucher để tính discount (for rewards redemption)
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
        const { voucher_code, order_amount, order_type = 'reward_claim', order_id } = body;

        if (!voucher_code || !order_amount) {
            return NextResponse.json(
                { error: 'Missing required fields: voucher_code, order_amount' },
                { status: 400 }
            );
        }

        if (order_amount <= 0) {
            return NextResponse.json(
                { error: 'Order amount must be greater than 0' },
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

        if (now < validFrom || (validUntil && now > validUntil)) {
            return NextResponse.json(
                { error: 'Voucher is not valid' },
                { status: 400 }
            );
        }

        // Check min order value
        if (order_amount < voucher.min_order_value) {
            return NextResponse.json(
                { error: `Minimum order value is ${voucher.min_order_value}` },
                { status: 400 }
            );
        }

        // Check if user claimed this voucher
        const { data: userVoucher } = await supabase
            .from('user_vouchers')
            .select('id')
            .eq('user_id', user.id)
            .eq('voucher_id', voucher.voucher_id)
            .single();

        if (!userVoucher) {
            return NextResponse.json(
                { error: 'You haven\'t claimed this voucher yet' },
                { status: 403 }
            );
        }

        // Check usage_per_user
        const { count: usageCount } = await supabase
            .from('voucher_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('voucher_id', voucher.voucher_id);

        if (usageCount && usageCount >= voucher.usage_per_user) {
            return NextResponse.json(
                { error: 'You have reached the usage limit for this voucher' },
                { status: 400 }
            );
        }

        // Calculate discount
        let discountAmount = 0;
        if (voucher.discount_type === 'percent') {
            discountAmount = (order_amount * voucher.discount_value) / 100;
            if (voucher.max_discount && discountAmount > voucher.max_discount) {
                discountAmount = voucher.max_discount;
            }
        } else if (voucher.discount_type === 'fixed') {
            discountAmount = voucher.discount_value;
        }

        // Ensure discount doesn't exceed order amount
        if (discountAmount > order_amount) {
            discountAmount = order_amount;
        }

        const finalAmount = order_amount - discountAmount;

        // Record usage
        const { data: usage, error: usageError } = await supabase
            .from('voucher_usage')
            .insert({
                voucher_id: voucher.voucher_id,
                user_id: user.id,
                order_id,
                order_type,
                original_amount: order_amount,
                discount_amount: discountAmount,
                final_amount: finalAmount
            })
            .select()
            .single();

        if (usageError) throw usageError;

        return NextResponse.json({
            message: 'Voucher applied successfully',
            voucher: {
                code: voucher.code,
                name: voucher.name,
                discount_type: voucher.discount_type,
                discount_value: voucher.discount_value
            },
            calculation: {
                original_amount: order_amount,
                discount_amount: discountAmount,
                final_amount: finalAmount
            },
            usage
        });

    } catch (error: any) {
        console.error('POST /api/vouchers/apply error:', error);
        return NextResponse.json(
            { error: 'Failed to apply voucher', details: error.message },
            { status: 500 }
        );
    }
}
