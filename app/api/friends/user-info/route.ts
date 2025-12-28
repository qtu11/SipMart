import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/users';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await getUser(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        displayName: user.displayName,
        avatar: user.avatar,
        email: user.email,
        studentId: (user as any).studentId,
      },
    });
  } catch (error: any) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

