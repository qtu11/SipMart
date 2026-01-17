import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server-client';

export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const supabaseAuth = await createClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();

        // Check if stores exist
        const { count } = await supabase.from('stores').select('*', { count: 'exact', head: true });

        if (count && count > 0) {
            return NextResponse.json({ message: 'Stores already exist', added: 0 });
        }

        // Seed stores
        const stores = [
            {
                name: 'SipSmart Central',
                address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
                gps_lat: 10.776889,
                gps_lng: 106.700806,
                partner_status: 'active',
                cup_available: 100,
                cup_total: 100
            },
            {
                name: 'SipSmart Campus',
                address: 'Làng Đại học Thủ Đức, TP.HCM',
                gps_lat: 10.870000,
                gps_lng: 106.800000,
                partner_status: 'active',
                cup_available: 50,
                cup_total: 50
            },
            {
                name: 'SipSmart Mall',
                address: 'Landmark 81, Bình Thạnh, TP.HCM',
                gps_lat: 10.795000,
                gps_lng: 106.720000,
                partner_status: 'active',
                cup_available: 200,
                cup_total: 200
            }
        ];

        const { data, error } = await supabase.from('stores').insert(stores).select();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Đã tạo 3 cửa hàng mẫu thành công!',
            stores: data
        });

    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
