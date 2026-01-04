import { NextRequest, NextResponse } from 'next/server';
import { getVirtualTree, waterTree } from '@/lib/firebase/gamification';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const tree = await getVirtualTree(userId);
    return NextResponse.json(tree);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isOnTime } = body;

    if (!userId || typeof isOnTime !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await waterTree(userId, isOnTime);
    const tree = await getVirtualTree(userId);

    return NextResponse.json({
      success: true,
      tree,
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

