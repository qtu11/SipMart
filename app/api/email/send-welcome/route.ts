import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

// API để gửi email chào mừng khi đăng ký
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, userId } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email' },
        { status: 400 }
      );
    }

    const emailContent = {
      to: email,
      subject: 'Chào mừng đến với CupSipMart! 🌱',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌱 Chào mừng đến với CupSipMart!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${displayName || email}</strong>,</p>
              
              <p>Cảm ơn bạn đã tham gia cộng đồng sống xanh của chúng tôi! 🎉</p>
              
              <p>Với CupSipMart, bạn có thể:</p>
              <ul>
                <li>✅ Mượn ly tái sử dụng thay vì dùng ly nhựa</li>
                <li>✅ Nhận Green Points mỗi khi trả ly đúng hạn</li>
                <li>✅ Theo dõi tác động môi trường của bạn</li>
                <li>✅ Tham gia bảng xếp hạng sống xanh</li>
              </ul>
              
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
                  Bắt đầu ngay
                </a>
              </p>
              
              <p><strong>Mẹo:</strong> Nạp tiền vào ví để sẵn sàng mượn ly. Mỗi ly cần cọc 20,000đ và sẽ được hoàn lại khi bạn trả ly!</p>
              
              <p>Chúc bạn có trải nghiệm tuyệt vời với CupSipMart! 🌍</p>
            </div>
            <div class="footer">
              <p>CupSipMart - Mượn ly, Cứu hành tinh</p>
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Chào mừng đến với CupSipMart!

Xin chào ${displayName || email},

Cảm ơn bạn đã tham gia cộng đồng sống xanh của chúng tôi!

Với CupSipMart, bạn có thể:
- Mượn ly tái sử dụng thay vì dùng ly nhựa
- Nhận Green Points mỗi khi trả ly đúng hạn
- Theo dõi tác động môi trường của bạn
- Tham gia bảng xếp hạng sống xanh

Truy cập: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

Mẹo: Nạp tiền vào ví để sẵn sàng mượn ly. Mỗi ly cần cọc 20,000đ và sẽ được hoàn lại khi bạn trả ly!

Chúc bạn có trải nghiệm tuyệt vời với CupSipMart!

CupSipMart - Mượn ly, Cứu hành tinh
      `,
    };

    // Gửi email qua Resend service
    const result = await sendEmail(emailContent);
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    });
  } catch (error: any) {
    console.error('Send welcome email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send email',
      },
      { status: 500 }
    );
  }
}

