import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST: Approve or reject voucher (Owner only)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'vouchers', 'approve');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const body = await request.json();
        const { action, reason } = body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return errorResponse('Action phải là approve hoặc reject', 400);
        }

        const supabase = getSupabaseAdmin();

        // Check voucher exists and is pending
        const { data: voucher } = await supabase
            .from('partner_vouchers')
            .select('voucher_id, status, code, name')
            .eq('voucher_id', id)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!voucher) {
            return errorResponse('Không tìm thấy voucher', 404);
        }

        if (voucher.status !== 'pending_approval' && voucher.status !== 'draft') {
            return errorResponse(`Không thể ${action === 'approve' ? 'duyệt' : 'từ chối'} voucher ở trạng thái ${voucher.status}`, 400);
        }

        const newStatus = action === 'approve' ? 'active' : 'draft';
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('partner_vouchers')
            .update({
                status: newStatus,
                approved_by: action === 'approve' ? authResult.userId : null,
                approved_at: action === 'approve' ? now : null
            })
            .eq('voucher_id', id);

        if (error) {
            logger.error('Approve voucher error', error);
            return errorResponse('Không thể xử lý yêu cầu', 500);
        }

        // If approved, sync to main vouchers table for customer visibility
        if (action === 'approve') {
            // Get full voucher data
            const { data: fullVoucher } = await supabase
                .from('partner_vouchers')
                .select('*')
                .eq('voucher_id', id)
                .single();

            if (fullVoucher) {
                // Check if voucher code already exists
                const { data: existingVoucher } = await supabase
                    .from('vouchers')
                    .select('voucher_id')
                    .eq('code', fullVoucher.code)
                    .single();

                // Only insert if not exists
                if (!existingVoucher) {
                    await supabase.from('vouchers').insert({
                        code: fullVoucher.code,
                        name: fullVoucher.name,
                        description: fullVoucher.description,
                        discount_type: fullVoucher.discount_type,
                        discount_value: fullVoucher.discount_value,
                        min_borrow_count: 0,
                        max_discount: fullVoucher.max_discount,
                        total_quantity: fullVoucher.usage_limit || 1000,
                        used_quantity: 0,
                        start_date: fullVoucher.valid_from,
                        expiry_date: fullVoucher.valid_until || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                        target_group: 'all',
                        eco_points_cost: fullVoucher.eco_points_required || 0,
                        is_active: true
                    });
                }
            }
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: action === 'approve' ? 'approve_voucher' : 'reject_voucher',
            entity_type: 'partner_voucher',
            entity_id: id,
            new_data: { action, reason, newStatus }
        });

        logger.info(`Voucher ${voucher.code} ${action}d by ${authResult.email}`);

        return jsonResponse({
            success: true,
            voucher: {
                id,
                code: voucher.code,
                name: voucher.name,
                status: newStatus
            }
        }, action === 'approve' ? 'Đã duyệt và kích hoạt voucher' : 'Đã từ chối voucher');

    } catch (error: any) {
        logger.error('Partner Voucher Approve Error', error);
        return errorResponse(error.message, 500);
    }
}
