/**
 * VNPay Payment Provider
 * Refactored from lib/vnpay.ts to implement PaymentProvider interface
 */

import * as crypto from 'crypto';
import type { PaymentProvider, CreatePaymentParams, PaymentUrlResult, VerifyCallbackResult } from './index';

// Custom stringify function
function stringifyParams(obj: Record<string, string | number>, encode = true): string {
    return Object.entries(obj)
        .map(([key, value]) => {
            const v = String(value);
            return encode ? `${encodeURIComponent(key)}=${encodeURIComponent(v)}` : `${key}=${v}`;
        })
        .join('&');
}

// Sort object keys alphabetically (required by VNPay)
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
}

// Generate secure hash using HMAC-SHA512
function generateSecureHash(data: string, secret: string): string {
    const hmac = crypto.createHmac('sha512', secret);
    return hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
}

// Remove Vietnamese accents
function removeAccents(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

export class VNPayProvider implements PaymentProvider {
    providerId = 'VNPAY';
    providerName = 'VNPAY - Thẻ ATM/Internet Banking';

    private get config() {
        return {
            tmnCode: process.env.VNP_TMN_CODE || '',
            hashSecret: process.env.VNP_HASH_SECRET || '',
            url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
        };
    }

    async createPaymentUrl(params: CreatePaymentParams): Promise<PaymentUrlResult> {
        try {
            const { orderId, amount, userId, orderInfo, ipAddr, bankCode } = params;

            if (!this.config.tmnCode || !this.config.hashSecret) {
                return { success: false, error: 'VNPay configuration is incomplete' };
            }

            const date = new Date();
            const createDate = this.formatDate(date);
            const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000));
            const txnRef = orderId || `${userId}_${Date.now()}`;

            const vnpParams: Record<string, string | number> = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: this.config.tmnCode,
                vnp_Locale: 'vn',
                vnp_CurrCode: 'VND',
                vnp_TxnRef: txnRef,
                vnp_OrderInfo: removeAccents(orderInfo || `Thanh toan don hang ${txnRef}`),
                vnp_OrderType: 'other',
                vnp_Amount: Math.floor(amount * 100),
                vnp_ReturnUrl: params.returnUrl || this.config.returnUrl,
                vnp_IpAddr: ipAddr || '127.0.0.1',
                vnp_CreateDate: createDate,
                vnp_ExpireDate: expireDate,
            };

            if (bankCode) {
                vnpParams['vnp_BankCode'] = bankCode;
            }

            const sortedParams = sortObject(vnpParams) as Record<string, string | number>;
            const signData = stringifyParams(sortedParams as Record<string, string>, true);
            const secureHash = generateSecureHash(signData, this.config.hashSecret);

            sortedParams['vnp_SecureHash'] = secureHash;

            const url = `${this.config.url}?${stringifyParams(sortedParams as Record<string, string>, true)}`;

            return { success: true, url, transactionId: txnRef };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async verifyCallback(params: Record<string, string>): Promise<VerifyCallbackResult> {
        const secureHash = params['vnp_SecureHash'];

        if (!secureHash) {
            return { isValid: false, code: '97', message: 'Missing SecureHash' };
        }

        const { vnp_SecureHash: _, vnp_SecureHashType: __, ...paramsToCheck } = params;
        const sortedParams = sortObject(paramsToCheck) as Record<string, string>;
        const signData = stringifyParams(sortedParams, true);
        const computedHash = generateSecureHash(signData, this.config.hashSecret);

        if (secureHash !== computedHash) {
            return { isValid: false, code: '97', message: 'Invalid Checksum' };
        }

        const txnRef = params['vnp_TxnRef'] || '';
        const [userId] = txnRef.split('_');

        return {
            isValid: true,
            code: params['vnp_ResponseCode'],
            message: params['vnp_ResponseCode'] === '00' ? 'Success' : 'Failed',
            orderId: txnRef,
            amount: parseInt(params['vnp_Amount'] || '0') / 100,
            userId: userId || undefined,
            transactionNo: params['vnp_TransactionNo'],
            bankCode: params['vnp_BankCode'],
        };
    }

    private formatDate(date: Date): string {
        return (
            date.getFullYear().toString() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2)
        );
    }
}
