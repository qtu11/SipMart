import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/partners/accounts
 * List merchant accounts
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Auth check...
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) { // Simplification for brevity
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: accounts, error } = await supabase
            .from('merchant_accounts')
            .select(`
                *,
                store:stores(name),
                user:users!merchant_accounts_user_id_fkey(email, display_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ accounts: accounts || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/partners/accounts
 * Create new merchant account (link user to store)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();

        // Check if user exists first (by email) to get user_id
        const { email, store_id, role, pin_code } = body;

        const { data: user } = await supabase.from('users').select('user_id').eq('email', email).single();
        if (!user) {
            return NextResponse.json({ error: 'User email not found. User must register first.' }, { status: 404 });
        }

        const { data: account, error } = await supabase
            .from('merchant_accounts')
            .insert({
                store_id,
                user_id: user.user_id,
                role,
                pin_code
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ account }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
