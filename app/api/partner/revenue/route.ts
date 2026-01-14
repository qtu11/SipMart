import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get revenue statistics
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
        const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        // Get branches
        const { data: branches } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id, name')
            .eq('partner_id', authResult.partnerId)
            .eq('is_active', true);

        const storeIds = branches?.map(b => b.store_id).filter(Boolean) || [];

        if (storeIds.length === 0) {
            return jsonResponse({
                summary: {
                    totalScans: 0,
                    handlingFeeEarned: 0,
                    plasticSavingValue: 0,
                    subscriptionFeePaid: 0,
                    netProfit: 0
                },
                breakdown: [],
                chart: []
            });
        }

        // Calculate date range
        const now = new Date();
        let queryStartDate: Date;
        let queryEndDate = endDate ? new Date(endDate) : now;

        if (startDate) {
            queryStartDate = new Date(startDate);
        } else {
            switch (period) {
                case 'daily':
                    queryStartDate = new Date(now);
                    queryStartDate.setHours(0, 0, 0, 0);
                    break;
                case 'weekly':
                    queryStartDate = new Date(now);
                    queryStartDate.setDate(queryStartDate.getDate() - 7);
                    break;
                case 'monthly':
                default:
                    queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
            }
        }

        // Get transactions in period
        const { data: transactions, count: totalScans } = await supabase
            .from('transactions')
            .select('transaction_id, deposit_amount, green_points_earned, borrow_time, status', { count: 'exact' })
            .in('borrow_store_id', storeIds)
            .gte('borrow_time', queryStartDate.toISOString())
            .lte('borrow_time', queryEndDate.toISOString());

        // Get contract for fee calculations
        const { data: contract } = await supabase
            .from('partner_contracts')
            .select('handling_fee_per_scan, plastic_saving_unit_price, fixed_fee, commission_rate')
            .eq('store_id', storeIds[0])
            .eq('status', 'active')
            .single();

        const handlingFeePerScan = Number(contract?.handling_fee_per_scan) || 200;
        const plasticSavingUnitPrice = Number(contract?.plastic_saving_unit_price) || 1500;
        const monthlyFee = Number(contract?.fixed_fee) || 0;
        const commissionRate = Number(contract?.commission_rate) || 0;

        // Calculate totals
        const scansCount = totalScans || 0;
        const handlingFeeEarned = scansCount * handlingFeePerScan;
        const plasticSavingValue = scansCount * plasticSavingUnitPrice;
        const netProfit = handlingFeeEarned + plasticSavingValue - monthlyFee;

        // Generate chart data
        const chartData: any[] = [];
        const groupBy = period === 'daily' ? 'hour' : period === 'weekly' ? 'day' : 'day';

        if (transactions && transactions.length > 0) {
            const grouped = new Map<string, number>();

            transactions.forEach(tx => {
                const date = new Date(tx.borrow_time);
                let key: string;

                if (groupBy === 'hour') {
                    key = date.getHours().toString().padStart(2, '0') + ':00';
                } else {
                    key = date.toISOString().split('T')[0];
                }

                grouped.set(key, (grouped.get(key) || 0) + 1);
            });

            grouped.forEach((count, label) => {
                chartData.push({ label, value: count, revenue: count * handlingFeePerScan });
            });

            chartData.sort((a, b) => a.label.localeCompare(b.label));
        }

        // Branch breakdown
        const branchBreakdown = await Promise.all(
            (branches || []).map(async (branch) => {
                const { count } = await supabase
                    .from('transactions')
                    .select('transaction_id', { count: 'exact', head: true })
                    .eq('borrow_store_id', branch.store_id)
                    .gte('borrow_time', queryStartDate.toISOString())
                    .lte('borrow_time', queryEndDate.toISOString());

                return {
                    branchId: branch.branch_id,
                    branchName: branch.name,
                    scans: count || 0,
                    revenue: (count || 0) * handlingFeePerScan
                };
            })
        );

        return jsonResponse({
            period: {
                type: period,
                startDate: queryStartDate.toISOString(),
                endDate: queryEndDate.toISOString()
            },
            summary: {
                totalScans: scansCount,
                handlingFeeEarned,
                plasticSavingValue,
                subscriptionFeePaid: monthlyFee,
                commissionPaid: handlingFeeEarned * (commissionRate / 100),
                netProfit
            },
            contract: {
                handlingFeePerScan,
                plasticSavingUnitPrice,
                monthlyFee,
                commissionRate
            },
            breakdown: branchBreakdown,
            chart: chartData
        });

    } catch (error: any) {
        logger.error('Partner Revenue Error', error);
        return errorResponse(error.message, 500);
    }
}
