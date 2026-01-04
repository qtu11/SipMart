
import { getSupabaseAdmin } from './server';

export interface NotificationData {
  userId: string;
  type: 'success' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

/**
 * Tạo notification mới trong Supabase
 */
export async function createNotification(notificationData: NotificationData): Promise<string> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        url: notificationData.url,
        data: notificationData.data ? JSON.stringify(notificationData.data) : null,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return data.notification_id;
  } catch (error) {    throw error;
  }
}

/**
 * Lấy notifications của user
 */
export async function getUserNotifications(userId: string, limit?: number): Promise<any[]> {
  try {
    let query = getSupabaseAdmin()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {    throw error;
  }
}

/**
 * Đánh dấu notification là đã đọc
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin()
      .from('notifications')
      .update({ read: true })
      .eq('notification_id', notificationId);

    if (error) throw error;
  } catch (error) {    throw error;
  }
}

/**
 * Xóa notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin()
      .from('notifications')
      .delete()
      .eq('notification_id', notificationId);

    if (error) throw error;
  } catch (error) {    throw error;
  }
}

