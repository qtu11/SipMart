import { NextRequest, NextResponse } from 'next/server';
import { getStories, getUserStories } from '@/lib/supabase/stories';
import { getFriends } from '@/lib/supabase/friends';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const targetUserId = searchParams.get('targetUserId'); // Để lấy stories của user cụ thể

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (targetUserId) {
      // Lấy stories của user cụ thể
      const stories = await getUserStories(targetUserId);
      return NextResponse.json({
        success: true,
        stories,
      });
    }

    // Lấy stories của user hiện tại (getStories returns all non-expired stories)
    const stories = await getStories(userId);

    return NextResponse.json({
      success: true,
      stories,
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

