import { NextRequest, NextResponse } from 'next/server';
import { runTransaction, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getCup } from '@/lib/firebase/cups';
import { addGreenPoints, incrementCupsSaved, getUser } from '@/lib/supabase/users';
import { getTransaction } from '@/lib/firebase/transactions';
import { getStore } from '@/lib/firebase/stores';
import { createAchievementStory } from '@/lib/firebase/stories';

const DEPOSIT_AMOUNT = parseInt(process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT || '20000');
const GREEN_POINTS_RETURN = 50; // Điểm khi trả đúng hạn
const GREEN_POINTS_OVERDUE = 20; // Điểm khi trả quá hạn (ít hơn)

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

    // Kiểm tra cup
    const cup = await getCup(cupId);
    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 });
    }

    if (cup.status !== 'in_use' || cup.currentUserId !== userId) {
      return NextResponse.json(
        { error: 'Cup is not borrowed by this user' },
        { status: 400 }
      );
    }

    // Kiểm tra transaction
    if (!cup.currentTransactionId) {
      return NextResponse.json(
        { error: 'No active transaction found' },
        { status: 400 }
      );
    }

    const transaction = await getTransaction(cup.currentTransactionId);
    if (!transaction || transaction.status !== 'ongoing') {
      return NextResponse.json(
        { error: 'Transaction not found or already completed' },
        { status: 400 }
      );
    }

    // Kiểm tra store
    const store = await getStore(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Thực hiện transaction atomic
    const returnTime = new Date();
    const isOverdue = returnTime > transaction.dueTime;
    const greenPoints = isOverdue ? GREEN_POINTS_OVERDUE : GREEN_POINTS_RETURN;

    // Hoàn tiền cọc trong Supabase (trước khi cập nhật Firestore transaction)
    const { updateWallet } = await import('@/lib/supabase/users');
    await updateWallet(userId, DEPOSIT_AMOUNT);
    
    await runTransaction(db, async (tx) => {

      // Cập nhật cup status
      const cupRef = doc(db, 'cups', cupId);
      tx.update(cupRef, {
        status: 'cleaning',
        currentUserId: null,
        currentTransactionId: null,
        lastActivity: Timestamp.now(),
      });

      // Cập nhật transaction
      if (!cup.currentTransactionId) {
        throw new Error('Transaction ID not found');
      }
      const transactionRef = doc(db, 'transactions', cup.currentTransactionId);
      const overdueHours = isOverdue
        ? Math.floor((returnTime.getTime() - transaction.dueTime.getTime()) / (1000 * 60 * 60))
        : 0;
      
      tx.update(transactionRef, {
        returnStoreId: storeId,
        returnTime: Timestamp.fromDate(returnTime),
        status: 'completed',
        refundAmount: DEPOSIT_AMOUNT,
        greenPointsEarned: greenPoints,
        isOverdue,
        overdueHours,
      });

      // Cập nhật inventory
      const storeRef = doc(db, 'stores', storeId);
      tx.update(storeRef, {
        'cupInventory.inUse': store.cupInventory.inUse - 1,
        'cupInventory.cleaning': store.cupInventory.cleaning + 1,
      });
    });

    // Cộng green points và cập nhật stats (không cần transaction vì đã hoàn tất)                                                       
    const rankResult = await addGreenPoints(userId, greenPoints, `Trả ly ${isOverdue ? 'quá hạn' : 'đúng hạn'}`);
    await incrementCupsSaved(userId);

    // Lấy thông tin user sau khi update
    const updatedUser = await getUser(userId);
    const cupsSaved = updatedUser?.totalCupsSaved || 0;

    // Tạo story tự động khi trả ly thành công (chỉ khi trả đúng hạn)
    if (!isOverdue) {
      try {
        await createAchievementStory(userId, 'cup_saved', {
          count: cupsSaved,
          message: `Đã cứu ${cupsSaved} ly nhựa! 🌱`,
        });
      } catch (storyError) {
        console.error('Error creating story:', storyError);
        // Không block return nếu story fail
      }
    }

    // Tạo story khi rank up
    if (rankResult.rankUp && rankResult.newRank !== 'seed') {
      try {
        await createAchievementStory(userId, 'rank_up', {
          rank: rankResult.newRank,
        });
      } catch (storyError) {
        console.error('Error creating rank up story:', storyError);
      }
    }

    return NextResponse.json({
      success: true,
      message: isOverdue
        ? '✅ Trả ly thành công! (Trả quá hạn, bạn nhận được ít điểm hơn)'
        : '🌱 Trả ly thành công! Bạn nhận được 50 Green Points!',
      refundAmount: DEPOSIT_AMOUNT,
      greenPointsEarned: greenPoints,
      isOverdue,
      rankUp: rankResult.rankUp ? { newRank: rankResult.newRank } : undefined,
      storyCreated: !isOverdue,
    });
  } catch (error: any) {
    console.error('Return error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

