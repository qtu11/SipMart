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
    // console.log('Email service not configured (DEV mode)');
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
      return { success: false, error: error.message };
    } return { success: true };
  } catch (error: unknown) {
    const err = error as Error; return { success: false, error: err.message || 'Failed to send email' };
  }
}

/**
 * Kiểm tra xem email service đã được setup chưa
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

