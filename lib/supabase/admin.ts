import { getSupabaseAdmin } from './server';
import { verifyAdminCredentials } from './admin-auth';
import type { AdminRoleType } from '@/lib/types';

export interface Admin {
  admin_id: string;
  email: string;
  display_name: string;
  role: AdminRoleType;
  store_id?: string;
  created_at: Date;
}

/**
 * Admin email list (fallback if env not set)
 */
const ADMIN_EMAILS = ['qtusadmin@gmail.com', 'qtusdev@gmail.com'];

/**
 * Kiểm tra xem email có phải admin không (từ env hoặc hardcoded list)
 */
export function isAdminEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();

  // Check env first
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (adminKey) {
    const adminKeys = adminKey.split(',').map(k => k.trim().toLowerCase());
    if (adminKeys.includes(normalizedEmail)) {
      return true;
    }
  }

  // Fallback to hardcoded list
  const isAdmin = ADMIN_EMAILS.includes(normalizedEmail); return isAdmin;
}

/**
 * Kiểm tra admin credentials (email + password)
 */
export function verifyAdmin(email: string, password: string): boolean {
  return verifyAdminCredentials(email, password);
}

/**
 * Lấy thông tin admin từ Supabase
 */
export async function getAdmin(userId: string): Promise<Admin | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('admins')
      .select('*')
      .eq('admin_id', userId)
      .single();

    if (error || !data) return null;

    return {
      admin_id: data.admin_id,
      email: data.email,
      display_name: data.display_name,
      role: data.role as AdminRoleType,
      store_id: data.store_id || undefined,
      created_at: new Date(data.created_at),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Tạo hoặc update admin document
 */
export async function createOrUpdateAdmin(
  userId: string,
  email: string,
  displayName: string,
  role: AdminRoleType = 'super_admin'
): Promise<Admin> {
  const adminData = {
    admin_id: userId,
    email,
    display_name: displayName,
    role,
  };

  const { data, error } = await getSupabaseAdmin()
    .from('admins')
    .upsert(adminData, { onConflict: 'admin_id' })
    .select()
    .single();

  if (error) throw error;

  return {
    admin_id: data.admin_id,
    email: data.email,
    display_name: data.display_name,
    role: data.role as AdminRoleType,
    store_id: data.store_id || undefined,
    created_at: new Date(data.created_at),
  };
}

/**
 * Kiểm tra user có phải admin không (check cả email và Supabase)
 */
export async function checkIsAdmin(userId: string, email: string): Promise<boolean> {
  // Check email trước
  if (isAdminEmail(email)) {
    // Đảm bảo admin document tồn tại trong Supabase
    let admin = await getAdmin(userId);
    if (!admin) {
      // Tự động tạo admin document nếu chưa có
      admin = await createOrUpdateAdmin(userId, email, email.split('@')[0], 'super_admin');
    }
    return true;
  }

  // Check Supabase
  const admin = await getAdmin(userId);
  return admin !== null;
}


/**
 * Helper để check admin cho API Routes
 * Verify headers: x-admin-email, x-admin-password
 */
export async function checkAdminApi(req: Request): Promise<boolean> {
  const email = req.headers.get('x-admin-email');
  const password = req.headers.get('x-admin-password');

  if (!email || !password) return false;
  return verifyAdmin(email, password);
}
