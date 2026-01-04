import { NextResponse } from 'next/server';
import crypto from 'crypto';
import qs from 'qs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const vnp_Params: any = {};

    // Iterator to object
    for (const [key, value] of searchParams.entries()) {
        vnp_Params[key] = value;
    }

    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASH_SECRET;

    if (!secretKey) {
        return NextResponse.redirect(new URL('/payment-failed?reason=config_error', req.url));
    }

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        if (vnp_Params['vnp_ResponseCode'] === '00') {
            // Success
            return NextResponse.redirect(new URL('/payment-success', req.url));
        } else {
            // Failed with code
            return NextResponse.redirect(new URL(`/payment-failed?code=${vnp_Params['vnp_ResponseCode']}`, req.url));
        }
    } else {
        // Checksum failed
        return NextResponse.redirect(new URL('/payment-failed?reason=checksum_failed', req.url));
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
