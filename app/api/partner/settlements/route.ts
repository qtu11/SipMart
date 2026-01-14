export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get settlements history
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'financial', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const year = searchParams.get('year');

        // Get partner's stores
        const { data: branches } = await supabase
            .from('partner_branches')
            .select('store_id')
            .eq('partner_id', authResult.partnerId);

        const storeIds = branches?.map(b => b.store_id).filter(Boolean) || [];

        if (storeIds.length === 0) {
            return jsonResponse({ settlements: [], total: 0 });
        }

        // Get settlements
        let query = supabase
            .from('settlements')
            .select(`
                settlement_id,
                store_id,
                period_start,
                period_end,
                total_transactions,
                total_revenue,
                commission_amount,
                fixed_fee,
                net_payable,
                status,
                paid_at,
                created_at,
                notes,
                stores (name)
            `)
            .in('store_id', storeIds)
            .order('period_start', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (year) {
            const startOfYear = new Date(parseInt(year), 0, 1).toISOString();
            const endOfYear = new Date(parseInt(year), 11, 31).toISOString();
            query = query.gte('period_start', startOfYear).lte('period_end', endOfYear);
        }

        const { data: settlements, error } = await query.limit(24); // Last 2 years

        if (error) {
            logger.error('Get settlements error', error);
            return errorResponse('Không thể lấy lịch sử đối soát', 500);
        }

        // Calculate summary
        const summary = {
            totalPending: 0,
            totalApproved: 0,
            totalPaid: 0
        };

        settlements?.forEach(s => {
            const amount = Number(s.net_payable) || 0;
            if (s.status === 'pending') summary.totalPending += amount;
            else if (s.status === 'approved') summary.totalApproved += amount;
            else if (s.status === 'paid') summary.totalPaid += amount;
        });

        const transformedSettlements = settlements?.map(s => ({
            id: s.settlement_id,
            storeName: (s.stores as any)?.name,
            periodStart: s.period_start,
            periodEnd: s.period_end,
            period: `${new Date(s.period_start).getMonth() + 1}/${new Date(s.period_start).getFullYear()}`,
            totalTransactions: s.total_transactions,
            totalRevenue: s.total_revenue,
            commissionAmount: s.commission_amount,
            fixedFee: s.fixed_fee,
            netPayable: s.net_payable,
            status: s.status,
            paidAt: s.paid_at,
            createdAt: s.created_at,
            notes: s.notes
        })) || [];

        return jsonResponse({
            settlements: transformedSettlements,
            total: transformedSettlements.length,
            summary
        });

    } catch (error: any) {
        logger.error('Partner Settlements Error', error);
        return errorResponse(error.message, 500);
    }
}
