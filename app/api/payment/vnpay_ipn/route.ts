// VNPay IPN Callback - Secure with idempotency and transaction logging
import { NextRequest, NextResponse } from 'next/server';
import { verifyVnpayReturn, isVnpayIP } from '@/lib/vnpay';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// VNPay IPN Response codes
const IPN_RESPONSE = {
    SUCCESS: { RspCode: '00', Message: 'Confirm Success' },
    INVALID_CHECKSUM: { RspCode: '97', Message: 'Invalid Checksum' },
    ORDER_NOT_FOUND: { RspCode: '01', Message: 'Order not found' },
    ORDER_ALREADY_CONFIRMED: { RspCode: '02', Message: 'Order already confirmed' },
    INVALID_AMOUNT: { RspCode: '04', Message: 'Invalid Amount' },
    UNKNOWN_ERROR: { RspCode: '99', Message: 'Unknown Error' },
    FORBIDDEN: { RspCode: '99', Message: 'Forbidden' },
} as const;

export async function GET(request: NextRequest) {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

    try {
        // 1. IP Whitelist check (production only)
        if (!isVnpayIP(clientIP)) {
            logger.vnpay.ipBlocked(clientIP);
            return NextResponse.json(IPN_RESPONSE.FORBIDDEN, { status: 403 });
        }

        // 2. Parse VNPay params
        const searchParams = request.nextUrl.searchParams;
        const vnpParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            vnpParams[key] = value;
        });

        // 3. Verify checksum
        const verifyResult = verifyVnpayReturn(vnpParams);

        logger.vnpay.ipnReceived(verifyResult.txnRef || 'unknown', vnpParams['vnp_ResponseCode'] || '');

        if (!verifyResult.isValid) {
            logger.vnpay.signatureInvalid(clientIP);
            return NextResponse.json(IPN_RESPONSE.INVALID_CHECKSUM);
        }

        // 4. Check transaction status from VNPay
        if (vnpParams['vnp_ResponseCode'] !== '00' || vnpParams['vnp_TransactionStatus'] !== '00') {
            // Transaction failed on VNPay side - acknowledge but don't update balance
            logger.payment.failed(verifyResult.txnRef || '', `VNPay response: ${vnpParams['vnp_ResponseCode']}`);
            return NextResponse.json(IPN_RESPONSE.SUCCESS);
        }

        // 5. Extract data
        const { txnRef, amount, userId } = verifyResult;

        if (!txnRef || !userId || !amount) {
            logger.payment.error('Invalid IPN data', { txnRef, userId, amount });
            return NextResponse.json(IPN_RESPONSE.ORDER_NOT_FOUND);
        }

        const supabase = getSupabaseAdmin();

        // 6. Idempotency check - prevent double processing
        const { data: existingTx } = await supabase
            .from('payment_transactions')
            .select('id, status')
            .eq('transaction_code', txnRef)
            .single();

        if (existingTx) {
            if (existingTx.status === 'success') {
                logger.vnpay.ipnProcessed(txnRef, 'duplicate');
                return NextResponse.json(IPN_RESPONSE.ORDER_ALREADY_CONFIRMED);
            }
            // If pending, we can update it
        }

        // 7. Process payment with database transaction
        // Using Supabase RPC for atomic operation
        const { error: txError } = await supabase.rpc('process_vnpay_payment', {
            p_user_id: userId,
            p_transaction_code: txnRef,
            p_amount: amount,
            p_vnpay_transaction_no: vnpParams['vnp_TransactionNo'] || '',
            p_bank_code: vnpParams['vnp_BankCode'] || '',
            p_pay_date: vnpParams['vnp_PayDate'] || '',
        });

        if (txError) {
            // If the function doesn't exist, fallback to manual update
            if (txError.message.includes('function') || txError.message.includes('does not exist')) {
                // Fallback: Manual update (not atomic but works)
                await processPaymentManually(supabase, {
                    userId,
                    txnRef,
                    amount,
                    vnpTransactionNo: vnpParams['vnp_TransactionNo'],
                    bankCode: vnpParams['vnp_BankCode'],
                    payDate: vnpParams['vnp_PayDate'],
                });
            } else {
                throw txError;
            }
        }

        logger.payment.success(txnRef, userId, amount);
        logger.vnpay.ipnProcessed(txnRef, 'success');

        return NextResponse.json(IPN_RESPONSE.SUCCESS);

    } catch (error) {
        const err = error as Error;
        logger.payment.error('IPN processing error', {
            error: err.message,
            ip: clientIP
        });
        return NextResponse.json(IPN_RESPONSE.UNKNOWN_ERROR);
    }
}

// Fallback for manual payment processing
async function processPaymentManually(
    supabase: ReturnType<typeof getSupabaseAdmin>,
    data: {
        userId: string;
        txnRef: string;
        amount: number;
        vnpTransactionNo?: string;
        bankCode?: string;
        payDate?: string;
    }
) {
    const { userId, txnRef, amount, vnpTransactionNo, bankCode, payDate } = data;

    // 1. Create or update payment transaction
    const { error: insertError } = await supabase
        .from('payment_transactions')
        .upsert({
            user_id: userId,
            type: 'topup',
            amount: amount,
            payment_method: 'vnpay',
            transaction_code: txnRef,
            status: 'success',
            completed_at: new Date().toISOString(),
            metadata: JSON.stringify({
                vnpTransactionNo,
                bankCode,
                payDate,
            }),
        }, {
            onConflict: 'transaction_code',
        });

    if (insertError) {
        logger.payment.error('Failed to create payment transaction', { error: insertError.message });
        throw insertError;
    }

    // 2. Update user wallet balance
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('user_id', userId)
        .single();

    if (userError || !user) {
        logger.payment.error('User not found for wallet update', { userId });
        throw new Error('User not found');
    }

    const newBalance = (user.wallet_balance || 0) + amount;

    const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('user_id', userId);

    if (updateError) {
        logger.payment.error('Failed to update wallet balance', { error: updateError.message });
        throw updateError;
    }

    // 3. Create notification
    await supabase.from('notifications').insert({
        user_id: userId,
        type: 'success',
        title: 'Nạp tiền thành công',
        message: `Bạn đã nạp ${amount.toLocaleString('vi-VN')}đ vào ví thành công.`,
        url: '/wallet',
    });
}

// Also handle POST (some VNPay implementations use POST)
export async function POST(request: NextRequest) {
    return GET(request);
}
