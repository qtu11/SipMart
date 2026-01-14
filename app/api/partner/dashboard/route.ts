export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        // Check permission
        const permCheck = requirePermission(authResult, 'dashboard', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();
        const canViewAllBranches = authResult.permissions?.dashboard?.view_all_branches === true;

        // Get branches for this partner
        let branchQuery = supabase
            .from('partner_branches')
            .select('branch_id, store_id')
            .eq('partner_id', authResult.partnerId)
            .eq('is_active', true);

        if (!canViewAllBranches && authResult.branchId) {
            branchQuery = branchQuery.eq('branch_id', authResult.branchId);
        }

        const { data: branches } = await branchQuery;
        const storeIds = branches?.map(b => b.store_id).filter(Boolean) || [];
        const branchIds = branches?.map(b => b.branch_id) || [];

        if (storeIds.length === 0) {
            return jsonResponse({
                revenue: 0,
                orders: 0,
                cupsInUse: 0,
                cupsAvailable: 0,
                cupsCleaning: 0,
                kpi: {
                    plasticSavedKg: 0,
                    co2SavedKg: 0,
                    treesEquivalent: 0,
                    retentionRate: 0
                },
                recentTransactions: [],
                inventoryAlerts: []
            });
        }

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Today's transactions
        const { data: todayTxs, count: todayCount } = await supabase
            .from('transactions')
            .select('transaction_id, deposit_amount, green_points_earned', { count: 'exact' })
            .in('borrow_store_id', storeIds)
            .gte('borrow_time', startOfDay.toISOString());

        const todayRevenue = todayTxs?.reduce((sum, t) => sum + (Number(t.deposit_amount) || 0), 0) || 0;

        // Active cups (ongoing transactions)
        const { count: activeCups } = await supabase
            .from('transactions')
            .select('transaction_id', { count: 'exact' })
            .in('borrow_store_id', storeIds)
            .eq('status', 'ongoing');

        // Store inventory
        const { data: storeStats } = await supabase
            .from('stores')
            .select('cup_available, cup_in_use, cup_cleaning, cup_total')
            .in('store_id', storeIds);

        const inventory = storeStats?.reduce((acc, s) => ({
            available: acc.available + (s.cup_available || 0),
            inUse: acc.inUse + (s.cup_in_use || 0),
            cleaning: acc.cleaning + (s.cup_cleaning || 0),
            total: acc.total + (s.cup_total || 0)
        }), { available: 0, inUse: 0, cleaning: 0, total: 0 }) || { available: 0, inUse: 0, cleaning: 0, total: 0 };

        // Monthly transactions for ESG calculation
        const { count: monthlyTxCount } = await supabase
            .from('transactions')
            .select('transaction_id', { count: 'exact' })
            .in('borrow_store_id', storeIds)
            .gte('borrow_time', startOfMonth.toISOString());

        const cupsReused = monthlyTxCount || 0;
        const plasticSavedKg = (cupsReused * 15) / 1000; // 15g per cup
        const co2SavedKg = (cupsReused * 40) / 1000;     // 40g CO2 per cup
        const treesEquivalent = co2SavedKg / 21;          // 21kg CO2 per tree per year

        // Recent transactions
        const { data: recentTxs } = await supabase
            .from('transactions')
            .select(`
                transaction_id,
                cup_id,
                status,
                deposit_amount,
                green_points_earned,
                borrow_time,
                return_time,
                users!inner (
                    display_name,
                    avatar
                )
            `)
            .in('borrow_store_id', storeIds)
            .order('borrow_time', { ascending: false })
            .limit(10);

        // Branch inventory alerts
        const { data: branchAlerts } = await supabase
            .from('partner_branches')
            .select('branch_id, name, current_clean_cups, current_dirty_cups, cup_capacity')
            .in('branch_id', branchIds)
            .or('current_clean_cups.lt.10,current_dirty_cups.gt.30');

        // Cleaning queue status
        const { data: cleaningQueue } = await supabase
            .from('cleaning_queue')
            .select('queue_id, cup_count, status')
            .in('branch_id', branchIds)
            .in('status', ['pending', 'requested']);

        const pendingCleaning = cleaningQueue?.reduce((sum, q) => sum + (q.cup_count || 0), 0) || 0;

        return jsonResponse({
            // Summary stats
            revenue: todayRevenue,
            orders: todayCount || 0,

            // Inventory
            cupsInUse: activeCups || 0,
            cupsAvailable: inventory.available,
            cupsCleaning: inventory.cleaning,
            cupsTotal: inventory.total,
            pendingCleaning,

            // ESG KPIs
            kpi: {
                cupsReusedThisMonth: cupsReused,
                plasticSavedKg: Math.round(plasticSavedKg * 100) / 100,
                co2SavedKg: Math.round(co2SavedKg * 100) / 100,
                treesEquivalent: Math.round(treesEquivalent * 100) / 100,
                retentionRate: 0 // TODO: Calculate from repeat customers
            },

            // Recent transactions
            recentTransactions: recentTxs?.map(t => ({
                id: t.transaction_id,
                cupId: t.cup_id,
                status: t.status,
                amount: t.deposit_amount,
                points: t.green_points_earned,
                user: (t.users as any)?.display_name || 'Khách',
                avatar: (t.users as any)?.avatar,
                borrowTime: t.borrow_time,
                returnTime: t.return_time
            })) || [],

            // Alerts
            inventoryAlerts: branchAlerts?.map(b => ({
                branchId: b.branch_id,
                branchName: b.name,
                cleanCups: b.current_clean_cups,
                dirtyCups: b.current_dirty_cups,
                capacity: b.cup_capacity,
                alertType: b.current_clean_cups < 10 ? 'low_stock' : 'high_dirty'
            })) || []
        });

    } catch (error: any) {
        logger.error('Partner Dashboard Error', error);
        return errorResponse(error.message, 500);
    }
}
