import { NextRequest, NextResponse } from 'next/server';
import { getStories, getUserStories } from '@/lib/firebase/stories';
import { getFriends } from '@/lib/firebase/friends';

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

    // Lấy stories của bạn bè và user hiện tại
    const friends = await getFriends(userId);
    const friendIds = friends.map(f => f.userId);
    const stories = await getStories(userId, friendIds);

    return NextResponse.json({
      success: true,
      stories,
    });
  } catch (error: any) {
    console.error('Get stories error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

