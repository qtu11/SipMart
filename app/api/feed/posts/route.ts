import { NextRequest, NextResponse } from 'next/server';
import { getFeedPosts } from '@/lib/firebase/greenFeed';

/**
 * API để lấy danh sách posts trong Green Feed
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limitCount = limitParam ? parseInt(limitParam) : 20;

    const posts = await getFeedPosts(limitCount);

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error: any) {
    console.error('Get feed posts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get feed posts',
        posts: [],
      },
      { status: 500 }
    );
  }
}

