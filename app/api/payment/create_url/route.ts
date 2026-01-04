import { NextRequest, NextResponse } from 'next/server';
import { createVnpayUrl } from '@/lib/vnpay';

export async function POST(req: NextRequest) {
    try {
        const { amount, userId } = await req.json();

        // Get client IP
        const ipAddr = req.headers.get('x-forwarded-for') || '127.0.0.1';

        const orderId = `${Date.now()}`;
        const orderInfo = `Nap tien vao vi ${userId}`;

        const url = createVnpayUrl(amount, orderInfo, ipAddr, orderId);

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Error creating payment URL:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
