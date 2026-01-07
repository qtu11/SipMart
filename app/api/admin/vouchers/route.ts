import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/vouchers
 * Lấy danh sách voucher (Admin only)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Get auth token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        // Verify user with token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('user_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        // Get query params
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const isActive = searchParams.get('isActive');

        let query = supabase
            .from('vouchers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filter by search (code or name)
        if (search) {
            query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
        }

        // Filter by active status
        if (isActive !== null && isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true');
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: vouchers, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            vouchers: vouchers || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        });

    } catch (error: any) {
        console.error('GET /api/admin/vouchers error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vouchers', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/vouchers
 * Tạo voucher mới (Admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Get auth token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        // Verify user with token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('user_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const {
            code,
            name,
            description,
            discount_type,
            discount_value,
            max_discount,
            min_order_value,
            usage_limit,
            usage_per_user,
            valid_from,
            valid_until,
            target_rank,
            is_active
        } = body;

        // Validation
        if (!code || !name || !discount_type || !discount_value) {
            return NextResponse.json(
                { error: 'Missing required fields: code, name, discount_type, discount_value' },
                { status: 400 }
            );
        }

        if (!['percent', 'fixed'].includes(discount_type)) {
            return NextResponse.json(
                { error: 'Invalid discount_type. Must be "percent" or "fixed"' },
                { status: 400 }
            );
        }

        if (discount_value <= 0) {
            return NextResponse.json(
                { error: 'discount_value must be greater than 0' },
                { status: 400 }
            );
        }

        if (discount_type === 'percent' && discount_value > 100) {
            return NextResponse.json(
                { error: 'Percent discount cannot exceed 100%' },
                { status: 400 }
            );
        }

        // Insert voucher
        const { data: voucher, error } = await supabase
            .from('vouchers')
            .insert({
                code: code.toUpperCase(),
                name,
                description,
                discount_type,
                discount_value,
                max_discount,
                min_order_value: min_order_value || 0,
                usage_limit,
                usage_per_user: usage_per_user || 1,
                valid_from: valid_from || new Date().toISOString(),
                valid_until,
                target_rank,
                is_active: is_active !== undefined ? is_active : true,
                created_by: admin.admin_id
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json(
                    { error: 'Voucher code already exists' },
                    { status: 409 }
                );
            }
            throw error;
        }

        return NextResponse.json({
            message: 'Voucher created successfully',
            voucher
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST /api/admin/vouchers error:', error);
        return NextResponse.json(
            { error: 'Failed to create voucher', details: error.message },
            { status: 500 }
        );
    }
}
