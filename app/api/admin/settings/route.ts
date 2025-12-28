// API: System Settings (Admin)
import { NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSetting } from '@/lib/firebase/admin-advanced';

export async function GET(request: Request) {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error in GET /api/admin/settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value, dataType, category, adminId } = body;

    if (!key || value === undefined || !dataType || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await updateSystemSetting(key, value, dataType, category, adminId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PUT /api/admin/settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

