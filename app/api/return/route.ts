import { NextRequest } from 'next/server';
import { getUser } from '@/lib/supabase/users';
import { getCup } from '@/lib/supabase/cups';
import { getStore, returnCupToStore } from '@/lib/supabase/stores';
import { getTransaction, completeTransaction } from '@/lib/supabase/transactions';
import { verifyAuth } from '@/lib/middleware/auth';
import { returnSchema, validateRequest } from '@/lib/validation/schemas';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';

// Rate limiter
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify user authentication first
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || !authResult.userId) {
      return unauthorizedResponse();
    }

    // Use authenticated userId only (not from request body)
    const userId = authResult.userId;

    // Rate Limit Check
    const rateLimitResult = checkRateLimit(`return:${userId}`, {
      windowMs: 60 * 1000,
      maxRequests: 10
    });

    if (!rateLimitResult.success) {
      return errorResponse('Too Many Requests', 429);
    }

    const body = await request.json();

    // Input validation using Zod
    const validation = validateRequest(returnSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { cupId, storeId } = validation.data;

    // Kiểm tra cup
    const cup = await getCup(cupId);
    if (!cup) {
      return errorResponse('Cup not found', 404);
    }

    if (cup.status !== 'in_use' || cup.currentUserId !== userId) {
      return errorResponse('Cup is not borrowed by this user', 400);
    }

    // Kiểm tra transaction
    if (!cup.currentTransactionId) {
      return errorResponse('No active transaction found', 400);
    }

    const transaction = await getTransaction(cup.currentTransactionId);
    if (!transaction || transaction.status !== 'ongoing') {
      return errorResponse('Transaction not found or already completed', 400);
    }

    // Kiểm tra store
    const store = await getStore(storeId);
    if (!store) {
      return errorResponse('Store not found', 404);
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

    // Lấy thông tin user sau khi update
    const updatedUser = await getUser(userId);
    const cupsSaved = updatedUser?.totalCupsSaved || 0;

    // Check and trigger achievements
    const { checkAndTriggerAchievements } = await import('@/lib/achievements');
    await checkAndTriggerAchievements(userId);

    return jsonResponse({
      refundAmount: completedTransaction.refundAmount,
      greenPointsEarned: completedTransaction.greenPointsEarned,
      isOverdue: completedTransaction.isOverdue,
      overdueHours: completedTransaction.overdueHours,
      cupsSaved,
    }, completedTransaction.isOverdue
      ? '✅ Trả ly thành công! (Trả quá hạn, bạn nhận được ít điểm hơn)'
      : `🌱 Trả ly thành công! Bạn nhận được ${completedTransaction.greenPointsEarned} Green Points!`);

  } catch (error: unknown) {
    return errorResponse(error);
  }
}

