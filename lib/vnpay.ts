// @ts-nocheck
import crypto from 'crypto';
import querystring from 'querystring';

export const vnpayConfig = {
    tmnCode: process.env.NEXT_PUBLIC_VNP_TMN_CODE || 'EJB9R5MT',
    hashSecret: process.env.VNP_HASH_SECRET || '7KZVOZ7IV70ZIXH4TJKPTCV7I8KBB19M',
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/vnpay_return',
};

// Remove accents for VNPAY compatibility
function removeAccents(str: string) {
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export function sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
}

export function createVnpayUrl(amount: number, orderInfo: string, ipAddr: string, orderId: string, bankCode?: string): string {
    const date = new Date();
    const createDate =
        date.getFullYear().toString() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);

    const vnp_Params: any = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnpayConfig.tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: removeAccents(orderInfo), // Ensure no special chars
        vnp_OrderType: 'other',
        vnp_Amount: Math.floor(amount * 100), // Integer only
        vnp_ReturnUrl: vnpayConfig.returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    const sortedParams = sortObject(vnp_Params);

    // Use querystring.stringify to create the signData
    const signData = querystring.stringify(sortedParams, { encode: false });

    const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    return `${vnpayConfig.url}?${querystring.stringify(sortedParams, { encode: true })}`;
}

export function verifyVnpayReturn(vnp_Params: any): { isValid: boolean; code: string; message: string } {
    const secureHash = vnp_Params['vnp_SecureHash'];

    // Create a copy to manipulate
    let paramsToCheck = { ...vnp_Params };
    delete paramsToCheck['vnp_SecureHash'];
    delete paramsToCheck['vnp_SecureHashType'];

    const sortedParams = sortObject(paramsToCheck);
    const signData = querystring.stringify(sortedParams, { encode: false });

    const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
        return {
            isValid: true,
            code: vnp_Params['vnp_ResponseCode'],
            message: 'Success',
        };
    } else {
        return {
            isValid: false,
            code: '97',
            message: 'Invalid Checksum',
        };
    }
}
