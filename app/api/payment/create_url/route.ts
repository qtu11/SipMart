// Create VNPay Payment URL - Alternative endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createVnpayUrl } from '@/lib/vnpay';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const MIN_AMOUNT = 10000;

export async function POST(req: NextRequest) {
    try {
        const { amount, userId, bankCode } = await req.json();

        // Validate
        if (!amount || !userId) {
            return NextResponse.json(
                { error: 'Missing amount or userId' },
                { status: 400 }
            );
        }

        if (amount < MIN_AMOUNT) {
            return NextResponse.json(
                { error: `Minimum amount is ${MIN_AMOUNT.toLocaleString('vi-VN')}đ` },
                { status: 400 }
            );
        }

        // Verify user
        const supabase = getSupabaseAdmin();
        const { data: user } = await supabase
            .from('users')
            .select('user_id, display_name')
            .eq('user_id', userId)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get client IP
        const ipAddr = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1';

        // Generate payment URL
        const orderInfo = `Nap tien vi ${userId}`;
        const url = createVnpayUrl({
            amount,
            orderInfo,
            ipAddr,
            orderId: `${userId}_${Date.now()}`,
            userId,
            bankCode,
        });

        // Log pending transaction
        const transactionCode = `${userId}_${Date.now()}`;
        await supabase.from('payment_transactions').insert({
            user_id: userId,
            type: 'topup',
            amount,
            payment_method: 'vnpay',
            transaction_code: transactionCode,
            status: 'pending',
        });

        logger.payment.info('Payment URL created via create_url', { userId, amount });

        return NextResponse.json({ url, transactionCode });
    } catch (error) {
        const err = error as Error;
        logger.payment.error('Error creating payment URL', { error: err.message });
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
