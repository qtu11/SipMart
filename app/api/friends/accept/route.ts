import { NextRequest, NextResponse } from 'next/server';
import { acceptFriendRequest } from '@/lib/supabase/friends';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, userId } = body;

    if (!requestId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const friendship = await acceptFriendRequest(requestId);

    // Trigger "First Friend" achievement for both users
    const { checkFirstFriend } = await import('@/lib/achievements');
    await Promise.all([
      checkFirstFriend(friendship.userId1),
      checkFirstFriend(friendship.userId2)
    ]).catch(err => console.error('Error triggering achievements:', err));

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}

