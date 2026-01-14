import { NextRequest } from 'next/server';
import { getUser, updateWallet, addGreenPoints } from '@/lib/supabase/users';
import { getCup } from '@/lib/supabase/cups';
import { getStore, borrowCupFromStore } from '@/lib/supabase/stores';
import { createTransaction } from '@/lib/supabase/transactions';
import { getTierInfo, checkFirstTimeBonus, applyFirstTimeBonus } from '@/lib/supabase/gamification';
import { GAMIFICATION_CONFIG } from '@/lib/config/gamification';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { borrowSchema, validateRequest } from '@/lib/validation/schemas';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

const DEPOSIT_AMOUNT = parseInt(process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT || '20000');
const BORROW_DURATION_HOURS = parseInt(process.env.NEXT_PUBLIC_BORROW_DURATION_HOURS || '24');

// Rate limiter: 10 requests per minute per user
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
    const rateLimitResult = checkRateLimit(`borrow:${userId}`, {
      windowMs: 60 * 1000,
      maxRequests: 10
    });

    if (!rateLimitResult.success) {
      return errorResponse('Too Many Requests', 429);
    }

    const body = await request.json();

    // Input validation using Zod
    const validation = validateRequest(borrowSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { cupId, storeId } = validation.data;

    // Kiểm tra user có đủ tiền cọc không
    const user = await getUser(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (user.isBlacklisted) {
      return errorResponse(`User is blacklisted: ${user.blacklistReason}`, 403);
    }

    if (user.walletBalance < DEPOSIT_AMOUNT) {
      return errorResponse(
        `Insufficient wallet balance. Required: ${DEPOSIT_AMOUNT}, Current: ${user.walletBalance}`,
        400
      );
    }

    // Kiểm tra cup có available không
    const cup = await getCup(cupId);
    if (!cup) {
      return errorResponse('Cup not found', 404);
    }

    // CRITICAL: Check cup status - this prevents race conditions
    // If another request is processing this cup, it will fail here
    if (cup.status !== 'available') {
      return errorResponse(`Cup is ${cup.status}`, 400);
    }

    // Kiểm tra store
    const store = await getStore(storeId);
    if (!store) {
      return errorResponse('Store not found', 404);
    }

    if (store.cupAvailable < 1) {
      return errorResponse('Store has no available cups', 400);
    }

    // ============= GAMIFICATION: Check tier limit =============
    const tierInfo = await getTierInfo(userId);
    if (!tierInfo.canBorrow) {
      return errorResponse(
        `Bạn đã đạt giới hạn mượn ly cho hạng ${tierInfo.currentTier}`,
        400
      );
    }

    // ============= GAMIFICATION: Check first-time bonus =============
    const isFirstTime = await checkFirstTimeBonus(userId);
    const actualDepositAmount = DEPOSIT_AMOUNT;

    if (isFirstTime) {
      // TODO: Configure which bonus type to use (free_deposit or wallet_credit)
      // For now, using wallet_credit (25k VND)
      await applyFirstTimeBonus(userId, 'wallet_credit');
      // Note: If using 'free_deposit', set actualDepositAmount = 0 here
    }

    // Tạo transaction (status: ongoing)
    const transaction = await createTransaction({
      userId,
      cupId,
      borrowStoreId: storeId,
      depositAmount: actualDepositAmount,
      durationHours: BORROW_DURATION_HOURS,
    });


    // ATOMIC: Deduct Wallet & Borrow Cup in ONE database transaction
    // This prevents race conditions and partial failures
    const { borrowCupAtomic } = await import('@/lib/supabase/cups');

    // Pass everything to RPC. RPC will:
    // 1. Deduct wallet (if sufficient)
    // 2. Lock cup
    // 3. Update cup status
    // 4. Return new balance or error
    const borrowResult = await borrowCupAtomic(
      cupId,
      userId,
      transaction.transactionId,
      actualDepositAmount
    );

    if (!borrowResult.success) {
      // Logic failure (e.g. low balance caught by DB, or cup taken)
      // Transaction record exists but cup/wallet unchanged.
      // We must cancel the transaction record.
      await getSupabaseAdmin()
        .from('transactions')
        .update({ status: 'cancelled' })
        .eq('transaction_id', transaction.transactionId);

      // If it was a generic error, log it
      if (borrowResult.message !== 'Insufficient wallet balance' && borrowResult.message !== 'Cup is not available') {
        logger.error('Atomic Borrow Failed', { userId, cupId, error: borrowResult.message });
      }

      return errorResponse(borrowResult.message, 400);
    }



    // Cập nhật inventory
    await borrowCupFromStore(storeId);

    // ============= GAMIFICATION: Award Green Points =============
    const borrowPoints = GAMIFICATION_CONFIG.points.borrow;
    await addGreenPoints(userId, borrowPoints, `Borrowed cup ${cupId}`);

    // ============= GAMIFICATION: Update Streak =============
    try {
      const { updateUserStreak } = await import('@/lib/supabase/streaks');
      const streakResult = await updateUserStreak(userId);
      if (streakResult.streakBonusPoints > 0) {
        logger.info('Streak bonus awarded', {
          userId,
          streak: streakResult.currentStreak,
          bonus: streakResult.streakBonusPoints,
        });
      }
    } catch (streakError) {
      logger.error('Failed to update streak', { userId, error: streakError });
    }

    // ============= GAMIFICATION: Update Challenge Progress =============
    try {
      const { updateChallengeProgress } = await import('@/lib/supabase/challenges');
      await updateChallengeProgress(userId, 'cups', 1);
    } catch (challengeError) {
      logger.error('Failed to update challenge progress', { userId, error: challengeError });
    }

    // ============= AUDIT LOG =============
    try {
      const { createAuditLog } = await import('@/lib/supabase/audit-logs');
      await createAuditLog({
        actorId: userId,
        actorType: 'user',
        action: 'cup_borrow',
        resourceType: 'cups',
        resourceId: cupId,
        newValue: { cupId, storeId, depositAmount: DEPOSIT_AMOUNT },
      });
    } catch (auditError) {
      logger.error('Failed to create audit log', { userId, error: auditError });
    }

    // ============= GAMIFICATION: Create EcoAction record =============
    await getSupabaseAdmin()
      .from('eco_actions')
      .insert({
        user_id: userId,
        type: 'borrow',
        cup_id: cupId,
        points: borrowPoints,
        description: `Mượn ly tại ${store.name}`,
      });

    // ============= GAMIFICATION: Send notification =============
    await getSupabaseAdmin()
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'success',
        title: '🎉 Mượn ly thành công!',
        message: `Bạn vừa mượn ly tại ${store.name}. Nhận ${borrowPoints} Green Points! Nhớ trả đúng hạn nhé.`,
        url: '/profile',
      });


    // Gửi email thông báo mượn ly (async, không block response)
    if (user.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cupsipmart-uefedu-qt.vercel.app';
      fetch(`${appUrl}/api/email/send-borrow-notification`, {
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
      }).catch((emailError) => {
        logger.error('Failed to send borrow notification email', {
          userId,
          cupId,
          error: emailError,
        });
      });
    }

    return jsonResponse({
      transactionId: transaction.transactionId,
      dueTime: transaction.dueTime,
      depositAmount: DEPOSIT_AMOUNT,
    }, '🌟 Mượn ly thành công! Bạn vừa giúp giảm 1 ly nhựa - tương đương bớt đi 450 năm ô nhiễm!');

  } catch (error: unknown) {
    return errorResponse(error);
  }
}

