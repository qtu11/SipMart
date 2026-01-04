import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/supabase/users';
import { isAdminEmail, createOrUpdateAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, displayName, studentId } = body;

        if (!userId || !email) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. Check & Create Admin if applicable
        if (isAdminEmail(email)) {
            try {
                await createOrUpdateAdmin(
                    userId,
                    email,
                    displayName || email.split('@')[0],
                    'super_admin'
                );
            } catch (adminError) {
                console.error('Error creating admin record:', adminError);
                // Continue to create user even if admin creation fails
            }
        }

        // 2. Create User Profile
        await createUser(userId, email, displayName, studentId);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Post-register error:', error);
        const err = error as Error;
        return NextResponse.json(
            {
                success: false,
                error: err.message || 'Internal server error'
            },
            { status: 500 }
        );
    }
}
