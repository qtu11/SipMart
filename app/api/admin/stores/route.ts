import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

        const stores = await prisma.store.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                storeId: true,
                name: true,
                address: true,
                gpsLat: true,
                gpsLng: true,
                cupAvailable: true,
                cupInUse: true,
                cupCleaning: true,
                cupTotal: true,
                partnerStatus: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ success: true, stores });
    } catch (error) {
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

        const store = await prisma.store.create({
            data: {
                name,
                address,
                gpsLat: gpsLat || 0,
                gpsLng: gpsLng || 0,
                partnerStatus: 'active',
                cupAvailable: 0,
                cupInUse: 0,
                cupCleaning: 0,
                cupTotal: 0,
            },
        });

        return NextResponse.json({ success: true, store });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
