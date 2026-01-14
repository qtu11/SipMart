import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// POST: Staff scans QR to confirm return
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'scanner', 'return');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const body = await request.json();
        const { cupId, condition, notes, branchId } = body;

        if (!cupId) {
            return errorResponse('Mã ly là bắt buộc', 400);
        }

        if (!condition || !['clean', 'dirty', 'damaged'].includes(condition)) {
            return errorResponse('Tình trạng phải là: clean, dirty, hoặc damaged', 400);
        }

        const targetBranchId = branchId || authResult.branchId;
        if (!targetBranchId) {
            return errorResponse('Chi nhánh là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Verify branch
        const { data: branch } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id, name, accepts_return, current_clean_cups, current_dirty_cups')
            .eq('branch_id', targetBranchId)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!branch) {
            return errorResponse('Chi nhánh không hợp lệ', 404);
        }

        if (!branch.accepts_return) {
            return errorResponse('Chi nhánh này không hỗ trợ trả ly', 400);
        }

        // Check cup and get active transaction
        const { data: cup } = await supabase
            .from('cups')
            .select('cup_id, status, current_user_id, current_transaction_id')
            .eq('cup_id', cupId)
            .single();

        if (!cup) {
            return errorResponse('Không tìm thấy ly này', 404);
        }

        if (cup.status !== 'in_use') {
            return errorResponse(`Ly đang ở trạng thái: ${cup.status}. Không thể trả.`, 400);
        }

        if (!cup.current_transaction_id) {
            return errorResponse('Không tìm thấy giao dịch mượn của ly này', 400);
        }

        // Get transaction
        const { data: transaction } = await supabase
            .from('transactions')
            .select('transaction_id, user_id, deposit_amount, due_time, borrow_time')
            .eq('transaction_id', cup.current_transaction_id)
            .single();

        if (!transaction) {
            return errorResponse('Không tìm thấy giao dịch', 404);
        }

        // Calculate refund and points
        const now = new Date();
        const dueTime = new Date(transaction.due_time);
        const borrowTime = new Date(transaction.borrow_time);
        const isOverdue = now > dueTime;
        const hoursOverdue = isOverdue ? Math.ceil((now.getTime() - dueTime.getTime()) / (1000 * 60 * 60)) : 0;

        let refundAmount = Number(transaction.deposit_amount);
        let penaltyAmount = 0;
        let greenPoints = 10; // Base points

        // Apply penalties for overdue
        if (isOverdue) {
            penaltyAmount = Math.min(hoursOverdue * 2000, refundAmount * 0.5); // Max 50% penalty
            refundAmount -= penaltyAmount;
            greenPoints = Math.max(0, greenPoints - hoursOverdue);
        }

        // Apply penalty for damaged
        if (condition === 'damaged') {
            const damagePenalty = refundAmount * 0.3; // 30% penalty
            penaltyAmount += damagePenalty;
            refundAmount -= damagePenalty;
            greenPoints = 0;
        }

        // Bonus points for early return (within 6 hours)
        const hoursUsed = (now.getTime() - borrowTime.getTime()) / (1000 * 60 * 60);
        if (hoursUsed <= 6 && !isOverdue && condition !== 'damaged') {
            greenPoints += 5; // Early return bonus
        }

        // Get user
        const { data: user } = await supabase
            .from('users')
            .select('user_id, display_name, wallet_balance, green_points, total_cups_saved')
            .eq('user_id', transaction.user_id)
            .single();

        if (!user) {
            return errorResponse('Không tìm thấy người dùng', 404);
        }

        // Update transaction
        await supabase
            .from('transactions')
            .update({
                return_store_id: branch.store_id,
                return_time: now.toISOString(),
                status: 'completed',
                refund_amount: refundAmount,
                green_points_earned: greenPoints,
                is_overdue: isOverdue,
                overdue_hours: hoursOverdue
            })
            .eq('transaction_id', transaction.transaction_id);

        // Update cup status
        const cupStatus = condition === 'damaged' ? 'broken' : 'cleaning';
        await supabase
            .from('cups')
            .update({
                status: cupStatus,
                current_user_id: null,
                current_transaction_id: null,
                current_store_id: branch.store_id,
                last_cleaned_at: condition === 'clean' ? now.toISOString() : undefined,
                total_uses: cup.current_user_id ? supabase.rpc('increment', { x: 1 }) : undefined
            })
            .eq('cup_id', cupId);

        // Refund to wallet
        const newBalance = Number(user.wallet_balance) + refundAmount;
        const newPoints = (user.green_points || 0) + greenPoints;
        const newCupsSaved = (user.total_cups_saved || 0) + 1;

        await supabase
            .from('users')
            .update({
                wallet_balance: newBalance,
                green_points: newPoints,
                total_cups_saved: newCupsSaved,
                last_activity: now.toISOString()
            })
            .eq('user_id', transaction.user_id);

        // Create wallet transaction
        await supabase.from('wallet_transactions').insert({
            user_id: transaction.user_id,
            type: 'return_deposit',
            amount: refundAmount,
            balance_after: newBalance,
            description: `Hoàn cọc trả ly ${cupId} tại ${branch.name}${penaltyAmount > 0 ? ` (trừ ${penaltyAmount.toLocaleString()}đ phí)` : ''}`,
            metadata: {
                transaction_id: transaction.transaction_id,
                cup_id: cupId,
                penalty: penaltyAmount,
                condition
            }
        });

        // Create eco points transaction
        if (greenPoints > 0) {
            await supabase.from('eco_points_transactions').insert({
                user_id: transaction.user_id,
                amount: greenPoints,
                type: isOverdue ? 'earn_return' : (hoursUsed <= 6 ? 'earn_early_return' : 'earn_return'),
                reference_id: transaction.transaction_id,
                description: `Trả ly tại ${branch.name}`,
                balance_after: newPoints
            });
        }

        // Update branch inventory
        const inventoryUpdate: any = {};
        if (condition === 'clean') {
            inventoryUpdate.current_clean_cups = (branch.current_clean_cups || 0) + 1;
        } else if (condition === 'dirty') {
            inventoryUpdate.current_dirty_cups = (branch.current_dirty_cups || 0) + 1;
        }

        if (Object.keys(inventoryUpdate).length > 0) {
            await supabase
                .from('partner_branches')
                .update(inventoryUpdate)
                .eq('branch_id', targetBranchId);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            branch_id: targetBranchId,
            action: 'scan_return',
            entity_type: 'transaction',
            entity_id: transaction.transaction_id,
            new_data: {
                cupId,
                userId: transaction.user_id,
                condition,
                refundAmount,
                greenPoints,
                isOverdue
            }
        });

        // Send notification to user
        await supabase.from('notifications').insert({
            user_id: transaction.user_id,
            type: 'success',
            title: 'Trả ly thành công',
            message: `Bạn đã trả ly ${cupId}. Hoàn cọc: ${refundAmount.toLocaleString()}đ. Điểm xanh: +${greenPoints}`,
            data: {
                transaction_id: transaction.transaction_id,
                refund: refundAmount,
                points: greenPoints
            }
        });

        logger.info(`Return scan: ${cupId} at ${branch.name}, condition: ${condition}, refund: ${refundAmount}`);

        return jsonResponse({
            success: true,
            transaction: {
                id: transaction.transaction_id,
                cupId,
                condition,
                refundAmount,
                penaltyAmount,
                greenPoints,
                isOverdue,
                hoursOverdue
            },
            user: {
                id: user.user_id,
                name: user.display_name,
                newBalance,
                newPoints,
                totalCupsSaved: newCupsSaved
            },
            message: penaltyAmount > 0
                ? `Đã xác nhận trả ly. Hoàn ${refundAmount.toLocaleString()}đ (trừ phí ${penaltyAmount.toLocaleString()}đ)`
                : `Đã xác nhận trả ly. Hoàn ${refundAmount.toLocaleString()}đ, +${greenPoints} điểm xanh`
        });

    } catch (error: any) {
        logger.error('Partner Scanner Return Error', error);
        return errorResponse(error.message, 500);
    }
}
