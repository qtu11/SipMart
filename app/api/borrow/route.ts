import { NextRequest, NextResponse } from 'next/server';
import { runTransaction, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getCup } from '@/lib/firebase/cups';
import { getUser } from '@/lib/supabase/users';
import { getStore } from '@/lib/firebase/stores';

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

    if (store.cupInventory.available < 1) {
      return NextResponse.json(
        { error: 'Store has no available cups' },
        { status: 400 }
      );
    }

    // Thực hiện transaction atomic
    const dueTime = new Date();
    dueTime.setHours(dueTime.getHours() + BORROW_DURATION_HOURS);
    
    // Cập nhật wallet balance trong Supabase (trước khi tạo Firestore transaction)
    const { updateWallet } = await import('@/lib/supabase/users');
    await updateWallet(userId, -DEPOSIT_AMOUNT);
    
    const result = await runTransaction(db, async (transaction: any) => {

      // Kiểm tra lại cup status
      const cupRef = doc(db, 'cups', cupId);
      const cupSnap = await transaction.get(cupRef);
      if (!cupSnap.exists() || cupSnap.data().status !== 'available') {
        throw new Error('Cup not available');
      }

      // Tạo transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      // Cập nhật cup
      transaction.update(cupRef, {
        status: 'in_use',
        currentUserId: userId,
        currentTransactionId: transactionId,
        lastActivity: Timestamp.now(),
      });

      // Tạo transaction record
      const transactionRef = doc(db, 'transactions', transactionId);
      transaction.set(transactionRef, {
        userId,
        cupId,
        borrowStoreId: storeId,
        borrowTime: Timestamp.now(),
        dueTime: Timestamp.fromDate(dueTime),
        status: 'ongoing',
        depositAmount: DEPOSIT_AMOUNT,
        isOverdue: false,
      });

      // Cập nhật inventory
      const storeRef = doc(db, 'stores', storeId);
      transaction.update(storeRef, {
        'cupInventory.available': store.cupInventory.available - 1,
        'cupInventory.inUse': store.cupInventory.inUse + 1,
      });

      return { transactionId, dueTime };
    });

    // Gửi email thông báo mượn ly (async, không block response)
    // Note: user.email từ Firestore, nếu không có thì skip
    const userEmail = user.email || null;
    if (userEmail) {
      // Gửi email trong background, không block response
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send-borrow-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          displayName: user.displayName || 'Người dùng',
          cupId,
          transactionId: result.transactionId,
          dueTime: result.dueTime.toISOString(),
          storeName: store.name,
        }),
      }).catch(err => {
        console.error('Error sending borrow email:', err);
        // Không throw error để không ảnh hưởng đến flow chính
      });
    }

    return NextResponse.json({
      success: true,
      message: '🌟 Mượn ly thành công! Bạn vừa giúp giảm 1 ly nhựa - tương đương bớt đi 450 năm ô nhiễm!',
      transactionId: result.transactionId,
      dueTime: result.dueTime,
      depositAmount: DEPOSIT_AMOUNT,
    });
  } catch (error: any) {
    console.error('Borrow error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

