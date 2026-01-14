import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get voucher detail
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'vouchers', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        const { data: voucher, error } = await supabase
            .from('partner_vouchers')
            .select(`
                *,
                partner_branches (branch_id, name),
                partner_users!created_by (display_name)
            `)
            .eq('voucher_id', id)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (error || !voucher) {
            return errorResponse('Không tìm thấy voucher', 404);
        }

        return jsonResponse({
            id: voucher.voucher_id,
            code: voucher.code,
            name: voucher.name,
            description: voucher.description,
            discountType: voucher.discount_type,
            discountValue: voucher.discount_value,
            minOrderValue: voucher.min_order_value,
            maxDiscount: voucher.max_discount,
            usageLimit: voucher.usage_limit,
            usageCount: voucher.usage_count,
            perUserLimit: voucher.per_user_limit,
            validFrom: voucher.valid_from,
            validUntil: voucher.valid_until,
            requiresEcoCup: voucher.requires_eco_cup,
            ecoPointsRequired: voucher.eco_points_required,
            status: voucher.status,
            approvedAt: voucher.approved_at,
            createdAt: voucher.created_at,
            branch: voucher.partner_branches,
            createdBy: (voucher.partner_users as any)?.display_name
        });

    } catch (error: any) {
        logger.error('Partner Voucher GET Error', error);
        return errorResponse(error.message, 500);
    }
}

// PATCH: Update voucher (draft only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'vouchers', 'update');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        // Check voucher exists and is draft
        const { data: existing } = await supabase
            .from('partner_vouchers')
            .select('voucher_id, status')
            .eq('voucher_id', id)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!existing) {
            return errorResponse('Không tìm thấy voucher', 404);
        }

        if (existing.status !== 'draft') {
            return errorResponse('Chỉ có thể chỉnh sửa voucher ở trạng thái draft', 400);
        }

        const body = await request.json();
        const updateData: any = {};

        const allowedFields = [
            'name', 'description', 'discount_type', 'discount_value',
            'min_order_value', 'max_discount', 'usage_limit', 'per_user_limit',
            'valid_from', 'valid_until', 'requires_eco_cup', 'eco_points_required'
        ];

        // Map camelCase to snake_case
        const fieldMap: Record<string, string> = {
            discountType: 'discount_type',
            discountValue: 'discount_value',
            minOrderValue: 'min_order_value',
            maxDiscount: 'max_discount',
            usageLimit: 'usage_limit',
            perUserLimit: 'per_user_limit',
            validFrom: 'valid_from',
            validUntil: 'valid_until',
            requiresEcoCup: 'requires_eco_cup',
            ecoPointsRequired: 'eco_points_required'
        };

        Object.entries(body).forEach(([key, value]) => {
            const dbField = fieldMap[key] || key;
            if (allowedFields.includes(dbField) && value !== undefined) {
                updateData[dbField] = value;
            }
        });

        const { data: updated, error } = await supabase
            .from('partner_vouchers')
            .update(updateData)
            .eq('voucher_id', id)
            .select()
            .single();

        if (error) {
            logger.error('Update partner voucher error', error);
            return errorResponse('Không thể cập nhật voucher', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'update_voucher',
            entity_type: 'partner_voucher',
            entity_id: id,
            new_data: updateData
        });

        return jsonResponse({
            success: true,
            voucher: {
                id: updated.voucher_id,
                code: updated.code,
                name: updated.name,
                status: updated.status
            }
        }, 'Cập nhật voucher thành công');

    } catch (error: any) {
        logger.error('Partner Voucher PATCH Error', error);
        return errorResponse(error.message, 500);
    }
}

// DELETE: Delete voucher (draft only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'vouchers', 'delete');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        // Check voucher exists and is draft
        const { data: existing } = await supabase
            .from('partner_vouchers')
            .select('voucher_id, status, code')
            .eq('voucher_id', id)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!existing) {
            return errorResponse('Không tìm thấy voucher', 404);
        }

        if (existing.status !== 'draft') {
            return errorResponse('Chỉ có thể xóa voucher ở trạng thái draft', 400);
        }

        const { error } = await supabase
            .from('partner_vouchers')
            .delete()
            .eq('voucher_id', id);

        if (error) {
            logger.error('Delete partner voucher error', error);
            return errorResponse('Không thể xóa voucher', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'delete_voucher',
            entity_type: 'partner_voucher',
            entity_id: id,
            old_data: { code: existing.code }
        });

        return jsonResponse({ success: true }, 'Đã xóa voucher');

    } catch (error: any) {
        logger.error('Partner Voucher DELETE Error', error);
        return errorResponse(error.message, 500);
    }
}
