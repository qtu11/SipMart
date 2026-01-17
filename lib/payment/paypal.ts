/**
 * PayPal Payment Provider
 * Implements PaymentProvider interface for PayPal
 */

import type { PaymentProvider, CreatePaymentParams, PaymentUrlResult, VerifyCallbackResult } from './index';

export class PayPalProvider implements PaymentProvider {
    providerId = 'PAYPAL';
    providerName = 'PayPal - Visa/MasterCard';

    private get config() {
        return {
            clientId: process.env.PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
            mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
            returnUrl: process.env.PAYPAL_RETURN_URL || 'http://localhost:3000/payment/paypal-return',
            cancelUrl: process.env.PAYPAL_CANCEL_URL || 'http://localhost:3000/topup',
        };
    }

    private get baseUrl() {
        return this.config.mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    private async getAccessToken(): Promise<string> {
        const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

        const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        const data = await response.json();
        return data.access_token;
    }

    async createPaymentUrl(params: CreatePaymentParams): Promise<PaymentUrlResult> {
        try {
            const { orderId, amount, userId, orderInfo } = params;

            if (!this.config.clientId || !this.config.clientSecret) {
                return { success: false, error: 'PayPal configuration is incomplete. Please add PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET to environment.' };
            }

            // Convert VND to USD (approximate rate)
            const exchangeRate = 24500;
            const amountUSD = (amount / exchangeRate).toFixed(2);

            const accessToken = await this.getAccessToken();

            const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [{
                        reference_id: orderId,
                        description: orderInfo || `SipSmart Top-up - ${orderId}`,
                        custom_id: userId,
                        amount: {
                            currency_code: 'USD',
                            value: amountUSD,
                        },
                    }],
                    application_context: {
                        return_url: `${params.returnUrl || this.config.returnUrl}?orderId=${orderId}`,
                        cancel_url: this.config.cancelUrl,
                        brand_name: 'SipSmart',
                        landing_page: 'NO_PREFERENCE',
                        user_action: 'PAY_NOW',
                    },
                }),
            });

            const data = await response.json();

            if (data.id) {
                const approveLink = data.links?.find((link: any) => link.rel === 'approve');
                if (approveLink) {
                    return { success: true, url: approveLink.href, transactionId: data.id };
                }
            }

            return { success: false, error: data.message || 'PayPal order creation failed' };
        } catch (error: any) {
            console.error('[PayPal] createPaymentUrl error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Capture PayPal order after user approval
     */
    async captureOrder(paypalOrderId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.status === 'COMPLETED') {
                return { success: true, data };
            }

            return { success: false, error: data.message || 'Capture failed' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async verifyCallback(params: Record<string, string>): Promise<VerifyCallbackResult> {
        try {
            const { token, PayerID, orderId } = params;

            if (!token) {
                return { isValid: false, code: '97', message: 'Missing PayPal token' };
            }

            // Capture the order
            const captureResult = await this.captureOrder(token);

            if (!captureResult.success) {
                return { isValid: false, code: '99', message: captureResult.error || 'Capture failed' };
            }

            const purchaseUnit = captureResult.data?.purchase_units?.[0];
            const capture = purchaseUnit?.payments?.captures?.[0];

            return {
                isValid: true,
                code: '00',
                message: 'Success',
                orderId: purchaseUnit?.reference_id || orderId,
                amount: parseFloat(capture?.amount?.value || '0') * 24500, // Convert back to VND
                userId: purchaseUnit?.custom_id,
                transactionNo: capture?.id,
            };
        } catch (error: any) {
            return { isValid: false, code: '99', message: error.message };
        }
    }
}
