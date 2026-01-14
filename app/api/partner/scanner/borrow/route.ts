import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// POST: Staff scans QR to confirm borrow
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'scanner', 'borrow');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const body = await request.json();
        const { cupId, userId, branchId } = body;

        if (!cupId) {
            return errorResponse('Mã ly là bắt buộc', 400);
        }

        if (!userId) {
            return errorResponse('Mã người dùng là bắt buộc', 400);
        }

        const targetBranchId = branchId || authResult.branchId;
        if (!targetBranchId) {
            return errorResponse('Chi nhánh là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Verify branch
        const { data: branch } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id, name, accepts_borrow')
            .eq('branch_id', targetBranchId)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!branch) {
            return errorResponse('Chi nhánh không hợp lệ', 404);
        }

        if (!branch.accepts_borrow) {
            return errorResponse('Chi nhánh này không hỗ trợ mượn ly', 400);
        }

        // Check cup exists and is available
        const { data: cup, error: cupError } = await supabase
            .from('cups')
            .select('cup_id, status, current_store_id')
            .eq('cup_id', cupId)
            .single();

        if (cupError || !cup) {
            return errorResponse('Không tìm thấy ly này', 404);
        }

        if (cup.status !== 'available') {
            return errorResponse(`Ly đang ở trạng thái: ${cup.status}. Không thể mượn.`, 400);
        }

        // Check user exists and has sufficient balance
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_id, display_name, wallet_balance, is_blacklisted')
            .eq('user_id', userId)
            .single();

        if (userError || !user) {
            return errorResponse('Không tìm thấy người dùng', 404);
        }

        if (user.is_blacklisted) {
            return errorResponse('Người dùng đã bị khóa tài khoản', 403);
        }

        const depositAmount = 30000; // Default deposit
        if (Number(user.wallet_balance) < depositAmount) {
            return errorResponse(`Số dư ví không đủ. Cần ít nhất ${depositAmount.toLocaleString()}đ`, 400);
        }

        // Calculate due time (24 hours from now)
        const borrowTime = new Date();
        const dueTime = new Date(borrowTime.getTime() + 24 * 60 * 60 * 1000);

        // Create transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                cup_id: cupId,
                borrow_store_id: branch.store_id,
                borrow_time: borrowTime.toISOString(),
                due_time: dueTime.toISOString(),
                status: 'ongoing',
                deposit_amount: depositAmount,
                is_overdue: false
            })
            .select()
            .single();

        if (txError) {
            logger.error('Create transaction error', txError);
            return errorResponse('Không thể tạo giao dịch', 500);
        }

        // Update cup status
        await supabase
            .from('cups')
            .update({
                status: 'in_use',
                current_user_id: userId,
                current_transaction_id: transaction.transaction_id,
                current_store_id: null
            })
            .eq('cup_id', cupId);

        // Deduct deposit from wallet
        const newBalance = Number(user.wallet_balance) - depositAmount;
        await supabase
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('user_id', userId);

        // Create wallet transaction
        await supabase.from('wallet_transactions').insert({
            user_id: userId,
            type: 'borrow_fee',
            amount: -depositAmount,
            balance_after: newBalance,
            description: `Đặt cọc mượn ly ${cupId} tại ${branch.name}`,
            metadata: { transaction_id: transaction.transaction_id, cup_id: cupId }
        });

        // Update branch inventory
        await supabase
            .from('partner_branches')
            .update({
                current_clean_cups: branch.store_id ?
                    supabase.rpc('decrement', { x: 1 }) : undefined
            })
            .eq('branch_id', targetBranchId);

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            branch_id: targetBranchId,
            action: 'scan_borrow',
            entity_type: 'transaction',
            entity_id: transaction.transaction_id,
            new_data: { cupId, userId, userName: user.display_name, depositAmount }
        });

        // Send notification to user
        await supabase.from('notifications').insert({
            user_id: userId,
            type: 'success',
            title: 'Mượn ly thành công',
            message: `Bạn đã mượn ly ${cupId} tại ${branch.name}. Vui lòng trả trước ${dueTime.toLocaleString('vi-VN')}`,
            data: { transaction_id: transaction.transaction_id }
        });

        logger.info(`Borrow scan: ${cupId} by user ${userId} at ${branch.name}`);

        return jsonResponse({
            success: true,
            transaction: {
                id: transaction.transaction_id,
                cupId,
                depositAmount,
                borrowTime: borrowTime.toISOString(),
                dueTime: dueTime.toISOString()
            },
            user: {
                id: user.user_id,
                name: user.display_name,
                newBalance
            },
            message: `Đã xác nhận mượn ly ${cupId} cho ${user.display_name}`
        });

    } catch (error: any) {
        logger.error('Partner Scanner Borrow Error', error);
        return errorResponse(error.message, 500);
    }
}
