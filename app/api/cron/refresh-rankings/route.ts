import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Cron job API to refresh materialized view for user rankings
 * Should be called hourly via cron service (Vercel Cron, GitHub Actions, etc.)
 */
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Use auth middleware to verify cron secret
        const { verifyCronAuth } = await import('@/lib/middleware/auth');

        if (!verifyCronAuth(request)) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid or missing cron secret' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Refresh user rankings materialized view
        const { error: refreshError } = await supabase
            .rpc('refresh_user_rankings');

        if (refreshError) {
            throw refreshError;
        }

        return NextResponse.json({
            success: true,
            message: 'User rankings refreshed successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { error: err.message || 'Failed to refresh rankings' },
            { status: 500 }
        );
    }
}
