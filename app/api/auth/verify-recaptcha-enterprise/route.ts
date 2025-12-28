import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/firebase/recaptcha';

// API route để verify reCAPTCHA Enterprise với Google Cloud
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action } = body;

    if (!token || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing token or action' },
        { status: 400 }
      );
    }

    // Verify với Google Cloud reCAPTCHA Enterprise
    const result = await verifyRecaptcha(token, action);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          score: result.score,
          error: result.error || 'Verification failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      score: result.score,
      action,
    });
  } catch (error: any) {
    console.error('reCAPTCHA Enterprise verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

