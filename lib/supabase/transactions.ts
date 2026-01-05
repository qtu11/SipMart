import { getSupabaseAdmin } from './server';
import { addGreenPoints, updateWallet, incrementCupsSaved } from './users';

// Transaction type based on Prisma schema
export interface Transaction {
    transactionId: string;
    userId: string;
    cupId: string;
    borrowStoreId: string;
    returnStoreId?: string;
    borrowTime: Date;
    dueTime: Date;
    returnTime?: Date;
    status: 'ongoing' | 'completed' | 'overdue' | 'cancelled';
    depositAmount: number;
    refundAmount?: number;
    greenPointsEarned?: number;
    isOverdue: boolean;
    overdueHours?: number;
}

const getAdmin = () => getSupabaseAdmin();

// Create transaction (borrow cup)
export async function createTransaction(params: {
    userId: string;
    cupId: string;
    borrowStoreId: string;
    depositAmount: number;
    durationHours?: number;
}): Promise<Transaction> {
    const { userId, cupId, borrowStoreId, depositAmount, durationHours = 24 } = params;

    const borrowTime = new Date();
    const dueTime = new Date(borrowTime.getTime() + durationHours * 60 * 60 * 1000);

    const { data, error } = await getAdmin()
        .from('transactions')
        .insert({
            user_id: userId,
            cup_id: cupId,
            borrow_store_id: borrowStoreId,
            borrow_time: borrowTime.toISOString(),
            due_time: dueTime.toISOString(),
            status: 'ongoing',
            deposit_amount: depositAmount,
            is_overdue: false,
        })
        .select()
        .single();

    if (error) throw error;
    return mapTransactionFromDb(data);
}

// Get transaction by ID
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
    const { data, error } = await getAdmin()
        .from('transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

    if (error || !data) return null;
    return mapTransactionFromDb(data);
}

// Get user's ongoing transactions
export async function getOngoingTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await getAdmin()
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['ongoing', 'overdue'])
        .order('borrow_time', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapTransactionFromDb);
}

// Get transaction history
export async function getTransactionHistory(
    userId: string,
    options?: {
        limit?: number;
        status?: Transaction['status'];
    }
): Promise<Transaction[]> {
    let query = getAdmin()
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('borrow_time', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapTransactionFromDb);
}

