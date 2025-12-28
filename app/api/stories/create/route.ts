import { NextRequest, NextResponse } from 'next/server';
import { createStory, createAchievementStory } from '@/lib/firebase/stories';

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

    let storyId: string;

    if (type === 'achievement' && achievementType) {
      storyId = await createAchievementStory(userId, achievementType, achievementData || {});
    } else {
      storyId = await createStory(userId, type, content, thumbnail, achievementType, achievementData);
    }

    return NextResponse.json({
      success: true,
      storyId,
      message: 'Story created successfully',
    });
  } catch (error: any) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create story' },
      { status: 500 }
    );
  }
}

