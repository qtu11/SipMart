import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import type { LeaderboardEntry } from '@/lib/types';

// Bảng xếp hạng sống xanh
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const top = parseInt(searchParams.get('top') || '100');
    const department = searchParams.get('department'); // Filter theo khoa

    let q = query(
      collection(db, COLLECTIONS.USERS),
      orderBy('greenPoints', 'desc'),
      limit(top)
    );

    const snapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    let rank = 1;

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Filter theo department nếu có
      if (department && data.department !== department) {
        return;
      }

      entries.push({
        userId: doc.id,
        displayName: data.displayName || data.email?.split('@')[0] || 'Anonymous',
        avatar: data.avatar,
        greenPoints: data.greenPoints || 0,
        totalCupsSaved: data.totalCupsSaved || 0,
        rank: rank++,
        department: data.department,
        class: data.class,
      });
    });

    return NextResponse.json({
      leaderboard: entries,
      total: entries.length,
    });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

