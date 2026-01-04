import { NextRequest, NextResponse } from 'next/server';
import { createStory, createAchievementStory } from '@/lib/supabase/stories';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      content,
      thumbnail,
      achievementType,
      achievementData,
    } = body;

    if (!userId || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let story;

    if (type === 'achievement' && achievementType) {
      story = await createAchievementStory(userId, achievementType, achievementData || {});
    } else {
      story = await createStory({
        userId,
        type,
        content,
        thumbnail,
        achievementType,
        achievementData,
      });
    }

    return NextResponse.json({
      success: true,
      story,
      message: 'Story created successfully',
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { error: err.message || 'Failed to create story' },
      { status: 500 }
    );
  }
}

