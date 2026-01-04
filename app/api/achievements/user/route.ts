// API: User Achievements
import { NextResponse } from 'next/server';
import {
  getUserAchievements,
  unlockAchievement,
  updateAchievementProgress,
} from '@/lib/firebase/achievements';

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

    const achievements = await getUserAchievements(userId);
    return NextResponse.json({ success: true, achievements });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, achievementId, action, progress } = body;

    if (!userId || !achievementId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'unlock') {
      result = await unlockAchievement(userId, achievementId);
    } else if (action === 'update_progress') {
      result = await updateAchievementProgress(userId, achievementId, progress);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

