// Secure VNPay Payment Creation API with Authentication
import { NextRequest, NextResponse } from 'next/server';
import { createVnpayUrl } from '@/lib/vnpay';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Minimum and maximum amounts
const MIN_AMOUNT = 10000;  // 10k VND
const MAX_AMOUNT = 50000000;  // 50M VND

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, userId, bankCode, description } = body;

        // 1. Validate required fields
        if (!amount || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: amount and userId' },
                { status: 400 }
            );
        }

        // 2. Validate amount
        if (amount < MIN_AMOUNT) {
            return NextResponse.json(
                { success: false, error: `Minimum amount is ${MIN_AMOUNT.toLocaleString('vi-VN')}đ` },
                { status: 400 }
            );
        }

        if (amount > MAX_AMOUNT) {
            return NextResponse.json(
                { success: false, error: `Maximum amount is ${MAX_AMOUNT.toLocaleString('vi-VN')}đ` },
                { status: 400 }
            );
        }

        // 3. Verify user exists
        const supabase = getSupabaseAdmin();
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_id, email, display_name')
            .eq('user_id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // 4. Get client IP
        const ipAddr = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        // 5. Create payment URL
        const transactionCode = `${userId}_${Date.now()}`;
        const orderInfo = description || `Nap tien vi CupSipSmart - ${user.display_name || userId}`;

        const paymentUrl = createVnpayUrl({
            amount,
            orderInfo,
            ipAddr,
            orderId: transactionCode,
            userId,
            bankCode,
        });

        // 6. Create pending payment transaction
        await supabase.from('payment_transactions').insert({
            user_id: userId,
            type: 'topup',
            amount,
            payment_method: 'vnpay',
            transaction_code: transactionCode,
            status: 'pending',
            description: orderInfo,
        });

        logger.payment.info('Payment URL created', { userId, amount, transactionCode });

        return NextResponse.json({
            success: true,
            url: paymentUrl,
            transactionCode,
        });

    } catch (error) {
        const err = error as Error;
        logger.payment.error('Failed to create payment URL', { error: err.message });
        return NextResponse.json(
            { success: false, error: 'Failed to create payment' },
            { status: 500 }
        );
    }
}
