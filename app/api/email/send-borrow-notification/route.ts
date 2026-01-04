import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

// API để gửi email thông báo khi mượn ly
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, cupId, transactionId, dueTime, storeName } = body;

    if (!email || !cupId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dueDate = new Date(dueTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailContent = {
      to: email,
      subject: '🎉 Mượn ly thành công - CupSipMart',
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
            .info-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Mượn ly thành công!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${displayName || email}</strong>,</p>
              
              <p>Cảm ơn bạn đã tham gia hành trình sống xanh! 🌱</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">Thông tin giao dịch:</h3>
                <p><strong>Mã giao dịch:</strong> ${transactionId}</p>
                <p><strong>Mã ly:</strong> ${cupId}</p>
                <p><strong>Điểm mượn:</strong> ${storeName || 'Cửa hàng'}</p>
                <p><strong>Hạn trả:</strong> ${dueDate}</p>
              </div>
              
              <div class="warning-box">
                <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
                <ul>
                  <li>Vui lòng trả ly trước <strong>${dueDate}</strong></li>
                  <li>Trả đúng hạn để nhận 50 Green Points 🌟</li>
                  <li>Trả quá hạn chỉ nhận 20 Green Points</li>
                  <li>Tiền cọc 20,000đ sẽ được hoàn lại khi trả ly</li>
                </ul>
              </div>
              
              <p><strong>🌟 Tác động môi trường:</strong></p>
              <p>Bạn vừa giúp giảm <strong>1 ly nhựa</strong> - tương đương bớt đi <strong>450 năm ô nhiễm</strong>! Cảm ơn bạn đã góp phần bảo vệ hành tinh! 🌍</p>
              
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scan" class="button">
                  Quét QR để trả ly
                </a>
              </p>
              
              <p>Chúc bạn có trải nghiệm tuyệt vời với CupSipMart!</p>
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
Mượn ly thành công!

Xin chào ${displayName || email},

Cảm ơn bạn đã tham gia hành trình sống xanh!

Thông tin giao dịch:
- Mã giao dịch: ${transactionId}
- Mã ly: ${cupId}
- Điểm mượn: ${storeName || 'Cửa hàng'}
- Hạn trả: ${dueDate}

⚠️ Lưu ý quan trọng:
- Vui lòng trả ly trước ${dueDate}
- Trả đúng hạn để nhận 50 Green Points
- Trả quá hạn chỉ nhận 20 Green Points
- Tiền cọc 20,000đ sẽ được hoàn lại khi trả ly

🌟 Tác động môi trường:
Bạn vừa giúp giảm 1 ly nhựa - tương đương bớt đi 450 năm ô nhiễm!

Truy cập: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scan để trả ly

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
      message: 'Borrow notification email sent successfully',
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to send email',
      },
      { status: 500 }
    );
  }
}

