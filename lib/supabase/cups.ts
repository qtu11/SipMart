import { getSupabaseAdmin } from './server';

export interface Cup {
    cupId: string;
    qrCode: string;
    status: 'available' | 'in_use' | 'cleaning' | 'damaged';
    currentUserId?: string;
    currentTransactionId?: string;
    currentStoreId: string;
    totalUses: number;
    createdAt: Date;
}

const getAdmin = () => getSupabaseAdmin();

/**
 * Get cup by ID
 */
export async function getCup(cupId: string): Promise<Cup | null> {
    const { data, error } = await getAdmin()
        .from('cups')
        .select('*')
        .eq('cup_id', cupId)
        .single();

    if (error || !data) return null;
    return mapCupFromDb(data);
}

/**
 * Get all cups for a user (currently borrowed)
 */
export async function getUserCups(userId: string): Promise<Cup[]> {
    const { data, error } = await getAdmin()
        .from('cups')
        .select('*')
        .eq('current_user_id', userId)
        .eq('status', 'in_use');

    if (error) throw error;
    if (!data) return [];

    return data.map(mapCupFromDb);
}

/**
 * ATOMIC: Borrow cup using database RPC to prevent race conditions
 * This is the RECOMMENDED way to borrow cups in production
 */
export async function borrowCupAtomic(
    cupId: string,
    userId: string,
    transactionId: string
): Promise<{ success: boolean; message: string }> {
    const { data, error } = await getAdmin()
        .rpc('borrow_cup_atomic', {
            p_cup_id: cupId,
            p_user_id: userId,
            p_transaction_id: transactionId,
        });

    if (error) {
        // Check if it's a lock error (concurrent request)
        if (error.message?.includes('NOWAIT')) {
            throw new Error('Cup is being processed by another request. Please try again.');
        }
        throw error;
    }

    return data[0] || { success: false, message: 'Unknown error' };
}

/**
 * ATOMIC: Return cup using database RPC
 */
export async function returnCupAtomic(
    cupId: string,
    userId: string
): Promise<{ success: boolean; message: string }> {
    const { data, error } = await getAdmin()
        .rpc('return_cup_atomic', {
            p_cup_id: cupId,
            p_expected_user_id: userId,
        });

    if (error) {
        if (error.message?.includes('NOWAIT')) {
            throw new Error('Cup is being processed by another request. Please try again.');
        }
        throw error;
    }

    return data[0] || { success: false, message: 'Unknown error' };
}

/**
 * Legacy: Update cup status (use borrowCupAtomic instead for new code)
 * Uses optimistic locking pattern as fallback
 */
export async function updateCupStatus(
    cupId: string,
    newStatus: Cup['status'],
    userId?: string,
    transactionId?: string
): Promise<void> {
    const updateData: any = {
        status: newStatus,
        current_user_id: userId || null,
        current_transaction_id: transactionId || null,
    };

    // Optimistic locking: only update if status is what we expect
    const expectedStatus = newStatus === 'in_use' ? 'available' : 'in_use';

    const { error, count } = await getAdmin()
        .from('cups')
        .update(updateData)
        .eq('cup_id', cupId)
        .eq('status', expectedStatus);

    if (error) throw error;

    if (count === 0) {
        throw new Error('Cup status has changed, please try again');
    }
}

/**
 * Mark cup for cleaning after return
 */
export async function markCupForCleaning(cupId: string): Promise<void> {
    const { error } = await getAdmin()
        .from('cups')
        .update({
            status: 'cleaning',
            current_user_id: null,
            current_transaction_id: null,
        })
        .eq('cup_id', cupId);

    if (error) throw error;
}

/**
 * Mark cup as available after cleaning
 */
export async function markCupAvailable(cupId: string, storeId: string): Promise<void> {
    const { error } = await getAdmin()
        .from('cups')
        .update({
            status: 'available',
            current_store_id: storeId,
        })
        .eq('cup_id', cupId);

    if (error) throw error;
}

/**
 * Increment cup usage count using atomic RPC
 */
export async function incrementCupUses(cupId: string): Promise<void> {
    const { error } = await getAdmin()
        .rpc('increment_cup_uses', { p_cup_id: cupId });

    if (error) {
        // Fallback: manual increment if RPC doesn't exist
        const cup = await getCup(cupId);
        if (cup) {
            await getAdmin()
                .from('cups')
                .update({ total_uses: cup.totalUses + 1 })
                .eq('cup_id', cupId);
        }
    }
}

/**
 * Create new cup in database
 */
export async function createCup(
    cupId: string,
    qrCode: string,
    storeId: string
): Promise<Cup> {
    const { data, error } = await getAdmin()
        .from('cups')
        .insert({
            cup_id: cupId,
            qr_code: qrCode,
            status: 'available',
            current_store_id: storeId,
            total_uses: 0,
        })
        .select()
        .single();

    if (error) throw error;
    return mapCupFromDb(data);
}

/**
 * Get cups by store
 */
export async function getCupsByStore(storeId: string): Promise<Cup[]> {
    const { data, error } = await getAdmin()
        .from('cups')
        .select('*')
        .eq('current_store_id', storeId);

    if (error) throw error;
    if (!data) return [];

    return data.map(mapCupFromDb);
}

/**
 * Get cup statistics
 */
export async function getCupStats(cupId: string): Promise<{
    totalUses: number;
    totalBorrows: number;
    averageReturnTime: number;
}> {
    const cup = await getCup(cupId);
    if (!cup) throw new Error('Cup not found');

    const { data: transactions } = await getAdmin()
        .from('transactions')
        .select('*')
        .eq('cup_id', cupId)
        .eq('status', 'completed');

    if (!transactions) {
        return { totalUses: cup.totalUses, totalBorrows: 0, averageReturnTime: 0 };
    }

    const avgTime = transactions.reduce((sum, t) => {
        const borrow = new Date(t.borrow_time);
        const ret = new Date(t.return_time);
        return sum + (ret.getTime() - borrow.getTime());
    }, 0) / transactions.length;

    return {
        totalUses: cup.totalUses,
        totalBorrows: transactions.length,
        averageReturnTime: avgTime / (1000 * 60 * 60), // Convert to hours
    };
}

// Helper function to map database row to Cup type
function mapCupFromDb(row: any): Cup {
    return {
        cupId: row.cup_id,
        qrCode: row.qr_code,
        status: row.status as Cup['status'],
        currentUserId: row.current_user_id || undefined,
        currentTransactionId: row.current_transaction_id || undefined,
        currentStoreId: row.current_store_id,
        totalUses: row.total_uses || 0,
        createdAt: new Date(row.created_at),
    };
}
