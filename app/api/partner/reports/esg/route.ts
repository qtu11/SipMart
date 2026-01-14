import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get ESG (Environmental, Social, Governance) report
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
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        // Get branches
        const { data: branches } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id, name')
            .eq('partner_id', authResult.partnerId);

        const storeIds = branches?.map(b => b.store_id).filter(Boolean) || [];

        if (storeIds.length === 0) {
            return jsonResponse({
                year,
                summary: {
                    totalCupsReused: 0,
                    plasticAvoidedKg: 0,
                    co2ReducedKg: 0,
                    waterSavedLiters: 0,
                    treesPlantedEquivalent: 0
                },
                monthlyBreakdown: [],
                comparison: null
            });
        }

        // Get monthly transactions for the year
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const { data: transactions } = await supabase
            .from('transactions')
            .select('borrow_time, status')
            .in('borrow_store_id', storeIds)
            .gte('borrow_time', startOfYear.toISOString())
            .lte('borrow_time', endOfYear.toISOString())
            .eq('status', 'completed');

        // Group by month
        const monthlyData = new Map<number, number>();
        for (let i = 0; i < 12; i++) {
            monthlyData.set(i, 0);
        }

        transactions?.forEach(tx => {
            const month = new Date(tx.borrow_time).getMonth();
            monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
        });

        // Calculate ESG metrics
        const totalCups = transactions?.length || 0;
        const plasticPerCup = 15;     // grams
        const co2PerCup = 40;         // grams
        const waterPerCup = 0.5;      // liters
        const co2PerTree = 21000;     // grams per year

        const summary = {
            totalCupsReused: totalCups,
            plasticAvoidedKg: Math.round(totalCups * plasticPerCup) / 1000,
            co2ReducedKg: Math.round(totalCups * co2PerCup) / 1000,
            waterSavedLiters: Math.round(totalCups * waterPerCup * 10) / 10,
            treesPlantedEquivalent: Math.round((totalCups * co2PerCup) / co2PerTree * 100) / 100
        };

        // Monthly breakdown
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        const monthlyBreakdown = monthNames.map((name, index) => {
            const cups = monthlyData.get(index) || 0;
            return {
                month: name,
                monthIndex: index + 1,
                cupsReused: cups,
                plasticSavedGrams: cups * plasticPerCup,
                co2SavedGrams: cups * co2PerCup,
                waterSavedLiters: Math.round(cups * waterPerCup * 10) / 10
            };
        });

        // Get last year's data for comparison
        const lastYear = year - 1;
        const startOfLastYear = new Date(lastYear, 0, 1);
        const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59);

        const { count: lastYearCount } = await supabase
            .from('transactions')
            .select('transaction_id', { count: 'exact', head: true })
            .in('borrow_store_id', storeIds)
            .gte('borrow_time', startOfLastYear.toISOString())
            .lte('borrow_time', endOfLastYear.toISOString())
            .eq('status', 'completed');

        const comparison = lastYearCount && lastYearCount > 0 ? {
            lastYearCups: lastYearCount,
            change: Math.round(((totalCups - lastYearCount) / lastYearCount) * 100),
            improved: totalCups > lastYearCount
        } : null;

        // Calculate environmental equivalents
        const equivalents = {
            plasticBottles: Math.round(summary.plasticAvoidedKg / 0.025), // 25g per bottle
            carKilometers: Math.round(summary.co2ReducedKg / 0.12),       // 120g CO2 per km
            showerMinutes: Math.round(summary.waterSavedLiters / 9),      // 9L per minute shower
            phonesCharged: Math.round(summary.co2ReducedKg / 0.005)       // 5g CO2 per phone charge
        };

        return jsonResponse({
            year,
            partner: {
                id: authResult.partnerId,
                branchCount: branches?.length || 0
            },
            summary,
            equivalents,
            monthlyBreakdown,
            comparison,
            generatedAt: new Date().toISOString(),
            methodology: {
                plasticPerCup: `${plasticPerCup}g`,
                co2PerCup: `${co2PerCup}g`,
                waterPerCup: `${waterPerCup}L`,
                source: 'SipSmart ESG Calculation Standard v1.0'
            }
        });

    } catch (error: any) {
        logger.error('Partner ESG Report Error', error);
        return errorResponse(error.message, 500);
    }
}
