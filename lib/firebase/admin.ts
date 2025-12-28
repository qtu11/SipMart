import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';
import type { AdminRoleType } from '@/lib/types';

export interface Admin {
  adminId: string;
  email: string;
  displayName: string;
  role: AdminRoleType;
  storeId?: string;
  createdAt: Date;
}

/**
 * Admin email list - có thể move vào Firestore hoặc env variables
 */
const ADMIN_EMAILS = ['qtusadmin@gmail.com', 'qtusdev@gmail.com'];
const ADMIN_PASSWORD = 'qtusdev';

// Debug: Log admin emails
console.log('📋 Admin emails configured:', ADMIN_EMAILS);

/**
 * Kiểm tra xem email có phải admin không
 */
export function isAdminEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);
  console.log('🔐 Checking admin email:', normalizedEmail, '→', isAdmin ? '✅ Admin' : '❌ Not admin');
  return isAdmin;
}

/**
 * Lấy thông tin admin từ Firestore
 */
export async function getAdmin(userId: string): Promise<Admin | null> {
  try {
    const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, userId));
    if (!adminDoc.exists()) return null;

    const data = adminDoc.data();
    return {
      adminId: adminDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Admin;
  } catch (error) {
    console.error('Error getting admin:', error);
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
    adminId: userId,
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, COLLECTIONS.ADMINS, userId), adminData, { merge: true });

  return {
    adminId: userId,
    email,
    displayName,
    role,
    createdAt: new Date(),
  };
}

/**
 * Kiểm tra user có phải admin không (check cả email và Firestore)
 */
export async function checkIsAdmin(userId: string, email: string): Promise<boolean> {
  // Check email trước
  if (isAdminEmail(email)) {
    // Đảm bảo admin document tồn tại trong Firestore
    let admin = await getAdmin(userId);
    if (!admin) {
      // Tự động tạo admin document nếu chưa có
      admin = await createOrUpdateAdmin(userId, email, email.split('@')[0], 'super_admin');
    }
    return true;
  }

  // Check Firestore
  const admin = await getAdmin(userId);
  return admin !== null;
}

