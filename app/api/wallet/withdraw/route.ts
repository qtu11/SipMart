// Withdrawal API - Request withdrawal from wallet
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Withdrawal limits
const MIN_WITHDRAWAL = 50000;  // 50k VND minimum
const MAX_WITHDRAWAL = 10000000;  // 10M VND maximum per request
const MAX_DAILY_WITHDRAWALS = 3;

interface WithdrawalRequest {
    userId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: WithdrawalRequest = await request.json();
        const { userId, amount, bankName, accountNumber, accountName } = body;

        // 1. Validate required fields
        if (!userId || !amount || !bankName || !accountNumber || !accountName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 2. Validate amount
        if (amount < MIN_WITHDRAWAL) {
            return NextResponse.json(
                { success: false, error: `Minimum withdrawal is ${MIN_WITHDRAWAL.toLocaleString('vi-VN')}đ` },
                { status: 400 }
            );
        }

        if (amount > MAX_WITHDRAWAL) {
            return NextResponse.json(
                { success: false, error: `Maximum withdrawal is ${MAX_WITHDRAWAL.toLocaleString('vi-VN')}đ per request` },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // 3. Get user and check balance
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_id, wallet_balance, email, display_name')
            .eq('user_id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const currentBalance = user.wallet_balance || 0;
        if (currentBalance < amount) {
            return NextResponse.json(
                { success: false, error: `Insufficient balance. Current: ${currentBalance.toLocaleString('vi-VN')}đ` },
                { status: 400 }
            );
        }

        // 4. Check daily withdrawal limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: dailyCount } = await supabase
            .from('payment_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('type', 'withdrawal')
            .gte('created_at', today.toISOString());

        if ((dailyCount || 0) >= MAX_DAILY_WITHDRAWALS) {
            return NextResponse.json(
                { success: false, error: `Maximum ${MAX_DAILY_WITHDRAWALS} withdrawals per day` },
                { status: 429 }
            );
        }

        // 5. Create withdrawal request (pending admin approval for large amounts)
        const transactionCode = `WD_${userId}_${Date.now()}`;
        const needsApproval = amount > 500000;  // > 500k needs admin approval

        const { error: insertError } = await supabase
            .from('payment_transactions')
            .insert({
                user_id: userId,
                type: 'withdrawal',
                amount: -amount,  // Negative for withdrawal
                payment_method: 'bank_transfer',
                transaction_code: transactionCode,
                status: needsApproval ? 'pending' : 'processing',
                description: `Rút tiền về ${bankName} - ${accountNumber}`,
                metadata: JSON.stringify({
                    bankName,
                    accountNumber,
                    accountName,
                    needsApproval,
                }),
            });

        if (insertError) {
            throw insertError;
        }

        // 6. If doesn't need approval, immediately hold the balance
        if (!needsApproval) {
            const { error: updateError } = await supabase
                .from('users')
                .update({ wallet_balance: currentBalance - amount })
                .eq('user_id', userId);

            if (updateError) {
                // Rollback transaction
                await supabase
                    .from('payment_transactions')
                    .delete()
                    .eq('transaction_code', transactionCode);
                throw updateError;
            }
        }

        // 7. Create notification
        await supabase.from('notifications').insert({
            user_id: userId,
            type: needsApproval ? 'info' : 'success',
            title: needsApproval ? 'Yêu cầu rút tiền đang chờ duyệt' : 'Yêu cầu rút tiền đang xử lý',
            message: needsApproval
                ? `Yêu cầu rút ${amount.toLocaleString('vi-VN')}đ đang chờ admin duyệt.`
                : `Yêu cầu rút ${amount.toLocaleString('vi-VN')}đ đang được xử lý. Tiền sẽ về tài khoản trong 1-3 ngày làm việc.`,
            url: '/wallet',
        });

        logger.payment.info('Withdrawal request created', {
            userId,
            amount,
            transactionCode,
            needsApproval,
        });

        return NextResponse.json({
            success: true,
            transactionCode,
            status: needsApproval ? 'pending_approval' : 'processing',
            message: needsApproval
                ? 'Withdrawal request submitted. Awaiting admin approval.'
                : 'Withdrawal request submitted. Processing within 1-3 business days.',
            newBalance: needsApproval ? currentBalance : currentBalance - amount,
        });

    } catch (error) {
        const err = error as Error;
        logger.payment.error('Withdrawal error', { error: err.message });
        return NextResponse.json(
            { success: false, error: 'Failed to process withdrawal' },
            { status: 500 }
        );
    }
}

// GET: Get user's withdrawal history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'withdrawal')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            withdrawals: data?.map(tx => ({
                id: tx.id,
                transactionCode: tx.transaction_code,
                amount: Math.abs(tx.amount),
                status: tx.status,
                bankInfo: tx.metadata ? JSON.parse(tx.metadata) : null,
                createdAt: tx.created_at,
                completedAt: tx.completed_at,
            })) || [],
        });

    } catch (error) {
        const err = error as Error;
        logger.payment.error('Get withdrawals error', { error: err.message });
        return NextResponse.json(
            { success: false, error: 'Failed to get withdrawals' },
            { status: 500 }
        );
    }
}
