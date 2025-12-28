// API: Transaction History
import { NextResponse } from 'next/server';
import { getTransactionHistory } from '@/lib/firebase/analytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const history = await getTransactionHistory(
      userId,
      limit ? parseInt(limit) : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('Error in GET /api/transactions/history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

