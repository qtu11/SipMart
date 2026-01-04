import { NextRequest, NextResponse } from 'next/server';
import { createFeedPost } from '@/lib/supabase/feed';
import { addGreenPoints } from '@/lib/supabase/users';

// Note: Image upload functionality needs Supabase Storage setup
// For now, this is a placeholder that expects imageUrl to be provided
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, imageUrl, caption, cupId } = body;

    if (!userId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields (userId, imageUrl)' },
        { status: 400 }
      );
    }

    // Create post
    const post = await createFeedPost({
      userId,
      imageUrl,
      caption: caption || undefined,
      cupId: cupId || undefined,
      greenPointsEarned: 10,
    });

    // Add green points (10 points for posting)
    try {
      await addGreenPoints(userId, 10, 'Posted to Green Feed');
    } catch (pointsError) {
      // Don't block post creation if points fail
    }

    return NextResponse.json({
      success: true,
      post,
      message: 'Post created successfully',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to create post',
      },
      { status: 500 }
    );
  }
}
