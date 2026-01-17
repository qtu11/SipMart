/**
 * Bank Transfer Payment Provider
 * For manual bank transfer with QR code
 */

import type { PaymentProvider, CreatePaymentParams, PaymentUrlResult, VerifyCallbackResult } from './index';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export interface BankAccount {
    id: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
    qrCodeUrl?: string;
    isDefault?: boolean;
}

export class BankTransferProvider implements PaymentProvider {
    providerId = 'BANK_TRANSFER';
    providerName = 'Chuyển khoản ngân hàng';

    /**
     * For bank transfer, we don't redirect anywhere
     * Instead, return bank info for user to transfer manually
     */
    async createPaymentUrl(params: CreatePaymentParams): Promise<PaymentUrlResult> {
        try {
            const { orderId, amount, userId } = params;

            // Get bank accounts from config
            const bankAccounts = await this.getBankAccounts();

            if (bankAccounts.length === 0) {
                return { success: false, error: 'No bank accounts configured' };
            }

            // Create pending transaction for tracking
            const transactionCode = `SIPMART${orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

            // Store pending transaction
            const supabase = getSupabaseAdmin();
            await supabase.from('payment_transactions').insert({
                user_id: userId,
                type: 'topup',
                amount,
                payment_method: 'bank_transfer',
                transaction_code: transactionCode,
                status: 'pending',
                provider_id: 'BANK_TRANSFER',
                metadata: JSON.stringify({
                    orderId,
                    bankAccounts: bankAccounts.map(b => ({
                        bankName: b.bankName,
                        accountNumber: b.accountNumber,
                        accountHolder: b.accountHolder,
                    })),
                }),
            });

            // Return URL to bank transfer info page
            const url = `/payment/bank-transfer?orderId=${orderId}&amount=${amount}&code=${transactionCode}`;

            return { success: true, url, transactionId: transactionCode };
        } catch (error: any) {
            console.error('[BankTransfer] createPaymentUrl error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bank transfers are verified manually by admin
     */
    async verifyCallback(params: Record<string, string>): Promise<VerifyCallbackResult> {
        // Bank transfers don't have automatic callback
        // Admin will manually verify and approve
        return {
            isValid: false,
            code: '99',
            message: 'Bank transfers require manual verification by admin',
        };
    }

    /**
     * Get configured bank accounts
     */
    async getBankAccounts(): Promise<BankAccount[]> {
        try {
            const supabase = getSupabaseAdmin();
            const { data, error } = await supabase
                .from('payment_configs')
                .select('bank_accounts')
                .eq('provider_id', 'BANK_TRANSFER')
                .single();

            if (error || !data) return [];

            return (data.bank_accounts || []) as BankAccount[];
        } catch {
            return [];
        }
    }

    /**
     * Generate VietQR URL for bank transfer
     */
    static generateVietQRUrl(params: {
        bankCode: string;
        accountNumber: string;
        accountName: string;
        amount: number;
        message: string;
    }): string {
        const { bankCode, accountNumber, accountName, amount, message } = params;

        // VietQR format
        const template = 'compact2';
        const encodedName = encodeURIComponent(accountName);
        const encodedMessage = encodeURIComponent(message);

        return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${encodedMessage}&accountName=${encodedName}`;
    }
}
