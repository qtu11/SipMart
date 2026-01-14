import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/supabase/notifications';

/**
 * API để gửi push notification
 * Sử dụng FCM Admin SDK (cần setup Cloud Functions) hoặc gọi từ server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, url, data } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Lưu notification vào Firestore
    const notificationId = await createNotification({
      userId,
      type: type || 'info',
      title,
      message,
      url,
      data,
    });

    // Send FCM Push Notification
    // This is Fire-and-Forget, we don't block the response
    if (body.fcmToken) {
      const { sendPushNotification } = await import('@/lib/notifications/push');
      // Don't await specifically to avoid latency, or await if critical
      sendPushNotification(body.fcmToken, title, message, data).catch(e =>
        console.error('FCM Push failed', e)
      );
    } else {
      // Broadcast to user's registered devices (Requires storing FCM tokens in DB)
      // For now, we assume client sends fcmToken in body or we skip if not provided
    }

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification created successfully',
    });
  } catch (error: unknown) {
    const err = error as Error; return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to send notification',
      },
      { status: 500 }
    );
  }
}

