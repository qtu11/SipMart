// VNPay Configuration - Production Ready
// NO HARDCODED CREDENTIALS - All values from environment

import * as crypto from 'crypto';

// Custom stringify function (replaces querystring.stringify)
function stringifyParams(obj: Record<string, string | number>, encode = true): string {
    return Object.entries(obj)
        .map(([key, value]) => {
            const v = String(value);
            return encode ? `${encodeURIComponent(key)}=${encodeURIComponent(v)}` : `${key}=${v}`;
        })
        .join('&');
}

// Validate required environment variables at startup
// Environment validation moved to runtime usage or separate config check
// const requiredEnvVars = ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'VNP_URL', 'VNP_RETURN_URL'];
// const missingVars = requiredEnvVars.filter(v => !process.env[v]);
// if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
//     console.warn(`Warning: Missing required VNPay environment variables: ${missingVars.join(', ')}`);
// }

export const vnpayConfig = {
    tmnCode: process.env.VNP_TMN_CODE || '',
    hashSecret: process.env.VNP_HASH_SECRET || '',
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || 'https://cupsipmart-uefedu-qt.vercel.app/payment/vnpay-return',
    ipnUrl: process.env.VNP_IPN_URL || 'https://cupsipmart-uefedu-qt.vercel.app/api/payment/vnpay_ipn',
};

// VNPay IP whitelist for IPN verification
export const VNPAY_IP_WHITELIST = [
    '113.160.92.202',
    '203.171.19.146',
    '113.52.45.78',
    '116.97.245.130',
    '42.118.107.252',
    '113.20.97.250',
    '127.0.0.1', // localhost for testing
];

// Remove Vietnamese accents for VNPAY compatibility
function removeAccents(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

// Sort object keys alphabetically (required by VNPay)
export function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
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

export interface CreateVnpayUrlParams {
    amount: number;
    orderInfo: string;
    ipAddr: string;
    orderId: string;
    userId: string;
    bankCode?: string;
}

/**
 * Create VNPay payment URL
 * @param params - Payment parameters
 * @returns VNPay payment URL
 */
export function createVnpayUrl(params: CreateVnpayUrlParams): string {
    const { amount, orderInfo, ipAddr, userId, bankCode } = params;

    // Validate config
    if (!vnpayConfig.tmnCode || !vnpayConfig.hashSecret) {
        throw new Error('VNPay configuration is incomplete. Check environment variables.');
    }

    // Generate orderId with userId for IPN tracking
    const date = new Date();
    const createDate =
        date.getFullYear().toString() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);

    // Set expiration to 15 minutes from now
    const expireDateObj = new Date(date.getTime() + 15 * 60 * 1000);
    const expireDate =
        expireDateObj.getFullYear().toString() +
        ('0' + (expireDateObj.getMonth() + 1)).slice(-2) +
        ('0' + expireDateObj.getDate()).slice(-2) +
        ('0' + expireDateObj.getHours()).slice(-2) +
        ('0' + expireDateObj.getMinutes()).slice(-2) +
        ('0' + expireDateObj.getSeconds()).slice(-2);

    // Use provided orderId or fallback to userId_timestamp
    const txnRef = params.orderId || `${userId}_${Date.now()}`;

    const vnpParams: Record<string, string | number> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnpayConfig.tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: removeAccents(orderInfo),
        vnp_OrderType: 'other',
        vnp_Amount: Math.floor(amount * 100), // VNPay requires amount in smallest unit
        vnp_ReturnUrl: vnpayConfig.returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };

    if (bankCode) {
        vnpParams['vnp_BankCode'] = bankCode;
    }

    const sortedParams = sortObject(vnpParams) as Record<string, string | number>;
    const signData = stringifyParams(sortedParams as Record<string, string>, true);
    const secureHash = generateSecureHash(signData, vnpayConfig.hashSecret);

    sortedParams['vnp_SecureHash'] = secureHash;

    return `${vnpayConfig.url}?${stringifyParams(sortedParams as Record<string, string>, true)}`;
}

export interface VnpayReturnResult {
    isValid: boolean;
    code: string;
    message: string;
    txnRef?: string;
    amount?: number;
    userId?: string;
    transactionNo?: string;
    bankCode?: string;
    payDate?: string;
}

/**
 * Verify VNPay callback signature
 * @param vnpParams - Query parameters from VNPay callback
 * @returns Verification result with parsed data
 */
export function verifyVnpayReturn(vnpParams: Record<string, string>): VnpayReturnResult {
    const secureHash = vnpParams['vnp_SecureHash'];

    if (!secureHash) {
        return {
            isValid: false,
            code: '97',
            message: 'Missing SecureHash',
        };
    }

    // Remove hash fields before verification
    const { vnp_SecureHash: _, vnp_SecureHashType: __, ...paramsToCheck } = vnpParams;

    const sortedParams = sortObject(paramsToCheck) as Record<string, string>;
    const signData = stringifyParams(sortedParams, true);
    const computedHash = generateSecureHash(signData, vnpayConfig.hashSecret);

    if (secureHash !== computedHash) {
        return {
            isValid: false,
            code: '97',
            message: 'Invalid Checksum',
        };
    }

    // Parse txnRef to extract userId
    const txnRef = vnpParams['vnp_TxnRef'] || '';
    const [userId] = txnRef.split('_');

    return {
        isValid: true,
        code: vnpParams['vnp_ResponseCode'],
        message: 'Success',
        txnRef,
        amount: parseInt(vnpParams['vnp_Amount'] || '0') / 100,
        userId: userId || undefined,
        transactionNo: vnpParams['vnp_TransactionNo'],
        bankCode: vnpParams['vnp_BankCode'],
        payDate: vnpParams['vnp_PayDate'],
    };
}

/**
 * Check if IP is in VNPay whitelist
 * @param ip - Client IP address
 * @returns True if IP is whitelisted
 */
export function isVnpayIP(ip: string): boolean {
    // In development, allow all IPs
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }
    return VNPAY_IP_WHITELIST.includes(ip);
}

// Response codes
export const VNPAY_RESPONSE_CODES: Record<string, string> = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng thanh toán đang bảo trì',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
    '99': 'Các lỗi khác',
};
