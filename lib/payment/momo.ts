/**
 * MoMo Payment Provider
 * Implements PaymentProvider interface for MoMo wallet
 */

import * as crypto from 'crypto';
import type { PaymentProvider, CreatePaymentParams, PaymentUrlResult, VerifyCallbackResult } from './index';

export class MoMoProvider implements PaymentProvider {
    providerId = 'MOMO';
    providerName = 'Ví MoMo';

    private get config() {
        return {
            partnerCode: process.env.MOMO_PARTNER_CODE || '',
            accessKey: process.env.MOMO_ACCESS_KEY || '',
            secretKey: process.env.MOMO_SECRET_KEY || '',
            endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
            returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:3000/payment/momo-return',
            ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payment/ipn/momo',
        };
    }

    async createPaymentUrl(params: CreatePaymentParams): Promise<PaymentUrlResult> {
        try {
            const { orderId, amount, userId, orderInfo } = params;

            if (!this.config.partnerCode || !this.config.accessKey || !this.config.secretKey) {
                return { success: false, error: 'MoMo configuration is incomplete. Please add MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY to environment.' };
            }

            const requestId = `${orderId}_${Date.now()}`;
            const requestType = 'captureWallet';
            const extraData = Buffer.from(JSON.stringify({ userId })).toString('base64');
            const order = orderInfo || `Nap tien vi SipSmart - ${orderId}`;

            // Create signature
            const rawSignature = [
                `accessKey=${this.config.accessKey}`,
                `amount=${amount}`,
                `extraData=${extraData}`,
                `ipnUrl=${this.config.ipnUrl}`,
                `orderId=${orderId}`,
                `orderInfo=${order}`,
                `partnerCode=${this.config.partnerCode}`,
                `redirectUrl=${params.returnUrl || this.config.returnUrl}`,
                `requestId=${requestId}`,
                `requestType=${requestType}`,
            ].join('&');

            const signature = crypto
                .createHmac('sha256', this.config.secretKey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = {
                partnerCode: this.config.partnerCode,
                partnerName: 'SipSmart',
                storeId: 'SipSmartStore',
                requestId,
                amount,
                orderId,
                orderInfo: order,
                redirectUrl: params.returnUrl || this.config.returnUrl,
                ipnUrl: this.config.ipnUrl,
                lang: 'vi',
                requestType,
                autoCapture: true,
                extraData,
                signature,
            };

            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (data.resultCode === 0 && data.payUrl) {
                return { success: true, url: data.payUrl, transactionId: orderId };
            }

            return { success: false, error: data.message || 'MoMo payment creation failed' };
        } catch (error: any) {
            console.error('[MoMo] createPaymentUrl error:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyCallback(params: Record<string, string>): Promise<VerifyCallbackResult> {
        try {
            const {
                partnerCode,
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message,
                payType,
                responseTime,
                extraData,
                signature,
            } = params;

            // Verify signature
            const rawSignature = [
                `accessKey=${this.config.accessKey}`,
                `amount=${amount}`,
                `extraData=${extraData}`,
                `message=${message}`,
                `orderId=${orderId}`,
                `orderInfo=${orderInfo}`,
                `orderType=${orderType}`,
                `partnerCode=${partnerCode}`,
                `payType=${payType}`,
                `requestId=${requestId}`,
                `responseTime=${responseTime}`,
                `resultCode=${resultCode}`,
                `transId=${transId}`,
            ].join('&');

            const computedSignature = crypto
                .createHmac('sha256', this.config.secretKey)
                .update(rawSignature)
                .digest('hex');

            if (signature !== computedSignature) {
                return { isValid: false, code: '97', message: 'Invalid signature' };
            }

            // Parse extraData to get userId
            let userId: string | undefined;
            try {
                const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString());
                userId = decoded.userId;
            } catch { }

            const isSuccess = resultCode === '0';

            return {
                isValid: true,
                code: resultCode,
                message: isSuccess ? 'Success' : message,
                orderId,
                amount: parseInt(amount),
                userId,
                transactionNo: transId,
            };
        } catch (error: any) {
            return { isValid: false, code: '99', message: error.message };
        }
    }
}
