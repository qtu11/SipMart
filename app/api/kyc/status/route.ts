/**
 * KYC Status API
 * GET /api/kyc/status - Get current user's KYC status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getKycStatus } from '@/lib/supabase/kyc-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Get user from auth header
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const result = await getKycStatus(user.id);

        return NextResponse.json({
            success: true,
            ...result,
        });

    } catch (error: any) {
        console.error('[KYC Status] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
