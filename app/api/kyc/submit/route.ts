/**
 * KYC Submit API
 * POST /api/kyc/submit - Submit KYC documents for verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { submitKyc } from '@/lib/supabase/kyc-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Get user from auth header
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            // Try to get from cookie
            const supabase = getSupabaseAdmin();
            const cookieHeader = request.headers.get('cookie') || '';
            const accessToken = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1];

            if (!accessToken) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        }

        const supabase = getSupabaseAdmin();

        // Get user from token
        let userId: string;

        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
            }
            userId = user.id;
        } else {
            return NextResponse.json({ success: false, error: 'No auth token' }, { status: 401 });
        }

        const body = await request.json();
        const { front_img_path, back_img_path, selfie_img_path } = body;

        // Validate
        if (!front_img_path || !back_img_path || !selfie_img_path) {
            return NextResponse.json(
                { success: false, error: 'Thiếu ảnh xác minh' },
                { status: 400 }
            );
        }

        // Submit KYC
        const result = await submitKyc(userId, {
            front_img_path,
            back_img_path,
            selfie_img_path,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'KYC submitted successfully',
            data: result.data,
        });

    } catch (error: any) {
        console.error('[KYC Submit] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
