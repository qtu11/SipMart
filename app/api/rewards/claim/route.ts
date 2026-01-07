// API: Claim Reward - MIGRATED TO SUPABASE with authentication
import { NextRequest, NextResponse } from 'next/server';
import { claimReward, getUserRewardClaimsWithDetails } from '@/lib/supabase/rewards';
import { verifyAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json(
        { success: false, error: 'Missing rewardId' },
        { status: 400 }
      );
    }

    // Use authenticated userId (security: don't trust client userId)
    const claim = await claimReward(authResult.userId, rewardId);

    logger.info('Reward claimed', { userId: authResult.userId, rewardId });

    return NextResponse.json({ success: true, claim });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Claim reward error', { error: err.message });
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const claims = await getUserRewardClaimsWithDetails(authResult.userId);
    return NextResponse.json({ success: true, claims });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Get reward claims error', { error: err.message });
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
