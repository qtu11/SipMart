import { NextRequest, NextResponse } from 'next/server';
import { verifyVnpayReturn } from '@/lib/vnpay';
import { updateWallet } from '@/lib/supabase/users';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const vnp_Params: any = {};

        searchParams.forEach((value, key) => {
            vnp_Params[key] = value;
        });

        // 1. Verify Checksum
        const { isValid, code } = verifyVnpayReturn({ ...vnp_Params });
        if (!isValid) {
            return NextResponse.json({ RspCode: '97', Message: 'Invalid Checksum' });
        }

        // 2. Check Transaction Status
        // vnp_ResponseCode = '00' (Success)
        // vnp_TransactionStatus = '00' (Success)
        if (vnp_Params['vnp_ResponseCode'] !== '00' || vnp_Params['vnp_TransactionStatus'] !== '00') {
            // Transaction failed or cancelled
            // We can just log it, but VNPAY expects '00' if we received the IPN successfully,
            // even if the transaction itself failed? 
            // No, if transaction failed, we just acknowledge.
            // But we DON'T update balance.
            return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
        }

        // 3. Update Balance
        // vnp_TxnRef format: userId_timestamp
        const txnRef = vnp_Params['vnp_TxnRef'] || '';
        const userId = txnRef.split('_')[0];
        const amount = parseInt(vnp_Params['vnp_Amount']) / 100;

        if (!userId) {
            return NextResponse.json({ RspCode: '02', Message: 'Order already confirmed' }); // Or invalid order
        }

        // Perform update
        console.log(`Processing VNPAY IPN: User ${userId}, Amount ${amount}`);
        await updateWallet(userId, amount);

        return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });

    } catch (error) {
        console.error('IPN Error:', error);
        return NextResponse.json({ RspCode: '99', Message: 'Unknown Error' });
    }
}
