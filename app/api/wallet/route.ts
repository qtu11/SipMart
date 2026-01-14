// Wallet API with Authentication
import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateWallet } from '@/lib/supabase/users';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET: Get wallet info (requires auth)
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify authentication
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || !authResult.userId) {
      return unauthorizedResponse();
    }

    const userId = authResult.userId;
    const user = await getUser(userId);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return jsonResponse({
      walletBalance: user.walletBalance,
      greenPoints: user.greenPoints,
      rankLevel: user.rankLevel,
      totalCupsSaved: user.totalCupsSaved,
      totalPlasticReduced: user.totalPlasticReduced,
    });

  } catch (error) {
    const err = error as Error;
    logger.error('Wallet GET error', { error: err.message });
    return errorResponse('Internal server error');
  }
}

// POST: Top up wallet (requires auth + payment gateway)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify authentication
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || !authResult.userId) {
      return unauthorizedResponse();
    }

    const userId = authResult.userId;
    const body = await request.json();
    const { amount, method } = body;

    if (!amount || amount <= 0) {
      return errorResponse('Invalid amount', 400);
    }

    // Get current user
    const user = await getUser(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Route to appropriate payment gateway
    if (method === 'vnpay') {
      // Redirect to VNPay payment creation
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://sipsmart.vercel.app'}/api/vnpay/create_payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      });

      const data = await response.json();
      return NextResponse.json(data);
    }

    // For direct top-up (admin or test only)
    // In production, this should be protected or removed
    if (process.env.NODE_ENV === 'development') {
      await updateWallet(userId, amount);

      return jsonResponse({
        newBalance: user.walletBalance + amount,
      }, 'Nạp tiền thành công (dev mode)');
    }

    return errorResponse('Payment method required', 400);

  } catch (error) {
    const err = error as Error;
    logger.error('Wallet POST error', { error: err.message });
    return errorResponse('Internal server error');
  }
}
