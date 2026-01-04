import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateWallet } from '@/lib/supabase/users';
import { getCup, updateCupStatus, incrementCupUses } from '@/lib/supabase/cups';
import { getStore, borrowCupFromStore } from '@/lib/supabase/stores';
import { createTransaction } from '@/lib/supabase/transactions';

const DEPOSIT_AMOUNT = parseInt(process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT || '20000');
const BORROW_DURATION_HOURS = parseInt(process.env.NEXT_PUBLIC_BORROW_DURATION_HOURS || '24');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cupId, storeId } = body;

    if (!userId || !cupId || !storeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Kiểm tra user có đủ tiền cọc không
    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isBlacklisted) {
      return NextResponse.json(
        { error: 'User is blacklisted', reason: user.blacklistReason },
        { status: 403 }
      );
    }

    if (user.walletBalance < DEPOSIT_AMOUNT) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance', required: DEPOSIT_AMOUNT, current: user.walletBalance },
        { status: 400 }
      );
    }

    // Kiểm tra cup có available không
    const cup = await getCup(cupId);
    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 });
    }

    // CRITICAL: Check cup status - this prevents race conditions
    // If another request is processing this cup, it will fail here
    if (cup.status !== 'available') {
      return NextResponse.json(
        { error: `Cup is ${cup.status}`, currentStatus: cup.status },
        { status: 400 }
      );
    }

    // Kiểm tra store
    const store = await getStore(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.cupAvailable < 1) {
      return NextResponse.json(
        { error: 'Store has no available cups' },
        { status: 400 }
      );
    }

    // Tạo transaction
    const transaction = await createTransaction({
      userId,
      cupId,
      borrowStoreId: storeId,
      depositAmount: DEPOSIT_AMOUNT,
      durationHours: BORROW_DURATION_HOURS,
    });

    // Trừ tiền cọc
    await updateWallet(userId, -DEPOSIT_AMOUNT);

    // ATOMIC: Cập nhật cup status using database RPC (prevents all race conditions)
    // This locks the cup row and ensures only one user can borrow it
    const { borrowCupAtomic } = await import('@/lib/supabase/cups');
    const borrowResult = await borrowCupAtomic(cupId, userId, transaction.transactionId);

    if (!borrowResult.success) {
      // Rollback: refund user and cancel transaction
      await updateWallet(userId, DEPOSIT_AMOUNT);
      // Transaction will be cleaned up by cron job or can be cancelled here
      throw new Error(borrowResult.message);
    }

    // Cập nhật inventory
    await borrowCupFromStore(storeId);

    // Gửi email thông báo mượn ly (async, không block response)
    if (user.email) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send-borrow-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName || 'Người dùng',
          cupId,
          transactionId: transaction.transactionId,
          dueTime: transaction.dueTime.toISOString(),
          storeName: store.name,
        }),
      }).catch(() => {
        // Email error - silent fail, don't block borrow flow
      });
    }

    return NextResponse.json({
      success: true,
      message: '🌟 Mượn ly thành công! Bạn vừa giúp giảm 1 ly nhựa - tương đương bớt đi 450 năm ô nhiễm!',
      transactionId: transaction.transactionId,
      dueTime: transaction.dueTime,
      depositAmount: DEPOSIT_AMOUNT,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
