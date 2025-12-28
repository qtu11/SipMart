/**
 * Helper functions for admin authentication in client-side pages
 */

import { verifyAdminCredentials } from './admin-auth';

/**
 * Verify admin credentials (client-side, reads from public env)
 * Note: This is less secure, should only be used for UI checks
 */
export function verifyAdminClient(email: string, password: string): boolean {
  // Client-side can only read NEXT_PUBLIC_* vars
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!adminKey || !adminPassword) {
    return false;
  }

  const adminKeys = adminKey.split(',').map(k => k.trim().toLowerCase());
  const normalizedEmail = email.toLowerCase().trim();

  return adminKeys.includes(normalizedEmail) && password === adminPassword;
}

