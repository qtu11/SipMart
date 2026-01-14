
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { sendPushNotification } from './push';
import { logger } from '@/lib/logger';

interface CreateNotificationParams {
    userId: string;
    type: 'success' | 'warning' | 'info' | 'reminder' | 'system';
    title: string;
    message: string;
    url?: string;
    data?: any;
    priority?: 'low' | 'normal' | 'high';
}

/**
 * Centralized function to create notifications.
 * Handles database insertion (supporting both schemas if needed) and FCM push.
 */
export async function createNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, url, data, priority = 'normal' } = params;
    const supabase = getSupabaseAdmin();

    try {
        // 1. Insert into system_notifications (New Schema)
        // We first create the notification content
        const { data: notificationData, error: notificationError } = await supabase
            .from('system_notifications')
            .insert({
                type,
                title,
                message,
                action_url: url,
                priority,
                // data: data ? JSON.stringify(data) : null, // If column exists
            })
            .select()
            .single();

        const notificationId = notificationData?.notification_id;

        if (notificationError) {
            // Fallback or just log error. 
            // If system_notifications doesn't exist (e.g. migration 012 not applied), we might fall back to 'notifications' table.
            logger.warn('Failed to insert into system_notifications, trying legacy table', { error: notificationError });

            const { error: legacyError } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type,
                    title,
                    message,
                    url,
                    data: data ? JSON.stringify(data) : null,
                });

            if (legacyError) throw legacyError;

            // Legacy table doesn't need recipient mapping usually
            return;
        }

        // 2. Insert into notification_recipients
        if (notificationId) {
            const { error: recipientError } = await supabase
                .from('notification_recipients')
                .insert({
                    notification_id: notificationId,
                    user_id: userId,
                    is_read: false
                });

            if (recipientError) throw recipientError;
        }

        // 3. Send FCM Push Notification (Async, don't block)
        // Check if user has FCM token (you might need a table for logic, or pass it in)
        const { data: user } = await supabase
            .from('users')
            .select('fcm_token') // Assuming this column exists or will exist
            .eq('user_id', userId)
            .single();

        if (user?.fcm_token) {
            await sendPushNotification(user.fcm_token, title, message, { url, ...data });
        }

    } catch (error) {
        // Safe logger
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to create notification', { userId, error: err.message });
    }
}
