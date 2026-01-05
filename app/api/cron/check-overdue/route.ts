// Cron job: Check overdue transactions
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/middleware/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Cron job to check and mark overdue transactions
 * Should be called every 15-30 minutes via Vercel Cron
 * 
 * Vercel cron.json example:
 * {
 *   "crons": [
 *     { "path": "/api/cron/check-overdue", "schedule": "*/15 * * * * " }
    *   ]
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Verify cron secret
        if (!verifyCronAuth(request)) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid or missing cron secret' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseAdmin();
        const now = new Date();

        // 1. Find ongoing transactions that are past due
        const { data: overdueTransactions, error: selectError } = await supabase
            .from('transactions')
            .select('transaction_id, user_id, cup_id, due_time')
            .eq('status', 'ongoing')
            .lt('due_time', now.toISOString());

        if (selectError) throw selectError;

        if (!overdueTransactions || overdueTransactions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No overdue transactions found',
                processed: 0,
                timestamp: now.toISOString(),
            });
        }

        // 2. Mark them as overdue with overdue_hours calculation
        const updatePromises = overdueTransactions.map(async (tx) => {
            const dueTime = new Date(tx.due_time);
            const overdueHours = Math.ceil(
                (now.getTime() - dueTime.getTime()) / (1000 * 60 * 60)
            );

            // Update transaction
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    status: 'overdue',
                    is_overdue: true,
                    overdue_hours: overdueHours,
                })
                .eq('transaction_id', tx.transaction_id)
                .eq('status', 'ongoing'); // Only update if still ongoing (idempotency)

            if (updateError) {
                logger.error('Failed to mark transaction overdue', {
                    transactionId: tx.transaction_id,
                    error: updateError.message,
                });
                return null;
            }

            // 3. Send notification to user
            await supabase.from('notifications').insert({
                user_id: tx.user_id,
                type: 'warning',
                title: '⚠️ Ly đã quá hạn!',
                message: `Giao dịch ${tx.transaction_id.slice(-8)} đã quá hạn ${overdueHours}h. Vui lòng trả ly sớm để tránh bị trừ tiền cọc.`,
                url: '/profile',
            });

            return tx.transaction_id;
        });

        const results = await Promise.all(updatePromises);
        const successCount = results.filter(Boolean).length;

        logger.info('Check overdue cron completed', {
            found: overdueTransactions.length,
            processed: successCount,
        });

        return NextResponse.json({
            success: true,
            message: `Marked ${successCount} transactions as overdue`,
            processed: successCount,
            found: overdueTransactions.length,
            timestamp: now.toISOString(),
        });

    } catch (error) {
        const err = error as Error;
        logger.error('Check overdue cron failed', { error: err.message });
        return NextResponse.json(
            { error: err.message || 'Failed to check overdue transactions' },
            { status: 500 }
        );
    }
}

// Also support GET for manual testing (still requires cron secret)
export async function GET(request: NextRequest) {
    return POST(request);
}
