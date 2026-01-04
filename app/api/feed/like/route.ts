import { NextRequest, NextResponse } from 'next/server';
import { toggleLikePost } from '@/lib/supabase/feed';

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
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to toggle like',
      },
      { status: 500 }
    );
  }
}

