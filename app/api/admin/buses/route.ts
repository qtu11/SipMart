import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/admin/buses
 * Get all bus QR codes
 */
export async function GET() {
    try {
        const supabase = getSupabaseAdmin();

        const { data: buses, error } = await supabase
            .from('buses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Table might not exist yet
            if (error.code === '42P01') {
                return NextResponse.json({ buses: [] });
            }
            throw error;
        }

        return NextResponse.json({ buses: buses || [] });

    } catch (error: any) {
        console.error('[Admin Buses] Error:', error);
        return NextResponse.json({ buses: [] });
    }
}

/**
 * POST /api/admin/buses
 * Create bus QR codes
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { routeCode, routeName, quantity = 1 } = body;

        if (!routeCode || !routeName) {
            return NextResponse.json(
                { error: 'routeCode and routeName are required' },
                { status: 400 }
            );
        }

        const createdBuses = [];

        for (let i = 0; i < quantity; i++) {
            const busId = uuidv4();
            const vehicleNumber = `${routeCode}-${String(Date.now()).slice(-4)}-${i + 1}`;

            const { data: bus, error } = await supabase
                .from('buses')
                .insert({
                    bus_id: busId,
                    route_code: routeCode,
                    route_name: routeName,
                    vehicle_number: vehicleNumber,
                    qr_data: `BUS|${busId}|${routeCode}|SipSmart`,
                    status: 'active',
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                // If table doesn't exist, create it first
                if (error.code === '42P01') {
                    // Create table via raw SQL not supported in client
                    // Return error message
                    return NextResponse.json(
                        { error: 'Bảng buses chưa được tạo. Vui lòng chạy migration.' },
                        { status: 500 }
                    );
                }
                throw error;
            }

            if (bus) {
                createdBuses.push(bus);
            }
        }

        return NextResponse.json({
            success: true,
            buses: createdBuses,
            qrFormat: 'BUS|{bus_id}|{route_code}|SipSmart'
        });

    } catch (error: any) {
        console.error('[Admin Buses] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
