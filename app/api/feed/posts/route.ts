import { NextRequest, NextResponse } from 'next/server';
import { getFeedPosts } from '@/lib/supabase/feed';

/**
 * API để lấy danh sách posts trong Green Feed
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const userId = searchParams.get('userId');
    const limit = limitParam ? parseInt(limitParam) : 20;

    const posts = await getFeedPosts({
      userId: userId || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to get feed posts',
        posts: [],
      },
      { status: 500 }
    );
  }
}

