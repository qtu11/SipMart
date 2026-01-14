import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get KPI cards data
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

        // Get branches
        const { data: branches } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id')
            .eq('partner_id', authResult.partnerId)
            .eq('is_active', true);

        const storeIds = branches?.map(b => b.store_id).filter(Boolean) || [];

        if (storeIds.length === 0) {
            return jsonResponse({
                totalBorrows: 0,
                totalReturns: 0,
                activeTransactions: 0,
                esg: {
                    cupsReused: 0,
                    plasticSavedKg: 0,
                    co2SavedKg: 0,
                    waterSavedLiters: 0,
                    treesEquivalent: 0
                },
                performance: {
                    onTimeReturnRate: 0,
                    avgBorrowDuration: 0,
                    retentionRate: 0,
                    avgDailyTraffic: 0
                },
                comparison: {
                    borrowsChange: 0,
                    returnsChange: 0
                }
            });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // This month's transactions
        const { count: thisMonthBorrows } = await supabase
            .from('transactions')
            .select('transaction_id', { count: 'exact', head: true })
            .in('borrow_store_id', storeIds)
            .gte('borrow_time', startOfMonth.toISOString());

        const { count: thisMonthReturns } = await supabase
            .from('transactions')
            .select('transaction_id', { count: 'exact', head: true })
            .in('return_store_id', storeIds)
            .gte('return_time', startOfMonth.toISOString());

        // Last month's transactions for comparison
        const { count: lastMonthBorrows } = await supabase
            .from('transactions')
            .select('transaction_id', { count: 'exact', head: true })
            .in('borrow_store_id', storeIds)
            .gte('borrow_time', startOfLastMonth.toISOString())
            .lte('borrow_time', endOfLastMonth.toISOString());

        // Active transactions
        const { count: activeTransactions } = await supabase
            .from('transactions')
            .select('transaction_id', { count: 'exact', head: true })
            .in('borrow_store_id', storeIds)
            .eq('status', 'ongoing');

        // Completed transactions for metrics
        const { data: completedTxs } = await supabase
            .from('transactions')
            .select('borrow_time, return_time, is_overdue, user_id')
            .in('borrow_store_id', storeIds)
            .eq('status', 'completed')
            .gte('borrow_time', startOfMonth.toISOString());

        // Calculate on-time return rate
        const totalCompleted = completedTxs?.length || 0;
        const onTimeReturns = completedTxs?.filter(t => !t.is_overdue).length || 0;
        const onTimeReturnRate = totalCompleted > 0 ? Math.round((onTimeReturns / totalCompleted) * 100) : 0;

        // Calculate average borrow duration (in hours)
        let totalDuration = 0;
        completedTxs?.forEach(tx => {
            if (tx.borrow_time && tx.return_time) {
                const duration = new Date(tx.return_time).getTime() - new Date(tx.borrow_time).getTime();
                totalDuration += duration / (1000 * 60 * 60); // Convert to hours
            }
        });
        const avgBorrowDuration = totalCompleted > 0 ? Math.round(totalDuration / totalCompleted * 10) / 10 : 0;

        // Calculate retention rate (unique returning users)
        const uniqueUsers = new Set(completedTxs?.map(t => t.user_id) || []);
        const { data: repeatUsers } = await supabase
            .from('transactions')
            .select('user_id')
            .in('borrow_store_id', storeIds)
            .eq('status', 'completed')
            .lt('borrow_time', startOfMonth.toISOString());

        const previousUsers = new Set(repeatUsers?.map(t => t.user_id) || []);
        const returningUsers = [...uniqueUsers].filter(u => previousUsers.has(u)).length;
        const retentionRate = uniqueUsers.size > 0 ? Math.round((returningUsers / uniqueUsers.size) * 100) : 0;

        // Calculate average daily traffic
        const daysInMonth = now.getDate();
        const avgDailyTraffic = Math.round((thisMonthBorrows || 0) / daysInMonth);

        // ESG metrics
        const cupsReused = thisMonthBorrows || 0;
        const plasticSavedKg = Math.round(cupsReused * 15) / 1000;   // 15g per cup
        const co2SavedKg = Math.round(cupsReused * 40) / 1000;       // 40g CO2 per cup
        const waterSavedLiters = Math.round(cupsReused * 0.5 * 10) / 10; // 0.5L per cup
        const treesEquivalent = Math.round(co2SavedKg / 21 * 100) / 100; // 21kg CO2 per tree

        // Calculate comparison percentages
        const borrowsChange = lastMonthBorrows && lastMonthBorrows > 0
            ? Math.round(((thisMonthBorrows || 0) - lastMonthBorrows) / lastMonthBorrows * 100)
            : 0;

        return jsonResponse({
            totalBorrows: thisMonthBorrows || 0,
            totalReturns: thisMonthReturns || 0,
            activeTransactions: activeTransactions || 0,
            esg: {
                cupsReused,
                plasticSavedKg,
                co2SavedKg,
                waterSavedLiters,
                treesEquivalent
            },
            performance: {
                onTimeReturnRate,
                avgBorrowDuration,
                retentionRate,
                avgDailyTraffic
            },
            comparison: {
                borrowsChange,
                period: 'vs last month'
            },
            period: {
                current: `${now.getMonth() + 1}/${now.getFullYear()}`,
                startDate: startOfMonth.toISOString(),
                endDate: now.toISOString()
            }
        });

    } catch (error: any) {
        logger.error('Partner Analytics KPI Error', error);
        return errorResponse(error.message, 500);
    }
}
