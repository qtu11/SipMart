import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import { generateVietQRUrl } from '@/lib/payment/get-config';

// POST: Generate VietQR URL
export async function POST(request: NextRequest) {
    try {
        if (!(await verifyAdminFromRequest(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, description } = body;

        // Generate URL using server-side config logic (which can read unmasked values)
        const qrUrl = await generateVietQRUrl(amount || 0, description || 'QR Preview');

        return NextResponse.json({ qrUrl });
    } catch (error: any) {
        console.error('QR Generate error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
