// API: Auto Reports (Admin)
import { NextResponse } from 'next/server';
import { setupAutoReport, getAutoReports } from '@/lib/firebase/admin-advanced';

export async function GET(request: Request) {
  try {
    const reports = await getAutoReports();
    return NextResponse.json({ success: true, reports });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, recipients, nextSend, config } = body;

    if (!type || !recipients || !nextSend) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await setupAutoReport({
      type,
      recipients,
      nextSend: new Date(nextSend),
      isActive: true,
      config,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

