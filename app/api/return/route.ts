import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/users';
import { getCup, markCupForCleaning } from '@/lib/supabase/cups';
import { getStore, returnCupToStore } from '@/lib/supabase/stores';
import { getTransaction, completeTransaction } from '@/lib/supabase/transactions';

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

    // Hoàn tất transaction (includes refund calculation, green points, etc.)
    const completedTransaction = await completeTransaction(
      cup.currentTransactionId,
      storeId
    );

    // ATOMIC: Return cup using database RPC (prevents race conditions)
    const { returnCupAtomic } = await import('@/lib/supabase/cups');
    const returnResult = await returnCupAtomic(cupId, userId);

    if (!returnResult.success) {
      throw new Error(returnResult.message);
    }

    // Cập nhật inventory
    await returnCupToStore(storeId);

    // Lấy thông tin user sau khi update để tạo story
    const updatedUser = await getUser(userId);
    const cupsSaved = updatedUser?.totalCupsSaved || 0;

    // TODO: Tạo story tự động khi trả ly thành công (cần implement Supabase stories helper)
    // if (!completedTransaction.isOverdue) {
    //   await createAchievementStory(userId, 'cup_saved', {
    //     count: cupsSaved,
    //     message: `Đã cứu ${cupsSaved} ly nhựa! 🌱`,
    //   });
    // }

    return NextResponse.json({
      success: true,
      message: completedTransaction.isOverdue
        ? '✅ Trả ly thành công! (Trả quá hạn, bạn nhận được ít điểm hơn)'
        : `🌱 Trả ly thành công! Bạn nhận được ${completedTransaction.greenPointsEarned} Green Points!`,
      refundAmount: completedTransaction.refundAmount,
      greenPointsEarned: completedTransaction.greenPointsEarned,
      isOverdue: completedTransaction.isOverdue,
      overdueHours: completedTransaction.overdueHours,
      cupsSaved,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
