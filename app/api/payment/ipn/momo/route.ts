/**
 * MoMo IPN Handler
 * POST /api/payment/ipn/momo - Receive MoMo callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { MoMoProvider } from '@/lib/payment/momo';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { topUpWallet } from '@/lib/supabase/wallet-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('[MoMo IPN] Received:', JSON.stringify(body));

        const provider = new MoMoProvider();
        const result = await provider.verifyCallback(body);

        if (!result.isValid) {
            console.error('[MoMo IPN] Invalid callback:', result.message);
            return NextResponse.json({ resultCode: 97, message: result.message });
        }

        if (result.code !== '0') {
            console.log('[MoMo IPN] Payment failed:', result.message);

            // Update transaction status to failed
            const supabase = getSupabaseAdmin();
            await supabase
                .from('payment_transactions')
                .update({ status: 'failed' })
                .eq('transaction_code', result.orderId);

            return NextResponse.json({ resultCode: 0, message: 'Received' });
        }

        // Payment successful - credit wallet
        if (result.userId && result.amount) {
            const topupResult = await topUpWallet({
                userId: result.userId,
                amount: result.amount,
                paymentMethod: 'momo',
                transactionCode: result.transactionNo || result.orderId || '',
                metadata: { momoTransId: result.transactionNo },
            });

            if (topupResult.success) {
                console.log(`[MoMo IPN] Wallet credited: ${result.amount} VND for user ${result.userId}`);
            } else {
                console.error('[MoMo IPN] Wallet credit failed:', topupResult.error);
            }
        }

        return NextResponse.json({ resultCode: 0, message: 'Success' });

    } catch (error: any) {
        console.error('[MoMo IPN] Error:', error);
        return NextResponse.json({ resultCode: 99, message: error.message });
    }
}
