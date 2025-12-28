// API: Personal Eco Dashboard
import { NextResponse } from 'next/server';
import { getPersonalEcoDashboard } from '@/lib/firebase/analytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const dashboard = await getPersonalEcoDashboard(userId);

    if (!dashboard) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, dashboard });
  } catch (error: any) {
    console.error('Error in GET /api/eco/dashboard:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

