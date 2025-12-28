import { NextRequest, NextResponse } from 'next/server';
import { toggleLikePost } from '@/lib/firebase/greenFeed';

/**
 * API để like/unlike một post
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId } = body;

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isLiked = await toggleLikePost(postId, userId);

    return NextResponse.json({
      success: true,
      isLiked,
      message: isLiked ? 'Post liked' : 'Post unliked',
    });
  } catch (error: any) {
    console.error('Toggle like error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to toggle like',
      },
      { status: 500 }
    );
  }
}

