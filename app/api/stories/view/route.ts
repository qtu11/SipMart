import { NextRequest, NextResponse } from 'next/server';
import { viewStory } from '@/lib/supabase/stories';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, userId, action } = body; // action: 'view' | 'like'

    if (!storyId || !userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'view') {
      await viewStory(storyId, userId);
      return NextResponse.json({
        success: true,
        message: 'Story viewed',
      });
    }

    if (action === 'like') {
      // Story like functionality not implemented yet
      // Can be added later if needed
      return NextResponse.json(
        { error: 'Story like feature not implemented' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
