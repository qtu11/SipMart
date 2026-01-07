
import qs from 'qs';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const secret = process.env.VNP_HASH_SECRET;
const tmnCode = process.env.VNP_TMN_CODE;

console.log('--- VNPAY DEBUG CONFIG ---');
console.log('TMN Code:', tmnCode);
console.log('Secret Length:', secret ? secret.length : 0);
console.log('Secret (first 4):', secret ? secret.substring(0, 4) : 'NULL');

if (!secret || !tmnCode) {
    console.error('Missing ENV vars');
    process.exit(1);
}

// Mock Data matching the user's failed request context if possible
// Or generic data
const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND', // Note: User code might strictly need sorting
    vnp_TxnRef: 'DEBUG_' + Date.now(),
    vnp_OrderInfo: 'Nap tien vao vi DEBUG',
    vnp_OrderType: 'other',
    vnp_Amount: 1000000, // 10k VND * 100
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: '20240101000000',
};

// Sort
const sortedParams = {};
Object.keys(vnpParams).sort().forEach(key => {
    sortedParams[key] = vnpParams[key];
});

// Method 1: Custom Stringify (Current Implementation in lib/vnpay.ts)
function customStringify(obj) {
    return Object.entries(obj)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
}

// Method 2: QS Stringify
function qsStringify(obj) {
    return qs.stringify(obj, { encode: true });
}

const signDataCustom = customStringify(sortedParams);
const signDataQs = qsStringify(sortedParams);

console.log('\n--- SIGN DATA COMPARISON ---');
console.log('Custom:', signDataCustom);
console.log('QS    :', signDataQs);
console.log('Match :', signDataCustom === signDataQs);

const hashCustom = crypto.createHmac('sha512', secret).update(Buffer.from(signDataCustom, 'utf-8')).digest('hex');
const hashQs = crypto.createHmac('sha512', secret).update(Buffer.from(signDataQs, 'utf-8')).digest('hex');

console.log('\n--- HASH COMPARISON ---');
console.log('Custom Hash:', hashCustom);
console.log('QS Hash    :', hashQs);

const finalUrl = `${process.env.VNP_URL}?${signDataCustom}&vnp_SecureHash=${hashCustom}`;
console.log('\n--- GENERATED URL ---');
console.log(finalUrl);
