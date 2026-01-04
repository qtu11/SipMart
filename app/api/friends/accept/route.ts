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

    await acceptFriendRequest(requestId);

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

