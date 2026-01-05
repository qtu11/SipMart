import { NextRequest, NextResponse } from 'next/server';

/**
 * Authentication middleware helper
 * Verifies the user is authenticated via Firebase/Supabase
 */
export async function verifyAuth(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { authenticated: false, userId: null, error: 'Missing or invalid authorization header' };
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token with Firebase Admin or Supabase
        const { getSupabaseAdmin } = await import('@/lib/supabase/server');
        const supabase = getSupabaseAdmin();

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return { authenticated: false, userId: null, error: 'Invalid or expired token' };
        }

        return { authenticated: true, userId: user.id, error: null };
    } catch (error) {
        return { authenticated: false, userId: null, error: 'Authentication failed' };
    }
}

/**
 * Verify CRON job authentication
 * Uses secret key to prevent unauthorized access
 */
export function verifyCronAuth(request: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        throw new Error('CRON_SECRET is not configured');
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
        return false;
    }

    // Support both "Bearer <secret>" and direct secret
    const providedSecret = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;

    return providedSecret === cronSecret;
}

/**
 * Admin authentication helper
 * Checks if user has admin role in database
 */
export async function verifyAdminAuth(request: NextRequest) {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || !authResult.userId) {
        return { authenticated: false, isAdmin: false, userId: null, error: authResult.error };
    }

    try {
        const { getSupabaseAdmin } = await import('@/lib/supabase/server');
        const supabase = getSupabaseAdmin();

        // Check if user exists in admins table
        const { data: admin, error } = await supabase
            .from('admins')
            .select('admin_id, role')
            .eq('admin_id', authResult.userId)
            .single();

        if (error || !admin) {
            return { authenticated: true, isAdmin: false, userId: authResult.userId, error: 'User is not an admin' };
        }

        return { authenticated: true, isAdmin: true, userId: authResult.userId, role: admin.role, error: null };
    } catch (error) {
        return { authenticated: true, isAdmin: false, userId: authResult.userId, error: 'Admin verification failed' };
    }
}
