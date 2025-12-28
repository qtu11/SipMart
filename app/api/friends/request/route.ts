import { NextRequest, NextResponse } from 'next/server';
import { sendFriendRequest } from '@/lib/firebase/friends';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUserId, toUserId } = body;

    if (!fromUserId || !toUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: 'Cannot send request to yourself' },
        { status: 400 }
      );
    }

    const requestId = await sendFriendRequest(fromUserId, toUserId);

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Friend request sent successfully',
    });
  } catch (error: any) {
    console.error('Send friend request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

