import { NextRequest, NextResponse } from 'next/server';
import { addCommentToPost } from '@/lib/supabase/feed';
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

    // Add comment (user info is fetched inside the function)
    const comment = await addCommentToPost(
      postId,
      userId,
      content
    );

    return NextResponse.json({
      success: true,
      comment,
      message: 'Comment added successfully',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to add comment',
      },
      { status: 500 }
    );
  }
}

