import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { getUser } from '@/lib/supabase/users';

export async function GET(request: NextRequest) {
    try {
        // 1. Verify authentication
        const authResult = await verifyAuth(request);

        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Fetch user data (getUser uses admin client internally)
        const userData = await getUser(authResult.userId);

        if (!userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // 3. Return data
        return NextResponse.json(userData);
    } catch (error) {
        console.error('Profile API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
