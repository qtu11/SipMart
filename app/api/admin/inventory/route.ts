// API: Inventory Management (Admin)
import { NextResponse } from 'next/server';
import {
  getInventoryAlerts,
  createInventoryTransfer,
  updateInventoryTransfer,
} from '@/lib/firebase/admin-advanced';

export async function GET(request: Request) {
  try {
    const alerts = await getInventoryAlerts();
    return NextResponse.json({ success: true, alerts });
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
    const { fromStoreId, toStoreId, cupCount, requestedBy } = body;

    if (!fromStoreId || !toStoreId || !cupCount || !requestedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createInventoryTransfer({
      fromStoreId,
      toStoreId,
      cupCount,
      status: 'pending',
      requestedBy,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { transferId, status } = body;

    if (!transferId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await updateInventoryTransfer(transferId, status);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

