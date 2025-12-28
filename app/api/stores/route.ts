import { NextRequest, NextResponse } from 'next/server';
import { getAllStores } from '@/lib/firebase/stores';

export async function GET(request: NextRequest) {
  try {
    const stores = await getAllStores();
    
    return NextResponse.json({
      success: true,
      stores,
    });
  } catch (error: any) {
    console.error('Get stores error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

