import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Gửi email sử dụng Resend
 * Fallback về console.log nếu không có API key (development mode)
 */
export async function sendEmail(content: EmailContent): Promise<{ success: boolean; error?: string }> {
  // Nếu không có API key, log ra console (development mode)
  if (!resend) {
    console.log('📧 [DEV MODE] Email would be sent:', {
      to: content.to,
      subject: content.subject,
    });
    console.log('📧 [DEV MODE] Email HTML:', content.html.substring(0, 200) + '...');
    return { success: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CupSipMart <onboarding@resend.dev>',
      to: content.to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent successfully:', data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Send email error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Kiểm tra xem email service đã được setup chưa
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

