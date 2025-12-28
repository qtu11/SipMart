/**
 * Admin Authentication using Environment Variables
 * Sử dụng ADMIN_KEY và ADMIN_PASSWORD từ env để xác thực admin
 */

/**
 * Kiểm tra admin credentials từ env
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY;
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!adminKey || !adminPassword) {
    console.warn('⚠️ ADMIN_KEY or ADMIN_PASSWORD not set in environment variables');
    return false;
  }

  // Split multiple admin keys (comma-separated)
  const adminKeys = adminKey.split(',').map(k => k.trim().toLowerCase());
  const normalizedEmail = email.toLowerCase().trim();

  const emailMatch = adminKeys.includes(normalizedEmail);
  const passwordMatch = password === adminPassword;

  console.log('🔐 Admin credential check:', {
    email: normalizedEmail,
    emailMatch,
    passwordMatch: passwordMatch ? '✅' : '❌',
  });

  return emailMatch && passwordMatch;
}

/**
 * Kiểm tra admin từ request headers (dùng cho API routes)
 */
export function verifyAdminFromHeaders(headers: Headers): boolean {
  const email = headers.get('x-admin-email');
  const password = headers.get('x-admin-password');

  if (!email || !password) {
    return false;
  }

  return verifyAdminCredentials(email, password);
}

/**
 * Kiểm tra admin từ query params (fallback, ít secure hơn)
 */
export function verifyAdminFromQuery(email?: string, password?: string): boolean {
  if (!email || !password) {
    return false;
  }

  return verifyAdminCredentials(email, password);
}

/**
 * Kiểm tra admin từ request (tries headers first, then query)
 */
export function verifyAdminFromRequest(request: Request): boolean {
  const headers = request.headers;
  const url = new URL(request.url);
  
  // Try headers first (more secure)
  if (verifyAdminFromHeaders(headers)) {
    return true;
  }

  // Fallback to query params (less secure but compatible)
  const email = url.searchParams.get('adminEmail');
  const password = url.searchParams.get('adminPassword');
  
  return verifyAdminFromQuery(email || undefined, password || undefined);
}

