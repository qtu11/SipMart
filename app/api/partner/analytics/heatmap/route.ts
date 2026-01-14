export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get heatmap data for branches
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'analytics', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        // Get all branches with location
        const { data: branches } = await supabase
            .from('partner_branches')
            .select(`
                branch_id,
                name,
                address,
                latitude,
                longitude,
                store_id,
                is_active
            `)
            .eq('partner_id', authResult.partnerId);

        if (!branches || branches.length === 0) {
            return jsonResponse({ branches: [], maxScore: 0 });
        }

        const storeIds = branches.map(b => b.store_id).filter(Boolean);

        // Get transaction counts for each store (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const branchData = await Promise.all(
            branches.map(async (branch) => {
                // Get borrow count
                const { count: borrowCount } = await supabase
                    .from('transactions')
                    .select('transaction_id', { count: 'exact', head: true })
                    .eq('borrow_store_id', branch.store_id)
                    .gte('borrow_time', thirtyDaysAgo.toISOString());

                // Get return count
                const { count: returnCount } = await supabase
                    .from('transactions')
                    .select('transaction_id', { count: 'exact', head: true })
                    .eq('return_store_id', branch.store_id)
                    .gte('return_time', thirtyDaysAgo.toISOString());

                const totalActivity = (borrowCount || 0) + (returnCount || 0);

                return {
                    id: branch.branch_id,
                    name: branch.name,
                    address: branch.address,
                    lat: branch.latitude,
                    lng: branch.longitude,
                    isActive: branch.is_active,
                    metrics: {
                        borrows: borrowCount || 0,
                        returns: returnCount || 0,
                        totalActivity
                    },
                    activityScore: totalActivity
                };
            })
        );

        // Calculate relative scores (0-100)
        const maxActivity = Math.max(...branchData.map(b => b.activityScore), 1);
        const normalizedData = branchData.map(branch => ({
            ...branch,
            activityScore: Math.round((branch.activityScore / maxActivity) * 100)
        }));

        // Sort by activity score
        normalizedData.sort((a, b) => b.activityScore - a.activityScore);

        return jsonResponse({
            branches: normalizedData,
            maxScore: maxActivity,
            period: {
                days: 30,
                startDate: thirtyDaysAgo.toISOString(),
                endDate: new Date().toISOString()
            },
            summary: {
                totalBranches: branches.length,
                activeBranches: branches.filter(b => b.is_active).length,
                topPerformer: normalizedData[0]?.name || null,
                totalActivity: branchData.reduce((sum, b) => sum + b.metrics.totalActivity, 0)
            }
        });

    } catch (error: any) {
        logger.error('Partner Analytics Heatmap Error', error);
        return errorResponse(error.message, 500);
    }
}
