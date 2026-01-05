import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API route để tạo admin user - CHỈ DÙNG CHO DEVELOPMENT
export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
            return NextResponse.json(
                { error: 'Missing configuration', details: 'Check env vars: SUPABASE_URL, SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD' },
                { status: 500 }
            );
        }

        // Use service role to create user (bypasses email confirmation)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Try to create user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
                display_name: 'Administrator',
                role: 'admin'
            }
        });

        if (authError) {
            // Check if user already exists
            if (authError.message?.includes('already') || authError.message?.includes('exists')) {
                // Get list of users to find admin
                const { data: users } = await supabaseAdmin.auth.admin.listUsers();
                const adminUser = users?.users?.find(u => u.email === adminEmail);

                if (adminUser) {
                    // Update password
                    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                        adminUser.id,
                        { password: adminPassword, email_confirm: true }
                    );

                    if (updateError) {
                        return NextResponse.json(
                            { error: 'Admin exists but failed to update', details: updateError.message },
                            { status: 500 }
                        );
                    }

                    // Create/update in users table
                    await supabaseAdmin
                        .from('users')
                        .upsert({
                            user_id: adminUser.id,
                            email: adminEmail,
                            display_name: 'Administrator',
                            wallet_balance: 1000000
                        }, { onConflict: 'user_id' });

                    // Create/update in admins table
                    await supabaseAdmin
                        .from('admins')
                        .upsert({
                            admin_id: adminUser.id,
                            email: adminEmail,
                            display_name: 'Administrator',
                            role: 'super_admin'
                        }, { onConflict: 'admin_id' });

                    return NextResponse.json({
                        success: true,
                        message: 'Admin user updated successfully',
                        userId: adminUser.id,
                        email: adminEmail
                    });
                }
            }

            return NextResponse.json(
                { error: authError.message },
                { status: 500 }
            );
        }

        const userId = authData.user.id;

        // Create user record in users table
        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
                user_id: userId,
                email: adminEmail,
                display_name: 'Administrator',
                wallet_balance: 1000000,
                green_points: 0,
                rank_level: 'forest'
            }, { onConflict: 'user_id' });

        if (userError) {
            console.error('Failed to create user record:', userError);
        }

        // Create admin record
        const { error: adminError } = await supabaseAdmin
            .from('admins')
            .upsert({
                admin_id: userId,
                email: adminEmail,
                display_name: 'Administrator',
                role: 'super_admin'
            }, { onConflict: 'admin_id' });

        if (adminError) {
            console.error('Failed to create admin record:', adminError);
        }

        return NextResponse.json({
            success: true,
            message: 'Admin user created successfully!',
            userId,
            email: adminEmail,
            loginUrl: '/auth/login'
        });

    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { error: err.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

// GET - Check if admin exists
export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ exists: false, error: 'Not configured' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            return NextResponse.json({ exists: false, error: 'Admin email not configured' });
        }

        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const adminUser = users?.users?.find(u => u.email === adminEmail);

        return NextResponse.json({
            exists: !!adminUser,
            email: adminEmail,
            userId: adminUser?.id
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ exists: false, error: err.message });
    }
}
