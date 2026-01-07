import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/supabase/users';
import { checkAdminApi } from '@/lib/supabase/admin';

/**
 * API để lấy danh sách tất cả users (chỉ admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin using env credentials or session
    const isAdmin = await checkAdminApi(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin credentials required' },
        { status: 401 }
      );
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    const limitCount = limitParam ? parseInt(limitParam) : undefined;

    const users = await getAllUsers(limitCount);

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error: unknown) {
    const err = error as Error; return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error',
        users: [],
      },
      { status: 500 }
    );
  }
}
