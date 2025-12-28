/**
 * Admin Authentication Helper for Login Flow
 * Xử lý đăng nhập admin bằng env credentials
 */

import { verifyAdminCredentials } from './admin-auth';
import { createUser } from './users';
import { createOrUpdateAdmin } from './admin';

/**
 * Verify admin credentials và tự động tạo user nếu cần
 * Dùng trong login flow khi user chưa tồn tại trong Supabase Auth
 */
export async function verifyAdminAndCreateUser(email: string, password: string): Promise<{
  isValid: boolean;
  shouldCreateUser: boolean;
  userId?: string;
}> {
  // Verify credentials từ env
  const isValid = verifyAdminCredentials(email, password);
  
  if (!isValid) {
    return { isValid: false, shouldCreateUser: false };
  }

  // Nếu credentials hợp lệ, cho phép tạo user
  // User sẽ được tạo trong signInWithEmail flow
  return {
    isValid: true,
    shouldCreateUser: true,
  };
}
