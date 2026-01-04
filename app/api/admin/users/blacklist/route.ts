import { NextRequest, NextResponse } from 'next/server';
import { blacklistUser } from '@/lib/supabase/users';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';

/**
 * API để blacklist user (chỉ admin)
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
    const { userId, reason } = body;

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and reason' },
        { status: 400 }
      );
    }

    await blacklistUser(userId, reason);

    return NextResponse.json({
      success: true,
      message: 'User blacklisted successfully',
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
