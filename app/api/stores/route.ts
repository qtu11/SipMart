import { NextRequest, NextResponse } from 'next/server';
import { getAllStores, getActiveStores, findNearbyStores } from '@/lib/supabase/stores';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');

    let stores;

    // Find nearby stores if coordinates provided
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = radius ? parseFloat(radius) : 5;
      stores = await findNearbyStores(latitude, longitude, radiusKm);
    }
    // Get only active stores
    else if (activeOnly === 'true') {
      stores = await getActiveStores();
    }
    // Get all stores
    else {
      stores = await getAllStores();
    }

    return NextResponse.json({
      success: true,
      stores,
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
