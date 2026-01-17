/**
 * Admin Authentication using Supabase Session  
 * Checks if logged-in user has admin email
 */

import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Check if email is an admin email
 */
export function isAdminEmail(email: string): boolean {
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'qtusadmin@gmail.com';

  // Split multiple admin keys (comma-separated)
  const adminKeys = adminKey.split(',').map(k => k.trim().toLowerCase());
  const normalizedEmail = email.toLowerCase().trim();

  return adminKeys.includes(normalizedEmail);
}

/**
 * Verify admin from Supabase session
 * Uses the logged-in user's email to check if they're admin
 */
export async function verifyAdminFromRequest(request: Request): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();

    // Get user from request headers (authorization header)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('[AdminAuth] Missing Authorization header');
      return false;
    }

    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (error || !user) {
      console.log('[AdminAuth] Invalid token or user not found:', error?.message);
      return false;
    }

    const email = user.email;
    if (!email) {
      console.log('[AdminAuth] User has no email');
      return false;
    }

    const isAdmin = isAdminEmail(email);
    if (!isAdmin) {
      console.log(`[AdminAuth] Access denied for email: ${email}. Allowed: ${process.env.ADMIN_KEY}`);
    } else {
      console.log(`[AdminAuth] Access granted for email: ${email}`);
    }
    return isAdmin;
  } catch (error) {
    console.error('[AdminAuth] Verification error:', error);
    return false;
  }
}

/**
 * Verify admin credentials (for login)
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'qtusadmin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'qtusdev';

  if (!adminKey || !adminPassword) {
    return false;
  }

  const adminKeys = adminKey.split(',').map(k => k.trim().toLowerCase());
  const normalizedEmail = email.toLowerCase().trim();

  const emailMatch = adminKeys.includes(normalizedEmail);
  const passwordMatch = password === adminPassword;

  return emailMatch && passwordMatch;
}
