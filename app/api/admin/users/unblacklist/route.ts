import { NextRequest, NextResponse } from 'next/server';
import { unblacklistUser } from '@/lib/supabase/users';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';

/**
 * API để unblacklist user (chỉ admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin using env credentials
    if (!verifyAdminFromRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin credentials required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    await unblacklistUser(userId);

    return NextResponse.json({
      success: true,
      message: 'User unblacklisted successfully',
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
