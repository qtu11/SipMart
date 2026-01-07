import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { checkAdminApi } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
    try {
        const auth = await checkAdminApi(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const storeId = searchParams.get('storeId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const supabase = getSupabaseAdmin();

        // Build query
        let query = supabase.from('transactions')
            .select(`
                *,
                users (
                    email,
                    display_name
                ),
                cups (
                    material
                )
            `, { count: 'exact' });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (storeId) {
            query = query.eq('borrow_store_id', storeId);
        }

        // Pagination and sorting
        const { data: transactions, count, error } = await query
            .order('borrow_time', { ascending: false })
            .range(skip, skip + limit - 1);

        if (error) throw error;

        // Map to camelCase and transform relations
        const formattedTransactions = (transactions || []).map((t: any) => ({
            transactionId: t.transaction_id,
            userId: t.user_id,
            cupId: t.cup_id,
            borrowStoreId: t.borrow_store_id,
            returnStoreId: t.return_store_id,
            borrowTime: t.borrow_time,
            dueTime: t.due_time,
            returnTime: t.return_time,
            status: t.status,
            depositAmount: t.deposit_amount,
            refundAmount: t.refund_amount,
            greenPointsEarned: t.green_points_earned,
            isOverdue: t.is_overdue,
            overdueHours: t.overdue_hours,
            user: t.users ? {
                email: t.users.email,
                displayName: t.users.display_name,
            } : null,
            cup: t.cups ? {
                material: t.cups.material,
            } : null,
        }));

        const total = count || 0;

        return NextResponse.json({
            success: true,
            transactions: formattedTransactions,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Info: Failed to fetch transactions', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const auth = await checkAdminApi(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { transactionId, status, forceComplete } = body;

        if (!transactionId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const updateData: any = { status };

        if (status === 'completed' || status === 'cancelled') {
            updateData.return_time = new Date().toISOString();
            if (forceComplete) {
                // Maybe add admin note logic here if needed
            }
        }

        const { data: transaction, error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('transaction_id', transactionId)
            .select()
            .single();

        if (error) throw error;

        // Also update cup status if needed
        if (transaction.cup_id && (status === 'completed' || status === 'cancelled')) {
            await supabase
                .from('cups')
                .update({
                    status: status === 'completed' ? 'cleaning' : 'available',
                    current_transaction_id: null,
                    current_user_id: null
                })
                .eq('cup_id', transaction.cup_id);
        }

        // Map response
        const formattedTransaction = {
            transactionId: transaction.transaction_id,
            status: transaction.status,
            returnTime: transaction.return_time,
            // Add other fields if needed by client
            cupId: transaction.cup_id
        };

        return NextResponse.json({ success: true, transaction: formattedTransaction });
    } catch (error) {
        console.error('Info: Failed to update transaction', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
