import { NextRequest, NextResponse } from 'next/server';
import { getFriends, getFriendRequests } from '@/lib/supabase/friends';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'friends' | 'requests' | 'sent'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (type === 'requests') {
      const requests = await getFriendRequests(userId);
      return NextResponse.json({
        success: true,
        requests,
      });
    }

    if (type === 'sent') {
      const requests = await getFriendRequests(userId);
      return NextResponse.json({
        success: true,
        requests,
      });
    }

    // Default: get friends list
    const friends = await getFriends(userId);
    return NextResponse.json({
      success: true,
      friends,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

