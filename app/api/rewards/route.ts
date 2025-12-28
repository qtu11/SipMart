// API: Rewards Store
import { NextResponse } from 'next/server';
import { getAllRewards, getRewardById } from '@/lib/firebase/rewards';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rewardId = searchParams.get('rewardId');

    if (rewardId) {
      const reward = await getRewardById(rewardId);
      if (!reward) {
        return NextResponse.json(
          { success: false, error: 'Reward not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, reward });
    }

    const rewards = await getAllRewards(category as any);
    return NextResponse.json({ success: true, rewards });
  } catch (error: any) {
    console.error('Error in GET /api/rewards:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

