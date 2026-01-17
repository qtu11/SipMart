/**
 * Wallet History API
 * GET /api/wallet/history - Get paginated transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getTransactionHistory } from '@/lib/supabase/wallet-service';

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
        const { searchParams } = new URL(request.url);

        // Parse query params
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
        const referenceType = searchParams.get('type') || undefined;
        const startDate = searchParams.get('startDate')
            ? new Date(searchParams.get('startDate')!)
            : undefined;
        const endDate = searchParams.get('endDate')
            ? new Date(searchParams.get('endDate')!)
            : undefined;

        // Get history
        const result = await getTransactionHistory(userId, {
            page,
            limit,
            referenceType,
            startDate,
            endDate,
        });

        return NextResponse.json({
            success: true,
            data: {
                transactions: result.entries.map((tx) => ({
                    id: tx.ledgerId,
                    type: tx.entryType,
                    amount: tx.amount,
                    balanceBefore: tx.balanceBefore,
                    balanceAfter: tx.balanceAfter,
                    referenceType: tx.referenceType,
                    referenceId: tx.referenceId,
                    description: tx.description,
                    createdAt: tx.createdAt.toISOString(),
                })),
                pagination: {
                    page: result.page,
                    limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            },
        });
    } catch (error: any) {
        console.error('[API] /api/wallet/history error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
