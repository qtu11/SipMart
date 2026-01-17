/**
 * VNES Settlement Service
 * Partner settlement, batch processing, payout management
 */

import { getSupabaseAdmin } from './server';

// Types
export interface PartnerWallet {
    partnerId: string;
    partnerType: 'store' | 'transport' | 'ebike' | 'merchant';
    partnerName: string;
    email?: string;
    balance: number;
    pendingSettlement: number;
    totalEarned: number;
    commissionRate: number;
    status: 'active' | 'suspended' | 'pending_verification';
    bankAccount?: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
}

export interface SettlementBatch {
    batchId: string;
    partnerId: string;
    partnerName?: string;
    periodStart: Date;
    periodEnd: Date;
    totalTransactions: number;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    status: 'pending' | 'approved' | 'processing' | 'paid' | 'failed' | 'cancelled';
    approvedBy?: string;
    approvedAt?: Date;
    paidAt?: Date;
    paymentReference?: string;
}

export interface SettlementListOptions {
    page?: number;
    limit?: number;
    status?: SettlementBatch['status'];
    partnerId?: string;
}

const getAdmin = () => getSupabaseAdmin();

/**
 * Get all partners with wallet info
 */
export async function getAllPartners(options?: {
    type?: PartnerWallet['partnerType'];
    status?: PartnerWallet['status'];
}): Promise<PartnerWallet[]> {
    let query = getAdmin()
        .from('partner_wallets')
        .select('*')
        .order('created_at', { ascending: false });

    if (options?.type) {
        query = query.eq('partner_type', options.type);
    }

    if (options?.status) {
        query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[SettlementService] getAllPartners error:', error);
        return [];
    }

    return (data || []).map(mapPartnerFromDb);
}

/**
 * Get partner wallet by ID
 */
export async function getPartnerWallet(partnerId: string): Promise<PartnerWallet | null> {
    const { data, error } = await getAdmin()
        .from('partner_wallets')
        .select('*')
        .eq('partner_id', partnerId)
        .single();

    if (error || !data) return null;
    return mapPartnerFromDb(data);
}

/**
 * Create new partner wallet
 */
export async function createPartnerWallet(params: {
    partnerType: PartnerWallet['partnerType'];
    partnerName: string;
    email?: string;
    phone?: string;
    commissionRate?: number;
    bankAccount?: PartnerWallet['bankAccount'];
}): Promise<{ success: boolean; partnerId?: string; error?: string }> {
    const { data, error } = await getAdmin()
        .from('partner_wallets')
        .insert({
            partner_type: params.partnerType,
            partner_name: params.partnerName,
            email: params.email,
            phone: params.phone,
            commission_rate: params.commissionRate || 0.001,
            bank_account: params.bankAccount || {},
            status: 'pending_verification',
        })
        .select('partner_id')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, partnerId: data.partner_id };
}

/**
 * Add commission to partner
 */
export async function addPartnerCommission(params: {
    partnerId: string;
    amount: number;
    referenceType: string;
    referenceId?: string;
    description?: string;
}): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await getAdmin().rpc('add_partner_commission', {
        p_partner_id: params.partnerId,
        p_amount: params.amount,
        p_reference_type: params.referenceType,
        p_reference_id: params.referenceId || null,
        p_description: params.description || null,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: data?.success || false, error: data?.error };
}

/**
 * Create settlement batch for partner
 */
export async function createSettlementBatch(params: {
    partnerId: string;
    periodStart: Date;
    periodEnd: Date;
}): Promise<{ success: boolean; batchId?: string; error?: string }> {
    const { partnerId, periodStart, periodEnd } = params;

    // Get partner info
    const partner = await getPartnerWallet(partnerId);
    if (!partner) {
        return { success: false, error: 'Partner not found' };
    }

    if (partner.pendingSettlement <= 0) {
        return { success: false, error: 'No pending settlement' };
    }

    // Get transaction count for period
    const { count } = await getAdmin()
        .from('partner_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('reference_type', 'commission')
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

    // Calculate amounts
    const grossAmount = partner.pendingSettlement;
    const commissionAmount = grossAmount * partner.commissionRate;
    const netAmount = grossAmount - commissionAmount;

    // Create batch
    const { data, error } = await getAdmin()
        .from('settlement_batches')
        .insert({
            partner_id: partnerId,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            total_transactions: count || 0,
            gross_amount: grossAmount,
            commission_amount: commissionAmount,
            net_amount: netAmount,
            status: 'pending',
        })
        .select('batch_id')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, batchId: data.batch_id };
}

/**
 * Get settlement batches with pagination
 */
