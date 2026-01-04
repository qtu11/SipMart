import { NextResponse } from 'next/server';
import crypto from 'crypto';
import qs from 'qs';
import moment from 'moment';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, bankCode, orderInfo } = body;

        const ipAddr = req.headers.get('x-forwarded-for') || '127.0.0.1';

        const tmnCode = process.env.NEXT_PUBLIC_VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        const vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        const missingEnv = [];
        if (!tmnCode) missingEnv.push('NEXT_PUBLIC_VNP_TMN_CODE');
        if (!secretKey) missingEnv.push('VNP_HASH_SECRET');
        if (!vnpUrl) missingEnv.push('VNP_URL');
        if (!returnUrl) missingEnv.push('VNP_RETURN_URL');

        if (missingEnv.length > 0) {
            console.error('Missing VNPAY configuration:', missingEnv);
            return NextResponse.json({
                error: 'Missing VNPAY configuration',
                details: missingEnv
            }, { status: 500 });
        }

        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId = moment(date).format('DDHHmmss');

        let vnp_Params: any = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = orderInfo;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey!);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;

        const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });
        console.log('VNPAY URL Created:', paymentUrl);

        return NextResponse.json({ url: paymentUrl });
    } catch (error: any) {
        console.error('VNPAY Create Error:', error);
        return NextResponse.json({
            error: 'Failed to create payment',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

function sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
}
