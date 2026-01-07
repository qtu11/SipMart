import { NextRequest, NextResponse } from 'next/server';
import { checkOverdueTransactions } from '@/lib/supabase/transactions';
import { checkExpiredChallenges } from '@/lib/supabase/challenges';
import { resetInactiveStreaks } from '@/lib/supabase/streaks';
import { createAuditLog } from '@/lib/supabase/audit-logs';
import { logger } from '@/lib/logger';

/**
 * Cron Job: Chạy daily để:
 * 1. Check và đánh dấu transactions quá hạn
 * 2. Check challenges hết hạn
 * 3. Reset streak cho users inactive
 * 
 * Deploy: Vercel Cron hoặc external cron service
 * Schedule: 0 0 * * * (midnight daily)
 */

// Verify cron secret để tránh unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        // Nếu không có secret, cho phép trong development
        return process.env.NODE_ENV === 'development';
    }

    return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
    try {
        // Verify cron authorization
        if (!verifyCronSecret(request)) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const startTime = Date.now();
        const results: Record<string, any> = {
            timestamp: new Date().toISOString(),
            tasks: {},
        };

        // Task 1: Check overdue transactions
        try {
            logger.info('Running overdue transactions check...');
            const overdueCount = await checkOverdueTransactions();
            results.tasks.overdueTransactions = {
                success: true,
                count: overdueCount,
            };
            logger.info(`Marked ${overdueCount} transactions as overdue`);
        } catch (error) {
            logger.error('Overdue check failed:', { error });
            results.tasks.overdueTransactions = {
                success: false,
                error: (error as Error).message,
            };
        }

        // Task 2: Check expired challenges
        try {
            logger.info('Running expired challenges check...');
            const expiredCount = await checkExpiredChallenges();
            results.tasks.expiredChallenges = {
                success: true,
                count: expiredCount,
            };
            logger.info(`Marked ${expiredCount} challenge participations as failed`);
        } catch (error) {
            logger.error('Expired challenges check failed:', { error });
            results.tasks.expiredChallenges = {
                success: false,
                error: (error as Error).message,
            };
        }

        // Task 3: Reset inactive streaks
        try {
            logger.info('Running streak reset...');
            const resetCount = await resetInactiveStreaks();
            results.tasks.resetStreaks = {
                success: true,
                count: resetCount,
            };
            logger.info(`Reset ${resetCount} inactive streaks`);
        } catch (error) {
            logger.error('Streak reset failed:', { error });
            results.tasks.resetStreaks = {
                success: false,
                error: (error as Error).message,
            };
        }

        // Calculate execution time
        const executionTime = Date.now() - startTime;
        results.executionTimeMs = executionTime;

        // Audit log
        await createAuditLog({
            actorType: 'system',
            action: 'system_cron',
            resourceType: 'cron',
            resourceId: 'daily-tasks',
            newValue: results,
        });

        logger.info('Daily cron completed', results);

        return NextResponse.json({
            success: true,
            ...results,
        });

    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Cron job failed:', { error: err });

        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}

// POST endpoint cho manual trigger (dev only)
export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { success: false, error: 'Manual trigger only allowed in development' },
            { status: 403 }
        );
    }

    return GET(request);
}
