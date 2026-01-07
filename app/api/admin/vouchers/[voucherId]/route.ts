import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/admin/vouchers/[voucherId]
 * Cập nhật voucher (Admin only)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { voucherId: string } }
) {
    try {
        const supabase = getSupabaseAdmin();

        // Get auth token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        // Verify user with token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const voucherId = params.voucherId;
        const body = await request.json();

        // Validation for discount_type and discount_value if provided
        if (body.discount_type && !['percent', 'fixed'].includes(body.discount_type)) {
            return NextResponse.json(
                { error: 'Invalid discount_type. Must be "percent" or "fixed"' },
                { status: 400 }
            );
        }

        if (body.discount_value !== undefined && body.discount_value <= 0) {
            return NextResponse.json(
                { error: 'discount_value must be greater than 0' },
                { status: 400 }
            );
        }

        if (body.discount_type === 'percent' && body.discount_value > 100) {
            return NextResponse.json(
                { error: 'Percent discount cannot exceed 100%' },
                { status: 400 }
            );
        }

        // Update voucher
        const updateData: any = {};
        const allowedFields = [
            'name', 'description', 'discount_type', 'discount_value',
            'max_discount', 'min_order_value', 'usage_limit', 'usage_per_user',
            'valid_from', 'valid_until', 'target_rank', 'is_active'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        // Code can be updated but must be uppercase
        if (body.code) {
            updateData.code = body.code.toUpperCase();
        }

        const { data: voucher, error } = await supabase
            .from('vouchers')
            .update(updateData)
            .eq('voucher_id', voucherId)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json(
                    { error: 'Voucher code already exists' },
                    { status: 409 }
                );
            }
            throw error;
        }

        if (!voucher) {
            return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Voucher updated successfully',
            voucher
        });

    } catch (error: any) {
        console.error('PATCH /api/admin/vouchers/[voucherId] error:', error);
        return NextResponse.json(
            { error: 'Failed to update voucher', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/vouchers/[voucherId]
 * Xóa voucher (Admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { voucherId: string } }
) {
    try {
        const supabase = getSupabaseAdmin();

        // Check admin
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const voucherId = params.voucherId;

        // Check if voucher has been used
        const { data: usageCount } = await supabase
            .from('voucher_usage')
            .select('usage_id', { count: 'exact', head: true })
            .eq('voucher_id', voucherId);

        // Soft delete by setting is_active = false if used
        if (usageCount && (usageCount as any).count > 0) {
            const { data: voucher, error } = await supabase
                .from('vouchers')
                .update({ is_active: false })
                .eq('voucher_id', voucherId)
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({
                message: 'Voucher has been deactivated (has usage history)',
                voucher
            });
        }

        // Hard delete if not used
        const { error } = await supabase
            .from('vouchers')
            .delete()
            .eq('voucher_id', voucherId);

        if (error) throw error;

        return NextResponse.json({
            message: 'Voucher deleted successfully'
        });

    } catch (error: any) {
        console.error('DELETE /api/admin/vouchers/[voucherId] error:', error);
        return NextResponse.json(
            { error: 'Failed to delete voucher', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/vouchers/[voucherId]
 * Get voucher detail with usage stats
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { voucherId: string } }
) {
    try {
        const supabase = getSupabaseAdmin();

        // Check admin
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const voucherId = params.voucherId;

        // Get voucher
        const { data: voucher, error: voucherError } = await supabase
            .from('vouchers')
            .select('*')
            .eq('voucher_id', voucherId)
            .single();

        if (voucherError) throw voucherError;
        if (!voucher) {
            return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
        }

        // Get usage stats
        const { count: totalClaims } = await supabase
            .from('user_vouchers')
            .select('*', { count: 'exact', head: true })
            .eq('voucher_id', voucherId);

        const { count: totalUsage } = await supabase
            .from('voucher_usage')
            .select('*', { count: 'exact', head: true })
            .eq('voucher_id', voucherId);

        const { data: totalDiscountData } = await supabase
            .from('voucher_usage')
            .select('discount_amount')
            .eq('voucher_id', voucherId);

        const totalDiscountAmount = totalDiscountData?.reduce((sum: number, item: any) =>
            sum + parseFloat(item.discount_amount.toString()), 0
        ) || 0;

        return NextResponse.json({
            voucher,
            stats: {
                total_claims: totalClaims || 0,
                total_usage: totalUsage || 0,
                total_discount_amount: totalDiscountAmount,
                remaining_usage: voucher.usage_limit ? voucher.usage_limit - (totalUsage || 0) : null
            }
        });

    } catch (error: any) {
        console.error('GET /api/admin/vouchers/[voucherId] error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch voucher', details: error.message },
            { status: 500 }
        );
    }
}
