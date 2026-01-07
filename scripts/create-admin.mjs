import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'qtusdevadmin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '5qjtQQtkcgJlFP-E45Ap';

async function createAdmin() {
    console.log('Creating admin user in Supabase...\n');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.log('ERROR: Missing Supabase configuration');
        console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Admin Email:', ADMIN_EMAIL);
    console.log('Admin Password:', ADMIN_PASSWORD.substring(0, 3) + '***\n');

    try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users.find(u => u.email === ADMIN_EMAIL);

        if (existing) {
            console.log('WARNING: Admin user already exists!');
            console.log('User ID:', existing.id);
            console.log('Created:', existing.created_at);
            console.log('\nSkipping creation...');
            return;
        }

        // Create admin user in Supabase Auth
        console.log('Creating admin user in Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                role: 'admin',
                is_admin: true,
                display_name: 'Administrator'
            }
        });

        if (authError) {
            console.log('ERROR creating user:', authError.message);
            process.exit(1);
        }

        console.log('SUCCESS: Admin user created in Auth!');
        console.log('User ID:', authData.user.id);
        console.log('Email:', authData.user.email);

        // Try to add to users table if it exists
        console.log('\nChecking if users table exists...');
        const { error: tableError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (!tableError) {
            console.log('Adding admin to users table...');
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: ADMIN_EMAIL,
                    username: 'admin',
                    display_name: 'Administrator',
                    role: 'admin',
                    is_admin: true,
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.log('WARNING: Could not add to users table:', insertError.message);
                console.log('(User exists in Auth but not in users table)');
            } else {
                console.log('SUCCESS: Admin added to users table!');
            }
        } else {
            console.log('Users table not found or no access - skipping');
        }

        // Test login
        console.log('\nTesting admin login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        });

        if (loginError) {
            console.log('ERROR: Login test failed:', loginError.message);
        } else {
            console.log('SUCCESS: Login test passed!');
            console.log('Access token:', loginData.session?.access_token?.substring(0, 20) + '...');
        }

        console.log('\n' + '='.repeat(60));
        console.log('ADMIN USER CREATED SUCCESSFULLY!');
        console.log('Email:', ADMIN_EMAIL);
        console.log('Password:', ADMIN_PASSWORD);
        console.log('='.repeat(60));

    } catch (error) {
        console.log('ERROR:', error.message);
        process.exit(1);
    }
}

createAdmin().catch(e => {
    console.log('ERROR:', e.message);
    process.exit(1);
});
