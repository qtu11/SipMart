/**
 * Unified Payment Create API
 * POST /api/payment/create - Create payment URL for any supported method
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createPayment, PaymentMethod } from '@/lib/payment';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { method, amount, orderId, userId, bankCode, returnUrl } = body;

        // Validate required fields
        if (!method || !amount || !userId) {
            return NextResponse.json(
                { error: 'method, amount, and userId are required' },
                { status: 400 }
            );
        }

        // Validate method
        const validMethods: PaymentMethod[] = ['VNPAY', 'MOMO', 'PAYPAL', 'BANK_TRANSFER'];
        if (!validMethods.includes(method)) {
            return NextResponse.json(
                { error: `Invalid method. Supported: ${validMethods.join(', ')}` },
                { status: 400 }
            );
        }

        // Check if payment method is active
        const supabase = getSupabaseAdmin();
        const { data: config } = await supabase
            .from('payment_configs')
            .select('is_active')
            .eq('provider_id', method)
            .single();

        if (!config?.is_active) {
            return NextResponse.json(
                { error: 'Phương thức thanh toán này hiện không khả dụng' },
                { status: 400 }
            );
        }

        // Get client IP
        const ipAddr = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        // Generate orderId if not provided
        const txnOrderId = orderId || `${userId}_${Date.now()}`;

        // Create payment
        const result = await createPayment(method, {
            orderId: txnOrderId,
            amount,
            userId,
            ipAddr,
            bankCode,
            returnUrl,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Payment creation failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            transactionId: result.transactionId,
        });

    } catch (error: any) {
        console.error('[API] /api/payment/create error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
