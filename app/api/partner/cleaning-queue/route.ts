export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get cleaning queue status for branch
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branch_id') || authResult.branchId;

        if (!branchId) {
            return errorResponse('Chi nhánh là bắt buộc', 400);
        }

        // Verify branch belongs to partner
        const { data: branch } = await supabase
            .from('partner_branches')
            .select('branch_id, name, current_dirty_cups, cup_capacity')
            .eq('branch_id', branchId)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!branch) {
            return errorResponse('Chi nhánh không hợp lệ', 404);
        }

        // Get cleaning queue entries
        const { data: queueItems } = await supabase
            .from('cleaning_queue')
            .select(`
                queue_id,
                cup_count,
                status,
                requested_at,
                scheduled_pickup,
                completed_at,
                notes,
                partner_users!requested_by (
                    display_name
                )
            `)
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false })
            .limit(10);

        // Calculate stats
        const pendingItems = queueItems?.filter(q => q.status === 'pending') || [];
        const requestedItems = queueItems?.filter(q => q.status === 'requested') || [];
        const scheduledItems = queueItems?.filter(q => q.status === 'scheduled') || [];

        const totalPending = pendingItems.reduce((sum, q) => sum + (q.cup_count || 0), 0);
        const totalRequested = requestedItems.reduce((sum, q) => sum + (q.cup_count || 0), 0);

        return jsonResponse({
            branch: {
                id: branch.branch_id,
                name: branch.name,
                currentDirtyCups: branch.current_dirty_cups,
                capacity: branch.cup_capacity
            },
            stats: {
                totalDirty: branch.current_dirty_cups,
                pendingCollection: totalPending,
                awaitingPickup: totalRequested,
                threshold: 30, // Threshold for alert
                needsCollection: branch.current_dirty_cups >= 30
            },
            queue: queueItems?.map(q => ({
                id: q.queue_id,
                cupCount: q.cup_count,
                status: q.status,
                requestedAt: q.requested_at,
                scheduledPickup: q.scheduled_pickup,
                completedAt: q.completed_at,
                notes: q.notes,
                requestedBy: (q.partner_users as any)?.display_name
            })) || [],
            nextScheduledPickup: scheduledItems[0]?.scheduled_pickup || null
        });

    } catch (error: any) {
        logger.error('Partner Cleaning Queue GET Error', error);
        return errorResponse(error.message, 500);
    }
}
