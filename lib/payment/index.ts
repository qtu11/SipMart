/**
 * Payment Provider Interface
 * Strategy Pattern for multi-payment gateway
 */

export interface PaymentProvider {
    providerId: string;
    providerName: string;

    /**
     * Create payment URL for redirect
     */
    createPaymentUrl(params: CreatePaymentParams): Promise<PaymentUrlResult>;

    /**
     * Verify callback/IPN from payment gateway
     */
    verifyCallback(params: Record<string, string>): Promise<VerifyCallbackResult>;
}

export interface CreatePaymentParams {
    orderId: string;
    amount: number;
    userId: string;
    orderInfo?: string;
    ipAddr?: string;
    bankCode?: string;
    returnUrl?: string;
}

export interface PaymentUrlResult {
    success: boolean;
    url?: string;
    error?: string;
    transactionId?: string;
}

export interface VerifyCallbackResult {
    isValid: boolean;
    code: string;
    message: string;
    orderId?: string;
    amount?: number;
    userId?: string;
    transactionNo?: string;
    bankCode?: string;
}

// Export all providers
export { VNPayProvider } from './vnpay';
export { MoMoProvider } from './momo';
export { PayPalProvider } from './paypal';
export { BankTransferProvider } from './bank-transfer';

// Payment Factory
import { VNPayProvider } from './vnpay';
import { MoMoProvider } from './momo';
import { PayPalProvider } from './paypal';
import { BankTransferProvider } from './bank-transfer';

export type PaymentMethod = 'VNPAY' | 'MOMO' | 'PAYPAL' | 'BANK_TRANSFER';

const providers: Record<PaymentMethod, PaymentProvider> = {
    VNPAY: new VNPayProvider(),
    MOMO: new MoMoProvider(),
    PAYPAL: new PayPalProvider(),
    BANK_TRANSFER: new BankTransferProvider(),
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
    const provider = providers[method];
    if (!provider) {
        throw new Error(`Payment provider '${method}' not found`);
    }
    return provider;
}

export async function createPayment(
    method: PaymentMethod,
    params: CreatePaymentParams
): Promise<PaymentUrlResult> {
    const provider = getPaymentProvider(method);
    return provider.createPaymentUrl(params);
}
