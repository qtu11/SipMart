import { NextRequest } from 'next/server';
import { getAllStores, getActiveStores, findNearbyStores } from '@/lib/supabase/stores';
import { jsonResponse, errorResponse } from '@/lib/api-utils';

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

    // Debug log
    console.log('[API /stores] Raw stores:', JSON.stringify(stores, null, 2));

    // Transform stores to match frontend interface
    const transformedStores = (stores || [])
      .filter((store: any) => store.gpsLat != null && store.gpsLng != null && !isNaN(store.gpsLat) && !isNaN(store.gpsLng))
      .map((store: any) => ({
        storeId: store.storeId,
        name: store.name,
        address: store.address,
        gpsLocation: {
          lat: store.gpsLat,
          lng: store.gpsLng
        },
        cupInventory: {
          available: store.cupAvailable || 0,
          total: store.cupTotal || 0,
          inUse: store.cupInUse || 0,
          cleaning: store.cupCleaning || 0
        },
        partnerStatus: store.partnerStatus,
        distance: 0 // Will be calculated on frontend
      }));

    return jsonResponse({ stores: transformedStores });

  } catch (error: unknown) {
    return errorResponse(error);
  }
}
