import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);

        if (!authResult.authenticated || !authResult.userId) {
            return unauthorizedResponse();
        }

        const userId = authResult.userId;
        const supabase = getSupabaseAdmin();

        // Fetch ongoing borrowed cups WITHOUT foreign key join
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('transaction_id, cup_id, borrow_store_id, borrow_time, due_time, deposit_amount, status')
            .eq('user_id', userId)
            .eq('status', 'ongoing')
            .order('borrow_time', { ascending: false });

        if (error) {
            throw error;
        }

        // Get unique store IDs
        const storeIds = [...new Set((transactions || []).map(t => t.borrow_store_id))].filter(Boolean);

        // Fetch stores separately
        let storesMap: Record<string, any> = {};
        if (storeIds.length > 0) {
            const { data: stores } = await supabase
                .from('stores')
                .select('store_id, name')
                .in('store_id', storeIds);

            storesMap = (stores || []).reduce((acc, store) => {
                acc[store.store_id] = store;
                return acc;
            }, {} as Record<string, any>);
        }

        // Manor join
        const borrowedCups = (transactions || []).map((t: any) => ({
            transactionId: t.transaction_id,
            cupId: t.cup_id,
            borrowStoreId: t.borrow_store_id,
            storeName: storesMap[t.borrow_store_id]?.name || 'Unknown Store',
            borrowTime: t.borrow_time,
            dueTime: t.due_time,
            depositAmount: t.deposit_amount,
            status: t.status,
            borrowStoreName: storesMap[t.borrow_store_id]?.name || 'Cửa hàng',
        }));

        return jsonResponse({ borrowedCups });
    } catch (error: unknown) {
        return errorResponse(error);
    }
}
