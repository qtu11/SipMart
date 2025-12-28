// API: Incident Management (Admin)
import { NextResponse } from 'next/server';
import { createIncident, getIncidents, updateIncident } from '@/lib/firebase/admin-advanced';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const incidents = await getIncidents(status as any);
    return NextResponse.json({ success: true, incidents });
  } catch (error: any) {
    console.error('Error in GET /api/admin/incidents:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, cupId, userId, storeId, description, priority } = body;

    if (!type || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createIncident({
      type,
      cupId,
      userId,
      storeId,
      description,
      status: 'open',
      priority: priority || 'medium',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/admin/incidents:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { incidentId, adminId, ...updateData } = body;

    if (!incidentId) {
      return NextResponse.json(
        { success: false, error: 'Missing incidentId' },
        { status: 400 }
      );
    }

    const result = await updateIncident(incidentId, updateData, adminId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PUT /api/admin/incidents:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

