// API: Advanced Analytics (Admin)
import { NextResponse } from 'next/server';
import { getAdvancedAnalytics, generateDailyReport } from '@/lib/firebase/analytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'daily_report') {
      const report = await generateDailyReport();
      return NextResponse.json({ success: true, report });
    }

    const analytics = await getAdvancedAnalytics();

    if (!analytics) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    console.error('Error in GET /api/admin/advanced-analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

