import { NextRequest, NextResponse } from 'next/server';
import {
  getGlobalLeaderboard,
  getLeaderboardByRank,
  getUserRank,
  getLeaderboardWithUser,
  getFriendsLeaderboard,
} from '@/lib/supabase/leaderboard';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'global'; // global, friends, rank
    const userId = searchParams.get('userId');
    const rankLevel = searchParams.get('rankLevel');
    const limit = parseInt(searchParams.get('limit') || '50');

    let result;

    switch (type) {
      case 'friends':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required for friends leaderboard' },
            { status: 400 }
          );
        }
        result = await getFriendsLeaderboard(userId);
        break;

      case 'rank':
        if (!rankLevel) {
          return NextResponse.json(
            { error: 'rankLevel required for rank leaderboard' },
            { status: 400 }
          );
        }
        result = await getLeaderboardByRank(rankLevel, limit);
        break;

      case 'user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required for user rank' },
            { status: 400 }
          );
        }
        const userRankData = await getUserRank(userId);
        return NextResponse.json({
          success: true,
          ...userRankData,
        });

      case 'with_user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required' },
            { status: 400 }
          );
        }
        const leaderboardWithUser = await getLeaderboardWithUser(userId, limit);
        return NextResponse.json({
          success: true,
          ...leaderboardWithUser,
        });

      case 'global':
      default:
        result = await getGlobalLeaderboard(limit);
        break;
    }

    return NextResponse.json({
      success: true,
      leaderboard: result,
      type,
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
