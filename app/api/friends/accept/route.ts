import { NextRequest, NextResponse } from 'next/server';
import { acceptFriendRequest } from '@/lib/firebase/friends';

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

    await acceptFriendRequest(requestId, userId);

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted',
    });
  } catch (error: any) {
    console.error('Accept friend request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}

