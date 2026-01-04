import { NextRequest, NextResponse } from 'next/server';
import { getTransactionHistory } from '@/lib/supabase/transactions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const history = await getTransactionHistory(userId, {
      limit: limit ? parseInt(limit) : undefined,
      status: status as any || undefined,
    });

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
