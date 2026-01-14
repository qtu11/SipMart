export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get inventory stats for partner's branches
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'inventory', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branch_id');

        // Get branches
        let branchQuery = supabase
            .from('partner_branches')
            .select(`
                branch_id,
                name,
                store_id,
                cup_capacity,
                current_clean_cups,
                current_dirty_cups,
                accepts_borrow,
                accepts_return
            `)
            .eq('partner_id', authResult.partnerId)
            .eq('is_active', true);

        if (branchId) {
            branchQuery = branchQuery.eq('branch_id', branchId);
        } else if (authResult.branchId && authResult.role !== 'owner') {
            branchQuery = branchQuery.eq('branch_id', authResult.branchId);
        }

        const { data: branches } = await branchQuery;
        const storeIds = branches?.map(b => b.store_id).filter(Boolean) || [];

        if (storeIds.length === 0) {
            return jsonResponse({
                summary: {
                    totalCapacity: 0,
                    cleanCups: 0,
                    dirtyCups: 0,
                    inUse: 0,
                    available: 0,
                    cleaning: 0,
                    damaged: 0,
                    lost: 0
                },
                branches: [],
                alerts: []
            });
        }

        // Get store stats
        const { data: stores } = await supabase
            .from('stores')
            .select('store_id, cup_available, cup_in_use, cup_cleaning, cup_total')
            .in('store_id', storeIds);

        // Get cups with status breakdown
        const { data: cupStats } = await supabase
            .from('cups')
            .select('status')
            .in('current_store_id', storeIds);

        const statusCounts = {
            available: 0,
            in_use: 0,
            cleaning: 0,
            damaged: 0,
            lost: 0
        };

        cupStats?.forEach(cup => {
            if (cup.status === 'available') statusCounts.available++;
            else if (cup.status === 'in_use') statusCounts.in_use++;
            else if (cup.status === 'cleaning') statusCounts.cleaning++;
            else if (cup.status === 'broken') statusCounts.damaged++;
            else if (cup.status === 'lost') statusCounts.lost++;
        });

        // Calculate summary
        const summary = {
            totalCapacity: branches?.reduce((sum, b) => sum + (b.cup_capacity || 0), 0) || 0,
            cleanCups: branches?.reduce((sum, b) => sum + (b.current_clean_cups || 0), 0) || 0,
            dirtyCups: branches?.reduce((sum, b) => sum + (b.current_dirty_cups || 0), 0) || 0,
            inUse: statusCounts.in_use,
            available: statusCounts.available,
            cleaning: statusCounts.cleaning,
            damaged: statusCounts.damaged,
            lost: statusCounts.lost
        };

        // Build branch details
        const branchDetails = branches?.map(b => {
            const store = stores?.find(s => s.store_id === b.store_id);
            const utilization = b.cup_capacity > 0
                ? Math.round((b.current_clean_cups + b.current_dirty_cups) / b.cup_capacity * 100)
                : 0;

            return {
                id: b.branch_id,
                name: b.name,
                capacity: b.cup_capacity,
                cleanCups: b.current_clean_cups,
                dirtyCups: b.current_dirty_cups,
                available: store?.cup_available || 0,
                inUse: store?.cup_in_use || 0,
                cleaning: store?.cup_cleaning || 0,
                utilization,
                acceptsBorrow: b.accepts_borrow,
                acceptsReturn: b.accepts_return
            };
        }) || [];

        // Generate alerts
        const alerts: any[] = [];
        branchDetails.forEach(b => {
            if (b.cleanCups < 10) {
                alerts.push({
                    type: 'low_stock',
                    severity: b.cleanCups < 5 ? 'critical' : 'warning',
                    branchId: b.id,
                    branchName: b.name,
                    message: `Chi nhánh ${b.name} chỉ còn ${b.cleanCups} ly sạch`,
                    value: b.cleanCups
                });
            }
            if (b.dirtyCups > 30) {
                alerts.push({
                    type: 'high_dirty',
                    severity: b.dirtyCups > 50 ? 'critical' : 'warning',
                    branchId: b.id,
                    branchName: b.name,
                    message: `Chi nhánh ${b.name} có ${b.dirtyCups} ly bẩn cần thu gom`,
                    value: b.dirtyCups
                });
            }
        });

        return jsonResponse({
            summary,
            branches: branchDetails,
            alerts,
            lastUpdated: new Date().toISOString()
        });

    } catch (error: any) {
        logger.error('Partner Inventory Error', error);
        return errorResponse(error.message, 500);
    }
}
