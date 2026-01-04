// API: Claim Reward
import { NextResponse } from 'next/server';
import { claimReward, getUserRewardClaims } from '@/lib/firebase/rewards';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, rewardId } = body;

    if (!userId || !rewardId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await claimReward(userId, rewardId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const claims = await getUserRewardClaims(userId);
    return NextResponse.json({ success: true, claims });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

