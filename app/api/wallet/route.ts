import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/users';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      walletBalance: user.walletBalance,
      greenPoints: user.greenPoints,
      rankLevel: user.rankLevel,
      totalCupsSaved: user.totalCupsSaved,
      totalPlasticReduced: user.totalPlasticReduced,
    });
  } catch (error: any) {
    console.error('Wallet error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount } = body;

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Nạp tiền vào ví (tích hợp với payment gateway sau)
    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // TODO: Tích hợp payment gateway (MoMo, ZaloPay, VNPay)
    // Hiện tại chỉ cập nhật balance
    const { updateWallet } = await import('@/lib/supabase/users');
    await updateWallet(userId, amount);

    return NextResponse.json({
      success: true,
      message: 'Nạp tiền thành công',
      newBalance: user.walletBalance + amount,
    });
  } catch (error: any) {
    console.error('Top-up error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

