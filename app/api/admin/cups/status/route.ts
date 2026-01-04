import { NextRequest, NextResponse } from 'next/server';
import { checkAdminApi } from '@/lib/supabase/admin';

// Force update cup status
export async function PATCH(request: NextRequest) {
    try {
        if (!await checkAdminApi(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { cupId, status } = body;

        if (!cupId || !status) {
            return NextResponse.json({ error: 'Missing cupId or status' }, { status: 400 });
        }

        const supabase = (await import('@/lib/supabase/server')).getSupabaseAdmin();

        const updateData: any = { status };
        if (status === 'cleaning') {
            updateData.last_cleaned_at = new Date().toISOString();
        } else if (status === 'available') {
            // If moving to available, maybe clear current transaction?
            updateData.current_transaction_id = null;
            updateData.current_user_id = null;
        }

        const { data, error } = await supabase
            .from('cups')
            .update(updateData)
            .eq('cup_id', cupId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, cup: data });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
