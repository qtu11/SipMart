import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'qtusdevadmin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '5qjtQQtkcgJlFP-E45Ap';

async function check() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.log('ERROR: Missing Supabase config');
        process.exit(1);
    }

    const supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Admin Email:', ADMIN_EMAIL);

    const { data: authData, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.log('ERROR:', error.message);
        process.exit(1);
    }

    const adminUser = authData.users.find(u => u.email === ADMIN_EMAIL);

    if (adminUser) {
        console.log('STATUS: Admin user EXISTS');
        console.log('User ID:', adminUser.id);
        console.log('Email:', adminUser.email);
        console.log('Email Confirmed:', adminUser.email_confirmed_at ? 'YES' : 'NO');
        console.log('Created:', adminUser.created_at);

        // Test login
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        });

        if (loginError) {
            console.log('LOGIN: FAILED -', loginError.message);
        } else {
            console.log('LOGIN: SUCCESS');
        }
    } else {
        console.log('STATUS: Admin user NOT FOUND');
        console.log('Total users:', authData.users.length);
    }
}

check().catch(e => console.log('ERROR:', e.message));
