import { getSupabaseAdmin } from './server';

const getAdmin = () => getSupabaseAdmin();

export interface PaymentTransaction {
    paymentId: string;
    userId: string;
    amount: number;
    paymentMethod: 'vnpay' | 'momo' | 'zalopay' | 'bank_transfer';
    transactionType: 'topup' | 'refund' | 'withdrawal';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    externalTransactionId?: string;
    vnpayTxnRef?: string;
    vnpayResponseCode?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    createdAt: Date;
    completedAt?: Date;
}

/**
 * Tạo payment transaction log
 */
export async function createPaymentTransaction(params: {
    userId: string;
    amount: number;
    paymentMethod: PaymentTransaction['paymentMethod'];
    transactionType: PaymentTransaction['transactionType'];
    vnpayTxnRef?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
}): Promise<PaymentTransaction> {
    const { userId, amount, paymentMethod, transactionType, vnpayTxnRef, ipAddress, metadata } = params;

    const { data, error } = await getAdmin()
        .from('payment_transactions')
        .insert({
            user_id: userId,
            amount,
            payment_method: paymentMethod,
            transaction_type: transactionType,
            status: 'pending',
            vnpay_txn_ref: vnpayTxnRef,
            ip_address: ipAddress,
            metadata: metadata ? JSON.stringify(metadata) : null,
        })
        .select()
        .single();

    if (error) throw error;
    return mapPaymentFromDb(data);
}

/**
 * Cập nhật trạng thái payment
 */
export async function updatePaymentStatus(
    paymentId: string,
    status: PaymentTransaction['status'],
    options?: {
        externalTransactionId?: string;
        vnpayResponseCode?: string;
        errorMessage?: string;
    }
): Promise<PaymentTransaction> {
    const updateData: any = { status };

    if (options?.externalTransactionId) {
        updateData.external_transaction_id = options.externalTransactionId;
    }
    if (options?.vnpayResponseCode) {
        updateData.vnpay_response_code = options.vnpayResponseCode;
    }
    if (options?.errorMessage) {
        updateData.error_message = options.errorMessage;
    }
    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await getAdmin()
        .from('payment_transactions')
        .update(updateData)
        .eq('payment_id', paymentId)
        .select()
        .single();

    if (error) throw error;
    return mapPaymentFromDb(data);
}

/**
 * Cập nhật payment bằng VNPay transaction ref
 */
export async function updatePaymentByVnpayRef(
    vnpayTxnRef: string,
    status: PaymentTransaction['status'],
    options?: {
        vnpayResponseCode?: string;
        externalTransactionId?: string;
        errorMessage?: string;
    }
): Promise<PaymentTransaction | null> {
    const updateData: any = { status };

    if (options?.vnpayResponseCode) {
        updateData.vnpay_response_code = options.vnpayResponseCode;
    }
    if (options?.externalTransactionId) {
        updateData.external_transaction_id = options.externalTransactionId;
    }
    if (options?.errorMessage) {
        updateData.error_message = options.errorMessage;
    }
    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await getAdmin()
        .from('payment_transactions')
        .update(updateData)
        .eq('vnpay_txn_ref', vnpayTxnRef)
        .select()
        .single();

    if (error) {
        console.error('Error updating payment by VNPay ref:', error);
        return null;
    }
    return mapPaymentFromDb(data);
}

/**
 * Lấy payment history của user
 */
export async function getUserPaymentHistory(
    userId: string,
    options?: { limit?: number; status?: PaymentTransaction['status'] }
): Promise<PaymentTransaction[]> {
    let query = getAdmin()
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapPaymentFromDb);
}

/**
 * Lấy payment bằng VNPay ref (để verify callback)
 */
export async function getPaymentByVnpayRef(vnpayTxnRef: string): Promise<PaymentTransaction | null> {
    const { data, error } = await getAdmin()
        .from('payment_transactions')
        .select('*')
        .eq('vnpay_txn_ref', vnpayTxnRef)
        .maybeSingle();

    if (error || !data) return null;
    return mapPaymentFromDb(data);
}

/**
 * Kiểm tra duplicate transaction
 */
export async function checkDuplicatePayment(vnpayTxnRef: string): Promise<boolean> {
    const existing = await getPaymentByVnpayRef(vnpayTxnRef);
    return existing?.status === 'completed';
}

// Mapping helper
function mapPaymentFromDb(row: any): PaymentTransaction {
    return {
        paymentId: row.payment_id,
        userId: row.user_id,
        amount: parseFloat(row.amount),
        paymentMethod: row.payment_method as PaymentTransaction['paymentMethod'],
        transactionType: row.transaction_type as PaymentTransaction['transactionType'],
        status: row.status as PaymentTransaction['status'],
        externalTransactionId: row.external_transaction_id,
        vnpayTxnRef: row.vnpay_txn_ref,
        vnpayResponseCode: row.vnpay_response_code,
        errorMessage: row.error_message,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        ipAddress: row.ip_address,
        createdAt: new Date(row.created_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
}
