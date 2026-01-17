/**
 * VNES Wallet Service
 * Core wallet operations: top-up, withdraw, transfer, balance management
 */

import { getSupabaseAdmin } from './server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Types
export interface WalletBalance {
    userId: string;
    balance: number;
    frozen: boolean;
    dailyWithdrawalLimit: number;
    monthlyWithdrawalLimit: number;
}

export interface LedgerEntry {
    ledgerId: string;
    userId: string;
    entryType: 'credit' | 'debit';
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    referenceType: string;
    referenceId?: string;
    description?: string;
    createdAt: Date;
}

export interface TransactionHistoryOptions {
    page?: number;
    limit?: number;
    referenceType?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface TransactionHistoryResult {
    entries: LedgerEntry[];
    total: number;
    page: number;
    totalPages: number;
}

// Get admin client
const getAdmin = () => getSupabaseAdmin();

/**
 * Get user wallet balance and status
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance | null> {
    const { data, error } = await getAdmin()
        .from('users')
        .select('user_id, wallet_balance, wallet_frozen, daily_withdrawal_limit, monthly_withdrawal_limit')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;

    return {
        userId: data.user_id,
        balance: parseFloat(data.wallet_balance) || 0,
        frozen: data.wallet_frozen || false,
        dailyWithdrawalLimit: parseFloat(data.daily_withdrawal_limit) || 5000000,
        monthlyWithdrawalLimit: parseFloat(data.monthly_withdrawal_limit) || 50000000,
    };
}

/**
 * Create wallet entry using atomic database function
 */
export async function createWalletEntry(params: {
    userId: string;
    entryType: 'credit' | 'debit';
    amount: number;
    referenceType: string;
    referenceId?: string;
    description?: string;
    metadata?: Record<string, any>;
}): Promise<{ success: boolean; error?: string; ledgerId?: string; balanceAfter?: number }> {
    const { data, error } = await getAdmin().rpc('create_wallet_entry', {
        p_user_id: params.userId,
        p_entry_type: params.entryType,
        p_amount: params.amount,
        p_reference_type: params.referenceType,
        p_reference_id: params.referenceId || null,
        p_description: params.description || null,
        p_metadata: params.metadata || {},
    });

    if (error) {
        console.error('[WalletService] createWalletEntry error:', error);
        return { success: false, error: error.message };
    }

    return {
        success: data?.success || false,
        error: data?.error,
        ledgerId: data?.ledger_id,
        balanceAfter: data?.balance_after,
    };
}

/**
 * Top up wallet (after payment confirmation)
 */
export async function topUpWallet(params: {
    userId: string;
    amount: number;
    paymentMethod: 'vnpay' | 'momo' | 'zalopay' | 'bank_transfer';
    transactionCode: string;
    metadata?: Record<string, any>;
}): Promise<{ success: boolean; error?: string; newBalance?: number }> {
    const { userId, amount, paymentMethod, transactionCode, metadata } = params;

    // Validate amount
    if (amount <= 0) {
        return { success: false, error: 'Invalid amount' };
    }

    // Create wallet entry
    const result = await createWalletEntry({
        userId,
        entryType: 'credit',
        amount,
        referenceType: 'topup',
        referenceId: transactionCode,
        description: `Nạp tiền qua ${paymentMethod.toUpperCase()}`,
        metadata: { paymentMethod, ...metadata },
    });

    if (result.success) {
        // Create notification
        await getAdmin().from('notifications').insert({
            user_id: userId,
            type: 'success',
            title: 'Nạp tiền thành công',
            message: `Bạn đã nạp ${amount.toLocaleString('vi-VN')}đ vào ví thành công.`,
            url: '/wallet',
        });
    }

    return {
        success: result.success,
        error: result.error,
        newBalance: result.balanceAfter,
    };
}

/**
 * Withdraw from wallet
 */
export async function withdrawWallet(params: {
    userId: string;
    amount: number;
    bankAccount: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
}): Promise<{ success: boolean; error?: string; withdrawalId?: string }> {
    const { userId, amount, bankAccount } = params;

    // Validate amount
    if (amount < 50000) {
        return { success: false, error: 'Số tiền rút tối thiểu là 50.000đ' };
    }

    // Check balance
    const balance = await getWalletBalance(userId);
    if (!balance) {
        return { success: false, error: 'User not found' };
    }

    if (balance.frozen) {
        return { success: false, error: 'Ví đang bị đóng băng' };
    }

    if (balance.balance < amount) {
        return { success: false, error: 'Số dư không đủ' };
    }

    // TODO: Check daily/monthly limits

    const withdrawalId = crypto.randomUUID();

    // Create debit entry
    const result = await createWalletEntry({
        userId,
        entryType: 'debit',
        amount,
        referenceType: 'withdrawal',
        referenceId: withdrawalId,
        description: `Rút tiền về ${bankAccount.bankName} - ${bankAccount.accountNumber}`,
        metadata: { bankAccount },
    });

    if (result.success) {
        // Create withdrawal request record
        await getAdmin().from('payment_transactions').insert({
            user_id: userId,
            type: 'withdrawal',
            amount,
            payment_method: 'bank_transfer',
            transaction_code: withdrawalId,
            status: 'processing',
            metadata: JSON.stringify(bankAccount),
        });

        // Notify user
        await getAdmin().from('notifications').insert({
            user_id: userId,
            type: 'info',
            title: 'Yêu cầu rút tiền đã được tiếp nhận',
            message: `Yêu cầu rút ${amount.toLocaleString('vi-VN')}đ đang được xử lý. Vui lòng chờ 1-3 ngày làm việc.`,
            url: '/wallet',
        });
    }

    return {
        success: result.success,
        error: result.error,
        withdrawalId: result.success ? withdrawalId : undefined,
    };
}

/**
 * Transfer between users (internal)
 */
export async function transferWallet(params: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    description?: string;
}): Promise<{ success: boolean; error?: string; transferId?: string }> {
    const { data, error } = await getAdmin().rpc('transfer_wallet_balance', {
        p_from_user_id: params.fromUserId,
        p_to_user_id: params.toUserId,
        p_amount: params.amount,
        p_description: params.description || 'Internal transfer',
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return {
        success: data?.success || false,
        error: data?.error,
        transferId: data?.transfer_id,
    };
}

/**
 * Get transaction history with pagination
 */
export async function getTransactionHistory(
    userId: string,
    options: TransactionHistoryOptions = {}
): Promise<TransactionHistoryResult> {
    const { page = 1, limit = 20, referenceType, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    let query = getAdmin()
        .from('wallet_ledger')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (referenceType) {
        query = query.eq('reference_type', referenceType);
    }

    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('[WalletService] getTransactionHistory error:', error);
        return { entries: [], total: 0, page, totalPages: 0 };
    }

    const entries: LedgerEntry[] = (data || []).map((row: any) => ({
        ledgerId: row.ledger_id,
        userId: row.user_id,
        entryType: row.entry_type,
        amount: parseFloat(row.amount),
        balanceBefore: parseFloat(row.balance_before),
        balanceAfter: parseFloat(row.balance_after),
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        description: row.description,
        createdAt: new Date(row.created_at),
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return { entries, total, page, totalPages };
}

/**
 * Hold escrow (for cup deposit, transport prepay, etc.)
 */
export async function holdEscrow(params: {
    userId: string;
    escrowType: 'cup_deposit' | 'transport_prepay' | 'ebike_deposit';
    amount: number;
    referenceType: string;
    referenceId?: string;
}): Promise<{ success: boolean; error?: string; balanceAfter?: number }> {
    const { data, error } = await getAdmin().rpc('hold_escrow', {
        p_user_id: params.userId,
        p_escrow_type: params.escrowType,
        p_amount: params.amount,
        p_reference_type: params.referenceType,
        p_reference_id: params.referenceId || null,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return {
        success: data?.success || false,
        error: data?.error,
        balanceAfter: data?.balance_after,
    };
}

/**
 * Release escrow (refund after cup return, trip end, etc.)
 */
export async function releaseEscrow(params: {
    userId: string;
    escrowType: 'cup_deposit' | 'transport_prepay' | 'ebike_deposit';
    amount: number;
    fee?: number;
    referenceType: string;
    referenceId?: string;
}): Promise<{ success: boolean; error?: string; refundAmount?: number }> {
    const { data, error } = await getAdmin().rpc('release_escrow', {
        p_user_id: params.userId,
        p_escrow_type: params.escrowType,
        p_amount: params.amount,
        p_fee: params.fee || 0,
        p_reference_type: params.referenceType,
        p_reference_id: params.referenceId || null,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return {
        success: data?.success || false,
        error: data?.error,
        refundAmount: data?.refund_amount,
    };
}

/**
 * Freeze/Unfreeze wallet (admin only)
 */
export async function setWalletFrozen(params: {
    userId: string;
    frozen: boolean;
    reason: string;
    adminId: string;
}): Promise<{ success: boolean; error?: string }> {
    const { userId, frozen, reason, adminId } = params;

    // Get current state
    const { data: currentState } = await getAdmin()
        .from('users')
        .select('wallet_frozen, wallet_balance')
        .eq('user_id', userId)
        .single();

    // Update user
    const { error } = await getAdmin()
        .from('users')
        .update({
            wallet_frozen: frozen,
            wallet_frozen_at: frozen ? new Date().toISOString() : null,
            wallet_frozen_reason: frozen ? reason : null,
        })
        .eq('user_id', userId);

    if (error) {
        return { success: false, error: error.message };
    }

    // Log audit
    await getAdmin().from('wallet_audit_log').insert({
        user_id: userId,
        action: frozen ? 'freeze' : 'unfreeze',
        old_value: { frozen: currentState?.wallet_frozen },
        new_value: { frozen },
        reason,
        performed_by: adminId,
    });

    // Notify user
    await getAdmin().from('notifications').insert({
        user_id: userId,
        type: frozen ? 'warning' : 'info',
        title: frozen ? 'Ví đã bị đóng băng' : 'Ví đã được mở khóa',
        message: frozen
            ? `Ví của bạn đã bị đóng băng. Lý do: ${reason}`
            : 'Ví của bạn đã được mở khóa và có thể sử dụng bình thường.',
        url: '/wallet',
    });

    return { success: true };
}

/**
 * Manual balance adjustment (admin only)
 */
export async function adjustBalance(params: {
    userId: string;
    amount: number;
    type: 'add' | 'subtract';
    reason: string;
    adminId: string;
}): Promise<{ success: boolean; error?: string; newBalance?: number }> {
    const { userId, amount, type, reason, adminId } = params;

    // Get current balance
    const balance = await getWalletBalance(userId);
    if (!balance) {
        return { success: false, error: 'User not found' };
    }

    // Create entry
    const result = await createWalletEntry({
        userId,
        entryType: type === 'add' ? 'credit' : 'debit',
        amount: Math.abs(amount),
        referenceType: 'balance_correction',
        description: `Admin adjustment: ${reason}`,
        metadata: { adminId, reason },
    });

    if (result.success) {
        // Log audit
        await getAdmin().from('wallet_audit_log').insert({
            user_id: userId,
            action: 'manual_adjustment',
            old_value: { balance: balance.balance },
            new_value: { balance: result.balanceAfter, adjustment: type === 'add' ? amount : -amount },
            reason,
            performed_by: adminId,
        });
    }

    return {
        success: result.success,
        error: result.error,
        newBalance: result.balanceAfter,
    };
}

/**
 * Get wallet statistics for admin dashboard
 */
export async function getWalletStats(): Promise<{
    totalUsers: number;
    totalBalance: number;
    frozenWallets: number;
    todayTopups: number;
    todayWithdrawals: number;
}> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [usersResult, frozenResult, topupsResult, withdrawalsResult] = await Promise.all([
        getAdmin().from('users').select('wallet_balance', { count: 'exact' }),
        getAdmin().from('users').select('user_id', { count: 'exact' }).eq('wallet_frozen', true),
        getAdmin()
            .from('wallet_ledger')
            .select('amount')
            .eq('reference_type', 'topup')
            .gte('created_at', today.toISOString()),
        getAdmin()
            .from('wallet_ledger')
            .select('amount')
            .eq('reference_type', 'withdrawal')
            .gte('created_at', today.toISOString()),
    ]);

    const totalBalance = (usersResult.data || []).reduce(
        (sum: number, u: any) => sum + (parseFloat(u.wallet_balance) || 0),
        0
    );

    const todayTopups = (topupsResult.data || []).reduce(
        (sum: number, e: any) => sum + (parseFloat(e.amount) || 0),
        0
    );

    const todayWithdrawals = (withdrawalsResult.data || []).reduce(
        (sum: number, e: any) => sum + (parseFloat(e.amount) || 0),
        0
    );

    return {
        totalUsers: usersResult.count || 0,
        totalBalance,
        frozenWallets: frozenResult.count || 0,
        todayTopups,
        todayWithdrawals,
    };
}
