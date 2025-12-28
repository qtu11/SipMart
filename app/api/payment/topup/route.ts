// API: Payment Top-up
import { NextResponse } from 'next/server';
import {
  createVNPayPayment,
  createMoMoPayment,
  createZaloPayPayment,
} from '@/lib/firebase/payments';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, paymentMethod, description } = body;

    if (!userId || !amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 10000) {
      return NextResponse.json(
        { success: false, error: 'Minimum top-up amount is 10,000 VND' },
        { status: 400 }
      );
    }

    let result;
    switch (paymentMethod) {
      case 'vnpay':
        result = await createVNPayPayment(userId, amount, description || 'Top-up wallet');
        break;
      case 'momo':
        result = await createMoMoPayment(userId, amount, description || 'Top-up wallet');
        break;
      case 'zalopay':
        result = await createZaloPayPayment(userId, amount, description || 'Top-up wallet');
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid payment method' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/payment/topup:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

