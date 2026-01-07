// Cron job: Send reminder notifications 1 hour before due
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/middleware/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Cron job to send reminder notifications 1 hour before transactions are due
 * Should be called every 15-30 minutes via Vercel Cron
 * 
 * Vercel cron.json example:
 * {
 *   "crons": [
 *     { "path": "/api/cron/due-reminders", "schedule": "*\/15 * * * *" }
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

        // Calculate time window: 45-75 minutes from now (to catch within 30 min cron interval)
        const reminderStart = new Date(now.getTime() + 45 * 60 * 1000); // 45 min from now
        const reminderEnd = new Date(now.getTime() + 75 * 60 * 1000);   // 75 min from now

        // 1. Find transactions due within 1 hour that haven't been reminded yet
        const { data: dueSoonTransactions, error: selectError } = await supabase
            .from('transactions')
            .select('transaction_id, user_id, cup_id, due_time')
            .eq('status', 'ongoing')
            .eq('is_overdue', false)
            .gte('due_time', reminderStart.toISOString())
            .lte('due_time', reminderEnd.toISOString());

        if (selectError) throw selectError;

        if (!dueSoonTransactions || dueSoonTransactions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No transactions due soon',
                processed: 0,
                timestamp: now.toISOString(),
            });
        }

        // 2. Check if reminder notification already sent (prevent duplicates)
        const reminderPromises = dueSoonTransactions.map(async (tx) => {
            // Check if reminder already sent for this transaction
            const { data: existingReminder } = await supabase
                .from('notifications')
                .select('notification_id')
                .eq('user_id', tx.user_id)
                .eq('type', 'reminder')
                .like('message', `%${tx.transaction_id.slice(-8)}%`)
                .single();

            if (existingReminder) {
                // Already reminded
                return null;
            }

            const dueTime = new Date(tx.due_time);
            const minutesLeft = Math.ceil((dueTime.getTime() - now.getTime()) / (1000 * 60));

            // Send reminder notification
            await supabase.from('notifications').insert({
                user_id: tx.user_id,
                type: 'reminder',
                title: '⏰ Sắp đến hạn trả ly!',
                message: `Bạn còn khoảng ${minutesLeft} phút để trả ly (mã: ${tx.transaction_id.slice(-8)}). Hãy trả ly đúng hạn để nhận đầy đủ điểm thưởng!`,
                url: '/profile',
            });

            return tx.transaction_id;
        });

        const results = await Promise.all(reminderPromises);
        const sentCount = results.filter(Boolean).length;

        logger.info('Due reminders cron completed', {
            found: dueSoonTransactions.length,
            sent: sentCount,
        });

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} reminder notifications`,
            processed: sentCount,
            found: dueSoonTransactions.length,
            timestamp: now.toISOString(),
        });

    } catch (error) {
        const err = error as Error;
        logger.error('Due reminders cron failed', { error: err.message });
        return NextResponse.json(
            { error: err.message || 'Failed to send reminders' },
            { status: 500 }
        );
    }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
    return POST(request);
}
