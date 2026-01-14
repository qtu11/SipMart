import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get chart data for analytics
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
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'borrows'; // borrows, returns, revenue
        const period = searchParams.get('period') || '7d';   // 7d, 30d, 90d

        // Get branches
        const { data: branches } = await supabase
            .from('partner_branches')
            .select('store_id')
            .eq('partner_id', authResult.partnerId)
            .eq('is_active', true);

        const storeIds = branches?.map(b => b.store_id).filter(Boolean) || [];

        if (storeIds.length === 0) {
            return jsonResponse({ labels: [], datasets: [] });
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let groupFormat: 'day' | 'week' | 'month';

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                groupFormat = 'day';
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                groupFormat = 'day';
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                groupFormat = 'week';
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                groupFormat = 'day';
        }

        // Build query based on type
        const storeIdField = type === 'returns' ? 'return_store_id' : 'borrow_store_id';
        const dateField = type === 'returns' ? 'return_time' : 'borrow_time';

        let query = supabase
            .from('transactions')
            .select(`${dateField}, deposit_amount`)
            .in(storeIdField, storeIds)
            .gte(dateField, startDate.toISOString())
            .not(dateField, 'is', null);

        const { data: transactions } = await query;

        // Group data by date
        const grouped = new Map<string, { count: number; revenue: number }>();

        // Initialize all dates in range
        const tempDate = new Date(startDate);
        while (tempDate <= now) {
            const key = formatDateKey(tempDate, groupFormat);
            grouped.set(key, { count: 0, revenue: 0 });

            if (groupFormat === 'day') {
                tempDate.setDate(tempDate.getDate() + 1);
            } else if (groupFormat === 'week') {
                tempDate.setDate(tempDate.getDate() + 7);
            } else {
                tempDate.setMonth(tempDate.getMonth() + 1);
            }
        }

        // Fill in actual data
        transactions?.forEach(tx => {
            const txDate = new Date((tx as any)[dateField]);
            const key = formatDateKey(txDate, groupFormat);
            const existing = grouped.get(key) || { count: 0, revenue: 0 };
            existing.count += 1;
            existing.revenue += Number(tx.deposit_amount) || 0;
            grouped.set(key, existing);
        });

        // Convert to chart format
        const labels: string[] = [];
        const countData: number[] = [];
        const revenueData: number[] = [];

        // Sort by date
        const sortedKeys = Array.from(grouped.keys()).sort();

        sortedKeys.forEach(key => {
            labels.push(formatLabel(key, groupFormat));
            const data = grouped.get(key)!;
            countData.push(data.count);
            revenueData.push(data.revenue);
        });

        const datasets = [];

        if (type === 'revenue') {
            datasets.push({
                label: 'Doanh thu (VNĐ)',
                data: revenueData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true
            });
        } else {
            datasets.push({
                label: type === 'borrows' ? 'Số lượt mượn' : 'Số lượt trả',
                data: countData,
                borderColor: type === 'borrows' ? '#3b82f6' : '#8b5cf6',
                backgroundColor: type === 'borrows' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                fill: true
            });
        }

        return jsonResponse({
            labels,
            datasets,
            summary: {
                total: countData.reduce((a, b) => a + b, 0),
                average: Math.round(countData.reduce((a, b) => a + b, 0) / countData.length),
                max: Math.max(...countData),
                min: Math.min(...countData)
            },
            period: {
                type: period,
                startDate: startDate.toISOString(),
                endDate: now.toISOString()
            }
        });

    } catch (error: any) {
        logger.error('Partner Analytics Chart Error', error);
        return errorResponse(error.message, 500);
    }
}

function formatDateKey(date: Date, format: 'day' | 'week' | 'month'): string {
    if (format === 'day') {
        return date.toISOString().split('T')[0];
    } else if (format === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return weekStart.toISOString().split('T')[0];
    } else {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
}

function formatLabel(key: string, format: 'day' | 'week' | 'month'): string {
    const date = new Date(key);
    if (format === 'day') {
        return `${date.getDate()}/${date.getMonth() + 1}`;
    } else if (format === 'week') {
        return `Tuần ${date.getDate()}/${date.getMonth() + 1}`;
    } else {
        return `${date.getMonth() + 1}/${date.getFullYear()}`;
    }
}
