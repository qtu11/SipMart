import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import { clearConfigCache } from '@/lib/payment/get-config';

const supabase = () => getSupabaseAdmin();

// Mask sensitive values for display
function maskValue(value: string, showLast = 4): string {
    if (!value || value.length <= showLast) return '****';
    return '*'.repeat(value.length - showLast) + value.slice(-showLast);
}

// GET: List all payment settings
export async function GET(request: NextRequest) {
    try {
        if (!(await verifyAdminFromRequest(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');

        let query = supabase()
            .from('payment_settings')
            .select('id, provider_name, config_key, config_value, is_sensitive, is_active, description, updated_at')
            .order('provider_name')
            .order('config_key');

        if (provider) {
            query = query.eq('provider_name', provider);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Mask sensitive values
        const maskedData = data?.map(row => ({
            ...row,
            config_value: row.is_sensitive ? maskValue(row.config_value) : row.config_value,
            config_value_raw: undefined,
        }));

        return NextResponse.json({ settings: maskedData });
    } catch (error: any) {
        console.error('Payment settings GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update a payment setting
export async function PUT(request: NextRequest) {
    try {
        if (!(await verifyAdminFromRequest(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, config_value, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: 'Setting ID required' }, { status: 400 });
        }

        const updateData: any = { updated_at: new Date().toISOString() };

        if (config_value !== undefined) {
            updateData.config_value = config_value;
        }

        if (is_active !== undefined) {
            updateData.is_active = is_active;
        }

        const { data, error } = await supabase()
            .from('payment_settings')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        clearConfigCache();

        return NextResponse.json({
            success: true,
            setting: {
                ...data,
                config_value: data.is_sensitive ? maskValue(data.config_value) : data.config_value,
            },
        });
    } catch (error: any) {
        console.error('Payment settings PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Toggle provider active status
export async function POST(request: NextRequest) {
    try {
        if (!(await verifyAdminFromRequest(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { provider_name, is_active } = body;

        if (!provider_name) {
            return NextResponse.json({ error: 'Provider name required' }, { status: 400 });
        }

        const { data, error } = await supabase()
            .from('payment_settings')
            .update({ is_active, updated_at: new Date().toISOString() })
            .eq('provider_name', provider_name)
            .select();

        if (error) throw error;

        clearConfigCache();

        return NextResponse.json({ success: true, updated: data?.length || 0 });
    } catch (error: any) {
        console.error('Payment settings POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
