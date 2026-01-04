import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './config';

export interface NotificationData {
  userId: string;
  type: 'success' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

/**
 * Tạo notification mới trong Firestore
 */
export async function createNotification(notificationData: NotificationData): Promise<string> {
  try {
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      read: false,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return notificationRef.id;
  } catch (error) {    throw error;
  }
}

/**
 * Đánh dấu notification là đã đọc
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {    throw error;
  }
}

/**
 * Xóa notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
    });
  } catch (error) {    throw error;
  }
}

/**
 * Lấy FCM token của user từ Firestore
 */
export async function getUserFCMToken(userId: string): Promise<string | null> {
  try {
    const userDoc = await import('./users').then(m => m.getUser(userId));
    if (userDoc && (userDoc as any).fcmToken) {
      return (userDoc as any).fcmToken;
    }
    return null;
  } catch (error) {    return null;
  }
}

