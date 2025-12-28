import { NextRequest, NextResponse } from 'next/server';
import { viewStory, toggleStoryLike } from '@/lib/firebase/stories';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, userId, action } = body; // action: 'view' | 'like'

    if (!storyId || !userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'view') {
      await viewStory(storyId, userId);
      return NextResponse.json({
        success: true,
        message: 'Story viewed',
      });
    }

    if (action === 'like') {
      const isLiked = await toggleStoryLike(storyId, userId);
      return NextResponse.json({
        success: true,
        isLiked,
        message: isLiked ? 'Story liked' : 'Story unliked',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Story action error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

