// API: Challenges
import { NextResponse } from 'next/server';
import {
  getActiveChallenges,
  joinChallenge,
  getUserChallenges,
} from '@/lib/firebase/challenges';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const userChallenges = await getUserChallenges(userId);
      return NextResponse.json({ success: true, challenges: userChallenges });
    }

    const challenges = await getActiveChallenges();
    return NextResponse.json({ success: true, challenges });
  } catch (error: any) {
    console.error('Error in GET /api/challenges:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, challengeId } = body;

    if (!userId || !challengeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await joinChallenge(userId, challengeId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/challenges:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

