import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: List partner's vouchers
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'vouchers', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const branchId = searchParams.get('branch_id');

        let query = supabase
            .from('partner_vouchers')
            .select(`
                voucher_id,
                code,
                name,
                description,
                discount_type,
                discount_value,
                min_order_value,
                max_discount,
                usage_limit,
                usage_count,
                per_user_limit,
                valid_from,
                valid_until,
                requires_eco_cup,
                eco_points_required,
                status,
                approved_at,
                created_at,
                partner_branches (
                    branch_id,
                    name
                ),
                partner_users!created_by (
                    display_name
                )
            `)
            .eq('partner_id', authResult.partnerId);

        if (status) {
            query = query.eq('status', status);
        }

        if (branchId) {
            query = query.eq('branch_id', branchId);
        }

        const { data: vouchers, error } = await query.order('created_at', { ascending: false });

        if (error) {
            logger.error('Get partner vouchers error', error);
            return errorResponse('Không thể lấy danh sách voucher', 500);
        }

        const transformedVouchers = vouchers?.map(v => ({
            id: v.voucher_id,
            code: v.code,
            name: v.name,
            description: v.description,
            discountType: v.discount_type,
            discountValue: v.discount_value,
            minOrderValue: v.min_order_value,
            maxDiscount: v.max_discount,
            usageLimit: v.usage_limit,
            usageCount: v.usage_count,
            perUserLimit: v.per_user_limit,
            validFrom: v.valid_from,
            validUntil: v.valid_until,
            requiresEcoCup: v.requires_eco_cup,
            ecoPointsRequired: v.eco_points_required,
            status: v.status,
            approvedAt: v.approved_at,
            createdAt: v.created_at,
            branch: v.partner_branches ? {
                id: (v.partner_branches as any).branch_id,
                name: (v.partner_branches as any).name
            } : null,
            createdBy: (v.partner_users as any)?.display_name
        })) || [];

        return jsonResponse({
            vouchers: transformedVouchers,
            total: transformedVouchers.length
        });

    } catch (error: any) {
        logger.error('Partner Vouchers GET Error', error);
        return errorResponse(error.message, 500);
    }
}

// POST: Create new voucher (draft status)
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'vouchers', 'create');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const body = await request.json();
        const {
            code,
            name,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            usageLimit,
            perUserLimit,
            validFrom,
            validUntil,
            requiresEcoCup,
            ecoPointsRequired,
            branchId
        } = body;

        if (!code || !name || !discountType || discountValue === undefined) {
            return errorResponse('Mã, tên, loại giảm giá và giá trị là bắt buộc', 400);
        }

        if (!['percent', 'fixed', 'free_item'].includes(discountType)) {
            return errorResponse('Loại giảm giá không hợp lệ', 400);
        }

        const supabase = getSupabaseAdmin();

        // Check code uniqueness
        const { data: existing } = await supabase
            .from('partner_vouchers')
            .select('voucher_id')
            .eq('partner_id', authResult.partnerId)
            .eq('code', code.toUpperCase())
            .single();

        if (existing) {
            return errorResponse('Mã voucher đã tồn tại', 400);
        }

        // Create voucher
        const { data: voucher, error: createError } = await supabase
            .from('partner_vouchers')
            .insert({
                partner_id: authResult.partnerId,
                branch_id: branchId || null,
                code: code.toUpperCase(),
                name,
                description: description || null,
                discount_type: discountType,
                discount_value: discountValue,
                min_order_value: minOrderValue || 0,
                max_discount: maxDiscount || null,
                usage_limit: usageLimit || null,
                usage_count: 0,
                per_user_limit: perUserLimit || 1,
                valid_from: validFrom || new Date().toISOString(),
                valid_until: validUntil || null,
                requires_eco_cup: requiresEcoCup !== false,
                eco_points_required: ecoPointsRequired || 0,
                status: 'draft',
                created_by: authResult.userId
            })
            .select()
            .single();

        if (createError) {
            logger.error('Create partner voucher error', createError);
            return errorResponse('Không thể tạo voucher', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'create_voucher',
            entity_type: 'partner_voucher',
            entity_id: voucher.voucher_id,
            new_data: { code, name, discountType, discountValue }
        });

        logger.info(`Partner voucher created: ${code} by ${authResult.email}`);

        return jsonResponse({
            success: true,
            voucher: {
                id: voucher.voucher_id,
                code: voucher.code,
                name: voucher.name,
                status: voucher.status
            }
        }, 'Tạo voucher thành công');

    } catch (error: any) {
        logger.error('Partner Vouchers POST Error', error);
        return errorResponse(error.message, 500);
    }
}
