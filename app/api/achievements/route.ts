// API: Get Achievements
import { NextResponse } from 'next/server';
import { getAllAchievements, getAchievementsByCategory } from '@/lib/firebase/achievements';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let achievements;
    if (category) {
      achievements = await getAchievementsByCategory(category as any);
    } else {
      achievements = await getAllAchievements();
    }

    return NextResponse.json({ success: true, achievements });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

