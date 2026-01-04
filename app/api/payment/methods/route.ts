// API: Payment Methods
import { NextResponse } from 'next/server';
import {
  addPaymentMethod,
  getUserPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
} from '@/lib/firebase/payments';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const methods = await getUserPaymentMethods(userId);
    return NextResponse.json({ success: true, methods });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, provider, accountNumber, accountName, isDefault } = body;

    if (!userId || !type || !provider) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await addPaymentMethod(userId, {
      type,
      provider,
      accountNumber,
      accountName,
      isDefault: isDefault || false,
      isActive: true,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, methodId, action } = body;

    if (!userId || !methodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'set_default') {
      result = await setDefaultPaymentMethod(userId, methodId);
    } else if (action === 'delete') {
      result = await deletePaymentMethod(userId, methodId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

