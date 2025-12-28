/**
 * Helper functions for calling admin APIs with credentials from env
 */

/**
 * Get admin headers for API requests
 */
export function getAdminHeaders(): HeadersInit {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || process.env.ADMIN_KEY;
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!adminKey || !adminPassword) {
    console.warn('⚠️ Admin credentials not found in env');
    return {};
  }

  // Use the first admin key if multiple
  const email = adminKey.split(',')[0].trim();

  return {
    'x-admin-email': email,
    'x-admin-password': adminPassword,
  };
}

/**
 * Fetch with admin credentials
 */
export async function fetchWithAdminAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const adminHeaders = getAdminHeaders();

  Object.entries(adminHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return fetch(url, {
    ...options,
    headers,
  });
}

