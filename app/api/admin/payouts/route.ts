import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

async function verifyAdminAccess(supabase: any, userId: string) {
    const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (!admin || admin.role !== 'super_admin') {
        throw new Error('Super admin access required');
    }
}

// GET - List pending payouts
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyAdminAccess(supabase, user.id);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pending';

        const { data: payouts, error } = await supabase
            .from('partner_payouts')
            .select(
                `
        payout_id,
        total_revenue,
        transaction_count,
        status,
        created_at,
        payout_period_start,
        payout_period_end,
        bank_transfer_reference,
        stores:partner_id (
          store_id,
          name,
          bank_account_number,
          bank_name,
          bank_account_holder
        )
      `
            )
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            payouts: payouts || [],
            count: payouts?.length || 0,
        });
    } catch (error: any) {
        if (error.message === 'Super admin access required') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Process payout
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyAdminAccess(supabase, user.id);

        const body = await req.json();
        const { payout_id, action, bank_transfer_reference } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        if (action === 'approve' && !bank_transfer_reference) {
            return NextResponse.json(
                { error: 'Bank transfer reference required for approval' },
                { status: 400 }
            );
        }

        // Get payout details
        const { data: payout, error: fetchError } = await supabase
            .from('partner_payouts')
            .select('payout_id, partner_id, total_revenue, status')
            .eq('payout_id', payout_id)
            .single();

        if (fetchError || !payout) {
            return NextResponse.json(
                { error: 'Payout not found' },
                { status: 404 }
            );
        }

        if (payout.status !== 'pending') {
            return NextResponse.json(
                { error: 'Payout already processed' },
                { status: 400 }
            );
        }

        const newStatus = action === 'approve' ? 'completed' : 'cancelled';
        const updateData: any = {
            status: newStatus,
            processed_by: user.id,
            processed_at: new Date().toISOString(),
        };

        if (action === 'approve') {
            updateData.bank_transfer_reference = bank_transfer_reference;
            updateData.paid_at = new Date().toISOString();
            updateData.net_payout = payout.total_revenue - 1500; // Deduct bank fee
            updateData.bank_transfer_fee = 1500;
        }

        // Update payout
        const { error: updateError } = await supabase
            .from('partner_payouts')
            .update(updateData)
            .eq('payout_id', payout_id);

        if (updateError) {
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 }
            );
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
            actor_id: user.id,
            actor_type: 'admin',
            action: `payout_${action}`,
            resource_type: 'partner_payout',
            resource_id: payout_id,
            metadata: {
                partner_id: payout.partner_id,
                amount: payout.total_revenue,
                bank_reference: bank_transfer_reference,
            },
        });

        return NextResponse.json({
            success: true,
            payout_id,
            status: newStatus,
            message: `Payout ${action}d successfully`,
        });
    } catch (error: any) {
        if (error.message === 'Super admin access required') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
