import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// POST: Request cleaning collection
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const { cupCount, notes, branchId, priority } = body;

        const targetBranchId = branchId || authResult.branchId;
        if (!targetBranchId) {
            return errorResponse('Chi nhánh là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Verify branch
        const { data: branch } = await supabase
            .from('partner_branches')
            .select('branch_id, name, current_dirty_cups, store_id')
            .eq('branch_id', targetBranchId)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!branch) {
            return errorResponse('Chi nhánh không hợp lệ', 404);
        }

        const actualCupCount = cupCount || branch.current_dirty_cups;

        if (actualCupCount < 1) {
            return errorResponse('Không có ly bẩn để thu gom', 400);
        }

        // Check if there's already a pending/requested queue item
        const { data: existingQueue } = await supabase
            .from('cleaning_queue')
            .select('queue_id, status')
            .eq('branch_id', targetBranchId)
            .in('status', ['pending', 'requested'])
            .single();

        if (existingQueue) {
            return errorResponse('Đã có yêu cầu thu gom đang chờ xử lý', 400);
        }

        // Create cleaning queue entry
        const { data: queueEntry, error: queueError } = await supabase
            .from('cleaning_queue')
            .insert({
                branch_id: targetBranchId,
                cup_count: actualCupCount,
                status: 'requested',
                requested_at: new Date().toISOString(),
                requested_by: authResult.userId,
                notes: notes || `Yêu cầu thu gom ${actualCupCount} ly bẩn`
            })
            .select()
            .single();

        if (queueError) {
            logger.error('Create cleaning queue error', queueError);
            return errorResponse('Không thể tạo yêu cầu thu gom', 500);
        }

        // Create cleaning job for admin
        await supabase.from('cleaning_jobs').insert({
            store_id: branch.store_id,
            cup_count: actualCupCount,
            status: 'pending',
            priority: priority || 'normal',
            notes: `Yêu cầu từ chi nhánh ${branch.name}`
        });

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            branch_id: targetBranchId,
            action: 'request_cleaning',
            entity_type: 'cleaning_queue',
            entity_id: queueEntry.queue_id,
            new_data: { cupCount: actualCupCount, branchName: branch.name }
        });

        // Create notification for admin
        await supabase.from('system_notifications').insert({
            type: 'info',
            title: 'Yêu cầu thu gom ly bẩn',
            message: `Chi nhánh ${branch.name} yêu cầu thu gom ${actualCupCount} ly bẩn`,
            target_audience: 'all',
            priority: priority === 'urgent' ? 10 : 5,
            is_active: true
        });

        logger.info(`Cleaning request: ${actualCupCount} cups from ${branch.name} by ${authResult.email}`);

        return jsonResponse({
            success: true,
            queueId: queueEntry.queue_id,
            cupCount: actualCupCount,
            status: 'requested',
            message: `Đã gửi yêu cầu thu gom ${actualCupCount} ly bẩn. Đang chờ điều phối.`
        });

    } catch (error: any) {
        logger.error('Partner Cleaning Request Error', error);
        return errorResponse(error.message, 500);
    }
}
