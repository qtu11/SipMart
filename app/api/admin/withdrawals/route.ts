import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

// Admin verification
async function verifyFinanceAccess(supabase: any, userId: string) {
    const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (!admin || !['super_admin', 'finance_admin'].includes(admin.role)) {
        throw new Error('Finance access required');
    }
    return admin;
}

/**
 * GET /api/admin/withdrawals
 * Get pending partner withdrawal requests
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyFinanceAccess(supabase, user.id);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pending';

        // Get withdrawal requests
        const { data: withdrawals, error } = await supabase
            .from('partner_payouts')
            .select(`
                payout_id,
                partner_id,
                amount,
                processing_fee,
                net_amount,
                status,
                bank_account,
                requested_at,
                processed_at,
                processed_by,
                notes,
                partners:partner_id (
                    partner_name,
                    contact_email
                )
            `)
            .eq('status', status)
            .order('requested_at', { ascending: true });

        if (error) throw error;

        // Get summary stats
        const { data: pendingSum } = await supabase
            .from('partner_payouts')
            .select('amount')
            .eq('status', 'pending');

        const totalPending = (pendingSum || []).reduce(
            (sum, p) => sum + Number(p.amount), 0
        );

        return NextResponse.json({
            withdrawals: withdrawals || [],
            summary: {
                totalPending,
                count: (withdrawals || []).length,
            },
        });

    } catch (error: any) {
        if (error.message === 'Finance access required') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/withdrawals
 * Approve or reject withdrawal requests
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyFinanceAccess(supabase, user.id);

        const body = await req.json();
        const { action, payout_id, notes, batch_ids } = body;

        // Handle batch processing
        if (action === 'batch_approve' && batch_ids?.length > 0) {
            const { error } = await supabase
                .from('partner_payouts')
                .update({
                    status: 'approved',
                    processed_at: new Date().toISOString(),
                    processed_by: user.id,
                    notes: 'Batch approved',
                })
                .in('payout_id', batch_ids);

            if (error) throw error;

            // Create settlement records
            for (const id of batch_ids) {
                await createSettlementRecord(supabase, id, user.id);
            }

            return NextResponse.json({
                success: true,
                message: `${batch_ids.length} payouts approved`,
            });
        }

        // Single payout processing
        if (!payout_id) {
            return NextResponse.json(
                { error: 'payout_id is required' },
                { status: 400 }
            );
        }

        if (!['approve', 'reject', 'complete'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        const newStatus = action === 'approve' ? 'approved'
            : action === 'reject' ? 'rejected'
                : 'completed';

        // Update payout status
        const { data: payout, error: updateError } = await supabase
            .from('partner_payouts')
            .update({
                status: newStatus,
                processed_at: new Date().toISOString(),
                processed_by: user.id,
                notes,
            })
            .eq('payout_id', payout_id)
            .select('partner_id, amount')
            .single();

        if (updateError) throw updateError;

        // If approved, create settlement record
        if (action === 'approve') {
            await createSettlementRecord(supabase, payout_id, user.id);
        }

        // Notify partner
        const { data: partner } = await supabase
            .from('partners')
            .select('user_id')
            .eq('partner_id', payout.partner_id)
            .single();

        if (partner?.user_id) {
            await supabase.from('notifications').insert({
                user_id: partner.user_id,
                type: action === 'approve' ? 'success' : 'warning',
                title: action === 'approve'
                    ? '✅ Yêu cầu rút tiền đã được duyệt'
                    : '❌ Yêu cầu rút tiền bị từ chối',
                message: action === 'approve'
                    ? `Số tiền ${payout.amount.toLocaleString('vi-VN')} VNĐ sẽ được chuyển trong 1-3 ngày làm việc.`
                    : `Lý do: ${notes || 'Không đủ điều kiện'}`,
            });
        }

        return NextResponse.json({
            success: true,
            payout_id,
            status: newStatus,
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Create settlement record for tracking
 */
async function createSettlementRecord(
    supabase: any,
    payoutId: string,
    processedBy: string
) {
    const { data: payout } = await supabase
        .from('partner_payouts')
        .select('partner_id, amount, processing_fee, net_amount, bank_account')
        .eq('payout_id', payoutId)
        .single();

    if (!payout) return;

    await supabase.from('partner_settlements').insert({
        payout_id: payoutId,
        partner_id: payout.partner_id,
        amount: payout.amount,
        fee: payout.processing_fee,
        net_amount: payout.net_amount,
        bank_account: payout.bank_account,
        status: 'pending_transfer',
        created_by: processedBy,
    });
}