export async function getSettlementBatches(
    options: SettlementListOptions = {}
): Promise<{ batches: SettlementBatch[]; total: number }> {
    const { page = 1, limit = 20, status, partnerId } = options;
    const offset = (page - 1) * limit;

    let query = getAdmin()
        .from('settlement_batches')
        .select(
            `
            *,
            partner_wallets (partner_name)
        `,
            { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq('status', status);
    }

    if (partnerId) {
        query = query.eq('partner_id', partnerId);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('[SettlementService] getSettlementBatches error:', error);
        return { batches: [], total: 0 };
    }

    const batches = (data || []).map((row: any) => ({
        batchId: row.batch_id,
        partnerId: row.partner_id,
        partnerName: row.partner_wallets?.partner_name,
        periodStart: new Date(row.period_start),
        periodEnd: new Date(row.period_end),
        totalTransactions: row.total_transactions,
        grossAmount: parseFloat(row.gross_amount),
        commissionAmount: parseFloat(row.commission_amount),
        netAmount: parseFloat(row.net_amount),
        status: row.status,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
        paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
        paymentReference: row.payment_reference,
    }));

    return { batches, total: count || 0 };
}

/**
 * Approve settlement batch
 */
export async function approveSettlement(params: {
    batchId: string;
    adminId: string;
}): Promise<{ success: boolean; error?: string }> {
    const { error } = await getAdmin()
        .from('settlement_batches')
        .update({
            status: 'approved',
            approved_by: params.adminId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('batch_id', params.batchId)
        .eq('status', 'pending');

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Process payout (mark as paid)
 */
export async function processSettlementPayout(params: {
    batchId: string;
    paymentReference: string;
}): Promise<{ success: boolean; error?: string }> {
    // Get batch info
    const { data: batch } = await getAdmin()
        .from('settlement_batches')
        .select('*')
        .eq('batch_id', params.batchId)
        .single();

    if (!batch || batch.status !== 'approved') {
        return { success: false, error: 'Batch not found or not approved' };
    }

    // Update batch status
    const { error: updateError } = await getAdmin()
        .from('settlement_batches')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_reference: params.paymentReference,
            updated_at: new Date().toISOString(),
        })
        .eq('batch_id', params.batchId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // Update partner wallet - reduce pending settlement
    await getAdmin()
        .from('partner_wallets')
        .update({
            pending_settlement: 0,
            updated_at: new Date().toISOString(),
        })
        .eq('partner_id', batch.partner_id);

    // Add to partner ledger
    await getAdmin().from('partner_ledger').insert({
        partner_id: batch.partner_id,
        entry_type: 'debit',
        amount: batch.net_amount,
        balance_before: batch.net_amount,
        balance_after: 0,
        reference_type: 'settlement_payout',
        reference_id: params.batchId,
        description: `Quyết toán kỳ ${batch.period_start} - ${batch.period_end}`,
    });

    return { success: true };
}

/**
 * Get escrow summary
 */
export async function getEscrowSummary(): Promise<
    Array<{ escrowType: string; totalBalance: number; transactionCount: number }>
> {
    const { data, error } = await getAdmin()
        .from('escrow_accounts')
        .select('*')
        .order('escrow_type');

    if (error) {
        console.error('[SettlementService] getEscrowSummary error:', error);
        return [];
    }

    return (data || []).map((row: any) => ({
        escrowType: row.escrow_type,
        totalBalance: parseFloat(row.total_balance) || 0,
        transactionCount: row.transaction_count || 0,
    }));
}

/**
 * Generate reconciliation report
 */
export async function generateReconciliationReport(params: {
    startDate: Date;
    endDate: Date;
}): Promise<{
    totalTopups: number;
    totalWithdrawals: number;
    totalEscrowHeld: number;
    totalEscrowReleased: number;
    totalPartnerCommissions: number;
    netFlow: number;
}> {
    const { startDate, endDate } = params;

    const [topups, withdrawals, escrowHold, escrowRelease, commissions] = await Promise.all([
        getAdmin()
            .from('wallet_ledger')
            .select('amount')
            .eq('reference_type', 'topup')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),
        getAdmin()
            .from('wallet_ledger')
            .select('amount')
            .eq('reference_type', 'withdrawal')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),
        getAdmin()
            .from('escrow_transactions')
            .select('amount')
            .eq('entry_type', 'hold')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),
        getAdmin()
            .from('escrow_transactions')
            .select('amount')
            .eq('entry_type', 'release')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),
        getAdmin()
            .from('partner_ledger')
            .select('amount')
            .eq('reference_type', 'commission')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),
    ]);

    const sum = (arr: any[] | null) =>
        (arr || []).reduce((s: number, r: any) => s + (parseFloat(r.amount) || 0), 0);

    const totalTopups = sum(topups.data);
    const totalWithdrawals = sum(withdrawals.data);
    const totalEscrowHeld = sum(escrowHold.data);
    const totalEscrowReleased = sum(escrowRelease.data);
    const totalPartnerCommissions = sum(commissions.data);

    return {
        totalTopups,
        totalWithdrawals,
        totalEscrowHeld,
        totalEscrowReleased,
        totalPartnerCommissions,
        netFlow: totalTopups - totalWithdrawals,
    };
}

// Helper: Map partner from DB
function mapPartnerFromDb(row: any): PartnerWallet {
    return {
        partnerId: row.partner_id,
        partnerType: row.partner_type,
        partnerName: row.partner_name,
        email: row.email,
        balance: parseFloat(row.balance) || 0,
        pendingSettlement: parseFloat(row.pending_settlement) || 0,
        totalEarned: parseFloat(row.total_earned) || 0,
        commissionRate: parseFloat(row.commission_rate) || 0.001,
        status: row.status,
        bankAccount: row.bank_account || undefined,
    };
}
