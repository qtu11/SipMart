
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

function stringifyParams(obj, encode = true) {
    return Object.entries(obj)
        .map(([key, value]) => {
            const v = String(value);
            return encode ? `${encodeURIComponent(key)}=${encodeURIComponent(v)}` : `${key}=${v}`;
        })
        .join('&');
}

function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
}

function generateSecureHash(data, secret) {
    const hmac = crypto.createHmac('sha512', secret);
    return hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
}

// Test Data
const secret = process.env.VNP_HASH_SECRET || 'SECRET_KEY_MISSING';
console.log('Secret Key Loaded:', secret ? 'YES (Length: ' + secret.length + ')' : 'NO');
if (secret === 'SECRET_KEY_MISSING' || !secret) {
    console.error('CRITICAL: VNP_HASH_SECRET is missing in .env.local');
    process.exit(1);
}

const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNP_TMN_CODE || 'TEST',
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: 'USER_123_TIME_123',
    vnp_OrderInfo: 'Nap tien vao vi USER 123', // Has spaces
    vnp_OrderType: 'other',
    vnp_Amount: 1000000,
    vnp_ReturnUrl: 'http://localhost:3000/return',
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: '20240101000000',
};

const sortedParams = sortObject(vnpParams);

// Scenario A: Signed with encode=false (Current Code)
const signDataA = stringifyParams(sortedParams, false);
console.log('\n--- Scenario A (Current: encode=false) ---');
console.log('Sign Data:', signDataA);
console.log('Hash A:', generateSecureHash(signDataA, secret));

// Scenario B: Signed with encode=true (Possible Fix)
const signDataB = stringifyParams(sortedParams, true);
console.log('\n--- Scenario B (Proposed: encode=true) ---');
console.log('Sign Data:', signDataB);
console.log('Hash B:', generateSecureHash(signDataB, secret));

console.log('\nChecking which one VNPAY expects: VNPAY usually expects the sign data to represent the exact query string values minus the hash field.');
console.log('If the URL uses encoded values (e.g. Nap%20tien), the hash input usually should also use encoded values OR be raw. But almost all VNPAY integrations use qs/querystring which encodes by default.');
console.log('Wait, standard VNPAY examples often use: query-string module or manual sorting.');
