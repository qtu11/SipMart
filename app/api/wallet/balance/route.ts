/**
 * Wallet Balance API
 * GET /api/wallet/balance - Get current user's wallet balance and ledger summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getWalletBalance, getTransactionHistory } from '@/lib/supabase/wallet-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Get user from authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // Get wallet balance
        const balance = await getWalletBalance(userId);
        if (!balance) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get recent transactions (last 5)
        const { entries: recentTransactions } = await getTransactionHistory(userId, { limit: 5 });

        // Calculate monthly stats
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { entries: monthlyEntries } = await getTransactionHistory(userId, {
            startDate: startOfMonth,
            limit: 1000,
        });

        const monthlyStats = {
            totalCredits: 0,
            totalDebits: 0,
            topups: 0,
            withdrawals: 0,
            cupDeposits: 0,
            cupRefunds: 0,
        };

        monthlyEntries.forEach((entry) => {
            if (entry.entryType === 'credit') {
                monthlyStats.totalCredits += entry.amount;
                if (entry.referenceType === 'topup') monthlyStats.topups += entry.amount;
                if (entry.referenceType === 'cup_refund') monthlyStats.cupRefunds += entry.amount;
            } else {
                monthlyStats.totalDebits += entry.amount;
                if (entry.referenceType === 'withdrawal') monthlyStats.withdrawals += entry.amount;
                if (entry.referenceType === 'cup_deposit') monthlyStats.cupDeposits += entry.amount;
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...balance,
                recentTransactions: recentTransactions.map((tx) => ({
                    id: tx.ledgerId,
                    type: tx.entryType,
                    amount: tx.amount,
                    referenceType: tx.referenceType,
                    description: tx.description,
                    balanceAfter: tx.balanceAfter,
                    createdAt: tx.createdAt.toISOString(),
                })),
                monthlyStats,
            },
        });
    } catch (error: any) {
        console.error('[API] /api/wallet/balance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
