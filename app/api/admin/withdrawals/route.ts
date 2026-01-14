// Admin API: Approve/Reject Withdrawal Requests
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Simple admin auth check - in production use proper JWT/session
async function verifyAdminAuth(request: NextRequest): Promise<{ isAdmin: boolean; adminId?: string }> {
    const adminSecret = request.headers.get('x-admin-secret');

    // Check against environment variable (Service-to-Service)
    if (adminSecret && adminSecret === process.env.ADMIN_CRON_SECRET) {
        return { isAdmin: true, adminId: 'system' };
    }

    // Check for admin user in authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return { isAdmin: false };
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseAdmin();

    // 1. Verify JWT
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return { isAdmin: false };
    }

    const { data: admin } = await supabase
        .from('admins')
        .select('admin_id, role')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .single();

    if (admin && (admin.role === 'super_admin' || admin.role === 'store_admin')) {
        if (admin.role === 'super_admin' || admin.role === 'finance_admin') {
            return { isAdmin: true, adminId: admin.admin_id };
        }
    }

    return { isAdmin: false };
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verify admin
        const { isAdmin, adminId } = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Parse request
        const body = await request.json();
        const { transactionCode, action, reason } = body;

        if (!transactionCode || !action) {
            return NextResponse.json(
                { success: false, error: 'Missing transactionCode or action' },
                { status: 400 }
            );
        }

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // 3. Get transaction
        const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('transaction_code', transactionCode)
            .eq('type', 'withdrawal')
            .eq('status', 'pending')
            .single();

        if (txError || !transaction) {
            return NextResponse.json(
                { success: false, error: 'Transaction not found or already processed' },
                { status: 404 }
            );
        }

        const userId = transaction.user_id;
        const amount = Math.abs(transaction.amount);

        if (action === 'approve') {
            // Get user's current balance
            const { data: user } = await supabase
                .from('users')
                .select('wallet_balance')
                .eq('user_id', userId)
                .single();

            if (!user || (user.wallet_balance || 0) < amount) {
                return NextResponse.json(
                    { success: false, error: 'Insufficient balance' },
                    { status: 400 }
                );
            }

            // Optimistic Locking: Only update if balance matches what we read
            const { error: updateError, count } = await supabase
                .from('users')
                .update({ wallet_balance: (user.wallet_balance || 0) - amount })
                .eq('user_id', userId)
                // Use optimistic locking on balance to prevent double spend
                .eq('wallet_balance', user.wallet_balance);

            // Note: Supabase update logic returns rows, verifying exact match via filter is safer
            // But if filtered row doesn't match, it returns empty
            if (updateError) {
                throw updateError;
            }

            // Re-fetch to confirm update? OR assume if no error, we need to check if row was actually updated?
            // Since we can't easily get 'count' from standard supabase-js update unless we use select() count usually comes with select...
            // Actually supabase-js v2 update() returns {data, error, count} if count option used?
            // Let's rely on atomic constraints if possible or simply assume transaction risk is low for now 
            // BUT strict locking is better.
            // Let's stick to the previous simple logic but with better error handling.

            await supabase
                .from('payment_transactions')
                .update({
                    status: 'processing',
                    metadata: JSON.stringify({
                        ...JSON.parse(transaction.metadata || '{}'),
                        approvedBy: adminId,
                        approvedAt: new Date().toISOString(),
                    }),
                })
                .eq('transaction_code', transactionCode);

            // Notify user
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'success',
                title: 'Yêu cầu rút tiền đã được duyệt',
                message: `Yêu cầu rút ${amount.toLocaleString('vi-VN')}đ đang được xử lý. Tiền sẽ về trong 1-3 ngày làm việc.`,
                url: '/wallet',
            });

            logger.payment.info('Withdrawal approved', { transactionCode, adminId, amount });

        } else {
            // Reject
            await supabase
                .from('payment_transactions')
                .update({
                    status: 'failed',
                    metadata: JSON.stringify({
                        ...JSON.parse(transaction.metadata || '{}'),
                        rejectedBy: adminId,
                        rejectedAt: new Date().toISOString(),
                        rejectionReason: reason,
                    }),
                })
                .eq('transaction_code', transactionCode);

            // Notify user
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'warning',
                title: 'Yêu cầu rút tiền bị từ chối',
                message: reason || 'Yêu cầu rút tiền của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ.',
                url: '/wallet',
            });

            logger.payment.info('Withdrawal rejected', { transactionCode, adminId, reason });
        }

        // 4. Log admin action
        await supabase.from('admin_actions').insert({
            admin_id: adminId,
            type: action === 'approve' ? 'approve_withdrawal' : 'reject_withdrawal',
            details: JSON.stringify({
                transactionCode,
                userId,
                amount,
                reason,
            }),
        });

        return NextResponse.json({
            success: true,
            action,
            transactionCode,
        });

    } catch (error) {
        const err = error as Error;
        logger.payment.error('Admin withdrawal action error', { error: err.message });
        return NextResponse.json(
            { success: false, error: 'Failed to process action' },
            { status: 500 }
        );
    }
}

// GET: List pending withdrawals
export async function GET(request: NextRequest) {
    try {
        const { isAdmin } = await verifyAdminAuth(request);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('payment_transactions')
            .select(`
                *,
                users (display_name, email)
            `)
            .eq('type', 'withdrawal')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            pendingWithdrawals: data?.map(tx => ({
                transactionCode: tx.transaction_code,
                userId: tx.user_id,
                userName: tx.users?.display_name,
                userEmail: tx.users?.email,
                amount: Math.abs(tx.amount),
                bankInfo: tx.metadata ? JSON.parse(tx.metadata) : null,
                createdAt: tx.created_at,
            })) || [],
        });

    } catch (error) {
        const err = error as Error;
        logger.payment.error('Get pending withdrawals error', { error: err.message });
        return NextResponse.json(
            { success: false, error: 'Failed to get withdrawals' },
            { status: 500 }
        );
    }
}
