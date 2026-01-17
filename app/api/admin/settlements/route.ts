/**
 * Admin Settlements API
 * GET /api/admin/settlements - List settlement batches
 * POST /api/admin/settlements - Create, approve, or process payout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import {
    getSettlementBatches,
    createSettlementBatch,
    approveSettlement,
    processSettlementPayout,
    getEscrowSummary,
    generateReconciliationReport,
} from '@/lib/supabase/settlement-service';

export const dynamic = 'force-dynamic';

// GET: List settlements
export async function GET(request: NextRequest) {
    try {
        // Verify admin
        if (!await verifyAdminFromRequest(request)) {
            return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
        const status = searchParams.get('status') as any || undefined;
        const partnerId = searchParams.get('partnerId') || undefined;

        const { batches, total } = await getSettlementBatches({
            page,
            limit,
            status,
            partnerId,
        });

        // Get escrow summary
        const escrowSummary = await getEscrowSummary();

        return NextResponse.json({
            success: true,
            data: {
                settlements: batches.map((b) => ({
                    ...b,
                    periodStart: b.periodStart.toISOString(),
                    periodEnd: b.periodEnd.toISOString(),
                    approvedAt: b.approvedAt?.toISOString(),
                    paidAt: b.paidAt?.toISOString(),
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                escrowSummary,
            },
        });
    } catch (error: any) {
        console.error('[API] /api/admin/settlements GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create, approve, or process payout
export async function POST(request: NextRequest) {
    try {
        // Verify admin
        if (!await verifyAdminFromRequest(request)) {
            return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 });
        }

        const body = await request.json();
        const { action, ...params } = body;

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
            case 'create': {
                if (!params.partnerId || !params.periodStart || !params.periodEnd) {
                    return NextResponse.json(
                        { error: 'partnerId, periodStart, periodEnd are required' },
                        { status: 400 }
                    );
                }
                const result = await createSettlementBatch({
                    partnerId: params.partnerId,
                    periodStart: new Date(params.periodStart),
                    periodEnd: new Date(params.periodEnd),
                });
                return NextResponse.json(result);
            }

            case 'approve': {
                if (!params.batchId) {
                    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
                }
                const result = await approveSettlement({
                    batchId: params.batchId,
                    adminId,
                });
                return NextResponse.json(result);
            }

            case 'payout': {
                if (!params.batchId || !params.paymentReference) {
                    return NextResponse.json(
                        { error: 'batchId and paymentReference are required' },
                        { status: 400 }
                    );
                }
                const result = await processSettlementPayout({
                    batchId: params.batchId,
                    paymentReference: params.paymentReference,
                });
                return NextResponse.json(result);
            }

            case 'reconciliation': {
                if (!params.startDate || !params.endDate) {
                    return NextResponse.json(
                        { error: 'startDate and endDate are required' },
                        { status: 400 }
                    );
                }
                const report = await generateReconciliationReport({
                    startDate: new Date(params.startDate),
                    endDate: new Date(params.endDate),
                });
                return NextResponse.json({ success: true, data: report });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[API] /api/admin/settlements POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
