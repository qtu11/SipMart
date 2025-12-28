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

    // TODO: Gửi push notification qua FCM
    // FCM vẫn được dùng cho push notifications
    // Notification đã được lưu vào Supabase để hiển thị real-time

    console.log('Notification created:', notificationId);

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification created successfully',
    });
  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send notification',
      },
      { status: 500 }
    );
  }
}

