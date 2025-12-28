import { NextRequest, NextResponse } from 'next/server';
import { addCommentToPost } from '@/lib/firebase/greenFeed';
import { getUser } from '@/lib/supabase/users';

/**
 * API để thêm comment vào post
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId, content } = body;

    if (!postId || !userId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const commentId = await addCommentToPost(
      postId,
      userId,
      user.displayName || user.email,
      content,
      user.avatar
    );

    return NextResponse.json({
      success: true,
      commentId,
      message: 'Comment added successfully',
    });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add comment',
      },
      { status: 500 }
    );
  }
}

