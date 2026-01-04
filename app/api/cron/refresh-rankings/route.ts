import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Cron job API to refresh materialized view for user rankings
 * Should be called hourly via cron service (Vercel Cron, GitHub Actions, etc.)
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
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