// Complete transaction (return cup)
export async function completeTransaction(
    transactionId: string,
    returnStoreId: string
): Promise<Transaction> {
    // Get transaction
    const transaction = await getTransaction(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    const returnTime = new Date();
    const isOverdue = returnTime > transaction.dueTime;

    // Calculate overdue hours
    let overdueHours = 0;
    if (isOverdue) {
        overdueHours = Math.ceil(
            (returnTime.getTime() - transaction.dueTime.getTime()) / (1000 * 60 * 60)
        );
    }

    // ============= GAMIFICATION: Calculate refund based on time =============
    const { GAMIFICATION_CONFIG } = await import('@/lib/config/gamification');
    const timeDiff = returnTime.getTime() - transaction.borrowTime.getTime();
    const hoursUsed = timeDiff / (1000 * 60 * 60);

    let refundAmount = 0;
    if (hoursUsed < 24) {
        // < 24h: Full refund
        refundAmount = transaction.depositAmount;
    } else if (hoursUsed < 48) {
        // 24-48h: Partial refund (deduct penalty)
        const penalty = GAMIFICATION_CONFIG.deposit.late24to48Fee;
        refundAmount = Math.max(0, transaction.depositAmount - penalty);
    } else {
        // > 48h: No refund
        refundAmount = 0;
    }

    // ============= GAMIFICATION: Calculate green points =============
    let greenPoints = 0;

    if (hoursUsed < 1) {
        // Speed Returner: < 1h = x2 bonus
        greenPoints = GAMIFICATION_CONFIG.points.speedReturner; // 200 points
    } else if (!isOverdue) {
        // On-time return
        greenPoints = GAMIFICATION_CONFIG.points.returnOnTime; // 100 points
    } else {
        // Late return: reduced points
        greenPoints = GAMIFICATION_CONFIG.points.returnLate; // 50 points
        // Further penalty for very late returns
        if (overdueHours > 24) {
            greenPoints = 0;
        }
    }

    // Update transaction
    const { data, error } = await getAdmin()
        .from('transactions')
        .update({
            return_store_id: returnStoreId,
            return_time: returnTime.toISOString(),
            status: 'completed',
            refund_amount: refundAmount,
            green_points_earned: greenPoints,
            is_overdue: isOverdue,
            overdue_hours: overdueHours > 0 ? overdueHours : null,
        })
        .eq('transaction_id', transactionId)
        .in('status', ['ongoing', 'overdue'])
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error('Transaction not found');

    // Update user stats
    await Promise.all([
        updateWallet(transaction.userId, refundAmount),
        addGreenPoints(transaction.userId, greenPoints, `Returned cup from transaction ${transactionId}`),
        incrementCupsSaved(transaction.userId, 1),
    ]);

    // ============= GAMIFICATION: Update Green Streak =============
    const { updateGreenStreak, checkAndUnlockAchievements } = await import('@/lib/supabase/gamification');
    const { streak, voucherAwarded } = await updateGreenStreak(transaction.userId, !isOverdue);

    // ============= GAMIFICATION: Check achievements =============
    const newAchievements = await checkAndUnlockAchievements(transaction.userId);

    // ============= GAMIFICATION: Create EcoAction =============
    await getAdmin()
        .from('eco_actions')
        .insert({
            user_id: transaction.userId,
            type: 'return',
            cup_id: transaction.cupId,
            points: greenPoints,
            description: isOverdue
                ? `Trả ly muộn ${overdueHours}h`
                : hoursUsed < 1
                    ? 'Speed Returner! ⚡'
                    : 'Trả ly đúng hạn',
        });

    // ============= GAMIFICATION: Send notification =============
    let notificationMessage = '';
    if (hoursUsed < 1) {
        notificationMessage = `🚀 Speed Returner! Bạn nhận ${greenPoints} điểm!`;
    } else if (voucherAwarded) {
        notificationMessage = `🎁 Green Streak ${streak}! Bạn nhận voucher giảm giá!`;
    } else if (!isOverdue) {
        notificationMessage = `🌱 Trả ly đúng hạn! +${greenPoints} điểm. Streak: ${streak}`;
    } else {
        notificationMessage = `⚠️ Trả ly muộn ${overdueHours}h. Streak đã reset.`;
    }

    await getAdmin()
        .from('notifications')
        .insert({
            user_id: transaction.userId,
            type: isOverdue ? 'warning' : 'success',
            title: 'Trả ly thành công',
            message: notificationMessage,
            url: '/profile',
        });

    return mapTransactionFromDb(data);
}

// Mark transaction as overdue
export async function markTransactionOverdue(transactionId: string): Promise<Transaction> {
    const transaction = await getTransaction(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    const now = new Date();
    const overdueHours = Math.ceil(
        (now.getTime() - transaction.dueTime.getTime()) / (1000 * 60 * 60)
    );

    const { data, error } = await getAdmin()
        .from('transactions')
        .update({
            status: 'overdue',
            is_overdue: true,
            overdue_hours: overdueHours,
        })
        .eq('transaction_id', transactionId)
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error('Transaction not found');

    return mapTransactionFromDb(data);
}

// Cancel transaction
export async function cancelTransaction(transactionId: string): Promise<Transaction> {
    const { data, error } = await getAdmin()
        .from('transactions')
        .update({
            status: 'cancelled',
        })
        .eq('transaction_id', transactionId)
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error('Transaction not found');

    return mapTransactionFromDb(data);
}

// Get all overdue transactions (for admin)
export async function getAllOverdueTransactions(): Promise<Transaction[]> {
    const { data, error } = await getAdmin()
        .from('transactions')
        .select('*')
        .eq('status', 'overdue')
        .order('due_time', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapTransactionFromDb);
}

// Check and update overdue transactions (cron job)
export async function checkOverdueTransactions(): Promise<number> {
    const now = new Date();

    const { data, error } = await getAdmin()
        .from('transactions')
        .select('transaction_id, due_time')
        .eq('status', 'ongoing')
        .lt('due_time', now.toISOString());

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    // Batch update all overdue transactions at once (fixes N+1 query issue)

    // Calculate overdue hours for each transaction
    const updates = data.map(t => {
        const dueTime = new Date(t.due_time);
        const overdueHours = Math.ceil(
            (now.getTime() - dueTime.getTime()) / (1000 * 60 * 60)
        );
        return {
            transaction_id: t.transaction_id,
            status: 'overdue' as const,
            is_overdue: true,
            overdue_hours: overdueHours,
        };
    });

    // Perform batch update using upsert
    const { error: updateError } = await getAdmin()
        .from('transactions')
        .upsert(updates, {
            onConflict: 'transaction_id',
            ignoreDuplicates: false
        });

    if (updateError) throw updateError;

    return data.length;
}

// Map database row to Transaction type
function mapTransactionFromDb(row: any): Transaction {
    return {
        transactionId: row.transaction_id,
        userId: row.user_id,
        cupId: row.cup_id,
        borrowStoreId: row.borrow_store_id,
        returnStoreId: row.return_store_id || undefined,
        borrowTime: new Date(row.borrow_time),
        dueTime: new Date(row.due_time),
        returnTime: row.return_time ? new Date(row.return_time) : undefined,
        status: row.status as Transaction['status'],
        depositAmount: parseFloat(row.deposit_amount),
        refundAmount: row.refund_amount ? parseFloat(row.refund_amount) : undefined,
        greenPointsEarned: row.green_points_earned || undefined,
        isOverdue: row.is_overdue || false,
        overdueHours: row.overdue_hours || undefined,
    };
}
