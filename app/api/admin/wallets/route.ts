/**
 * Admin Wallet Management API
 * GET /api/admin/wallets - List all user wallets
 * POST /api/admin/wallets - Freeze/unfreeze or adjust balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import { getWalletStats, setWalletFrozen, adjustBalance } from '@/lib/supabase/wallet-service';

export const dynamic = 'force-dynamic';

// GET: List all wallets with stats
export async function GET(request: NextRequest) {
    try {
        // Verify admin
        if (!await verifyAdminFromRequest(request)) {
            return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
        const search = searchParams.get('search') || '';
        const frozenOnly = searchParams.get('frozen') === 'true';
        const offset = (page - 1) * limit;

        // Build query
        let query = getSupabaseAdmin()
            .from('users')
            .select('user_id, email, display_name, wallet_balance, wallet_frozen, wallet_frozen_reason, created_at', { count: 'exact' })
            .order('wallet_balance', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
        }

        if (frozenOnly) {
            query = query.eq('wallet_frozen', true);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[API] /api/admin/wallets error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get overall stats
        const stats = await getWalletStats();

        return NextResponse.json({
            success: true,
            data: {
                wallets: (data || []).map((u: any) => ({
                    userId: u.user_id,
                    email: u.email,
                    displayName: u.display_name,
                    balance: parseFloat(u.wallet_balance) || 0,
                    frozen: u.wallet_frozen || false,
                    frozenReason: u.wallet_frozen_reason,
                    createdAt: u.created_at,
                })),
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit),
                },
                stats,
            },
        });
    } catch (error: any) {
        console.error('[API] /api/admin/wallets error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Freeze/Unfreeze or Adjust balance
export async function POST(request: NextRequest) {
    try {
        // Verify admin
        if (!await verifyAdminFromRequest(request)) {
            return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 });
        }

        const body = await request.json();
        const { action, userId, ...params } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get admin info from auth header
        const authHeader = request.headers.get('authorization');
        const { data: { user } } = await getSupabaseAdmin().auth.getUser(
            authHeader?.replace('Bearer ', '') || ''
        );

        // Get admin ID from admins table
        const { data: adminData } = await getSupabaseAdmin()
            .from('admins')
            .select('admin_id')
            .eq('email', user?.email || '')
            .single();

        const adminId = adminData?.admin_id || user?.id || 'system';

        switch (action) {
            case 'freeze':
            case 'unfreeze': {
                const result = await setWalletFrozen({
                    userId,
                    frozen: action === 'freeze',
                    reason: params.reason || (action === 'freeze' ? 'Admin action' : 'Unlocked by admin'),
                    adminId,
                });
                return NextResponse.json(result);
            }

            case 'adjust': {
                if (!params.amount || !params.type || !params.reason) {
                    return NextResponse.json(
                        { error: 'amount, type, and reason are required' },
                        { status: 400 }
                    );
                }
                const result = await adjustBalance({
                    userId,
                    amount: parseFloat(params.amount),
                    type: params.type as 'add' | 'subtract',
                    reason: params.reason,
                    adminId,
                });
                return NextResponse.json(result);
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[API] /api/admin/wallets POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
