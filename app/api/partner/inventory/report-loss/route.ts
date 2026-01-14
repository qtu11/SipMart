import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// POST: Report lost/damaged cups
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'inventory', 'report_loss');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const body = await request.json();
        const { cupIds, reason, notes, branchId } = body;

        if (!cupIds || !Array.isArray(cupIds) || cupIds.length === 0) {
            return errorResponse('Danh sách ly là bắt buộc', 400);
        }

        if (!reason || !['lost', 'damaged', 'broken'].includes(reason)) {
            return errorResponse('Lý do phải là: lost, damaged, hoặc broken', 400);
        }

        const targetBranchId = branchId || authResult.branchId;
        if (!targetBranchId) {
            return errorResponse('Chi nhánh là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Verify branch belongs to partner
        const { data: branch } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id, name')
            .eq('branch_id', targetBranchId)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!branch) {
            return errorResponse('Chi nhánh không hợp lệ', 400);
        }

        // Update cup statuses
        const newStatus = reason === 'lost' ? 'lost' : 'broken';
        const { data: updatedCups, error: updateError } = await supabase
            .from('cups')
            .update({
                status: newStatus,
                retirement_reason: `${reason}: ${notes || 'Không có ghi chú'}`
            })
            .in('cup_id', cupIds)
            .select('cup_id');

        if (updateError) {
            logger.error('Update cups error', updateError);
            return errorResponse('Không thể cập nhật trạng thái ly', 500);
        }

        // Create incident for tracking
        for (const cupId of cupIds) {
            await supabase.from('incidents').insert({
                type: reason,
                cup_id: cupId,
                store_id: branch.store_id,
                description: notes || `Ly ${cupId} được báo cáo ${reason}`,
                status: 'open',
                priority: 'medium'
            });
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            branch_id: targetBranchId,
            action: 'report_loss',
            entity_type: 'cups',
            new_data: { cupIds, reason, notes, count: cupIds.length }
        });

        logger.info(`Loss reported: ${cupIds.length} cups (${reason}) at ${branch.name} by ${authResult.email}`);

        return jsonResponse({
            success: true,
            reported: updatedCups?.length || 0,
            reason,
            message: `Đã báo cáo ${updatedCups?.length || 0} ly ${reason === 'lost' ? 'mất' : 'hỏng'}`
        });

    } catch (error: any) {
        logger.error('Partner Report Loss Error', error);
        return errorResponse(error.message, 500);
    }
}
