import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// POST: Request additional cups from admin
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'inventory', 'request_cups');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const body = await request.json();
        const { quantity, priority, notes, branchId } = body;

        if (!quantity || quantity < 1) {
            return errorResponse('Số lượng phải lớn hơn 0', 400);
        }

        const targetBranchId = branchId || authResult.branchId;
        if (!targetBranchId) {
            return errorResponse('Chi nhánh là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Verify branch
        const { data: branch } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id, name')
            .eq('branch_id', targetBranchId)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!branch) {
            return errorResponse('Chi nhánh không hợp lệ', 400);
        }

        // Create redistribution order (request cups from central hub to store)
        const { data: order, error: orderError } = await supabase
            .from('redistribution_orders')
            .insert({
                from_store_id: null, // From central hub
                to_store_id: branch.store_id,
                cup_count: quantity,
                status: 'pending',
                priority: priority || 'medium',
                notes: notes || `Yêu cầu cấp ${quantity} ly cho chi nhánh ${branch.name}`
            })
            .select()
            .single();

        if (orderError) {
            logger.error('Create redistribution order error', orderError);
            return errorResponse('Không thể tạo yêu cầu', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            branch_id: targetBranchId,
            action: 'request_cups',
            entity_type: 'redistribution_order',
            entity_id: order.order_id,
            new_data: { quantity, priority, branchName: branch.name }
        });

        // Create notification for admin
        await supabase.from('system_notifications').insert({
            type: 'info',
            title: 'Yêu cầu cấp ly mới',
            message: `Chi nhánh ${branch.name} yêu cầu ${quantity} ly. Độ ưu tiên: ${priority || 'medium'}`,
            target_audience: 'all',
            priority: priority === 'urgent' ? 10 : 5,
            is_active: true
        });

        logger.info(`Cup request: ${quantity} cups for ${branch.name} by ${authResult.email}`);

        return jsonResponse({
            success: true,
            orderId: order.order_id,
            quantity,
            status: 'pending',
            message: `Đã gửi yêu cầu cấp ${quantity} ly. Đang chờ Admin xử lý.`
        });

    } catch (error: any) {
        logger.error('Partner Request Cups Error', error);
        return errorResponse(error.message, 500);
    }
}
