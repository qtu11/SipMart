import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { checkAdminApi } from '@/lib/supabase/admin';

// Prevent static optimization during build
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Skip during build time if environment is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }
    try {
        const auth = await checkAdminApi(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: stores, error } = await getSupabaseAdmin()
            .from('stores')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to camelCase to match previous API response
        const formattedStores = (stores || []).map((s: any) => ({
            storeId: s.store_id,
            name: s.name,
            address: s.address,
            gpsLat: s.gps_lat,
            gpsLng: s.gps_lng,
            cupAvailable: s.cup_available,
            cupInUse: s.cup_in_use,
            cupCleaning: s.cup_cleaning,
            cupTotal: s.cup_total,
            partnerStatus: s.partner_status,
            createdAt: s.created_at,
        }));

        return NextResponse.json({ success: true, stores: formattedStores });
    } catch (error) {
        console.error('Info: Failed to fetch stores', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Skip during build time if environment is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    try {
        const auth = await checkAdminApi(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, address, gpsLat, gpsLng } = body;

        if (!name || !address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: store, error } = await getSupabaseAdmin()
            .from('stores')
            .insert({
                name,
                address,
                gps_lat: gpsLat || 0,
                gps_lng: gpsLng || 0,
                partner_status: 'active',
                cup_available: 0,
                cup_in_use: 0,
                cup_cleaning: 0,
                cup_total: 0,
            })
            .select()
            .single();

        if (error) throw error;

        const formattedStore = {
            storeId: store.store_id,
            name: store.name,
            address: store.address,
            gpsLat: store.gps_lat,
            gpsLng: store.gps_lng,
            partnerStatus: store.partner_status,
            cupAvailable: store.cup_available,
            cupInUse: store.cup_in_use,
            cupCleaning: store.cup_cleaning,
            cupTotal: store.cup_total,
            createdAt: store.created_at,
        };

        return NextResponse.json({ success: true, store: formattedStore });
    } catch (error) {
        console.error('Info: Failed to create store', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
