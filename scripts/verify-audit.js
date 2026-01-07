
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function verify() {
    console.log('🔍 Starting Verification...');

    // 1. Verify Friend Search Security (Should be 401)
    try {
        console.log('👉 Testing Public Friend Search (Expect 401)...');
        const res = await fetch(`${BASE_URL}/api/friends/search-by-student-id?studentId=123`);
        if (res.status === 401) {
            console.log('✅ PASS: Friend search is secured (401 Unauthorized)');
        } else {
            console.error(`❌ FAIL: Friend search returned status ${res.status}`);
        }
    } catch (e) {
        console.error('⚠️ Error contacting server:', e.message);
    }

    // 2. Verify Notifications Auth (Should fail without token, preventing admin-only access)
    try {
        console.log('👉 Testing Notifications API without token (Expect 401)...');
        const res = await fetch(`${BASE_URL}/api/notifications`);
        if (res.status === 401) {
            console.log('✅ PASS: Notifications API is secured (401 Unauthorized)');
        } else {
            console.error(`❌ FAIL: Notifications API returned status ${res.status} (Likely exposed or default admin auth worked)`);
        }
    } catch (e) {
        console.error('⚠️ Error contacting server:', e.message);
    }

    // 3. Verify Admin Broadcast Route (Should be 404 - Deleted)
    try {
        console.log('👉 Testing Deleted Admin Broadcast Route (Expect 404)...');
        const res = await fetch(`${BASE_URL}/api/admin/notifications/broadcast`, { method: 'POST' });
        if (res.status === 404) {
            console.log('✅ PASS: Redundant broadcast route is deleted (404)');
        } else {
            console.error(`❌ FAIL: Broadcast route returned ${res.status}`);
        }
    } catch (e) {
        console.error('⚠️ Error contacting server:', e.message);
    }
}

verify();
