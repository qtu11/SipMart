// API: Custom QR Code Design (Admin)
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cupId, logo, color, size, format, includeLabel, labelText } = body;

    if (!cupId) {
      return NextResponse.json(
        { success: false, error: 'Missing cupId' },
        { status: 400 }
      );
    }

    const qrSize = size || 500;
    const qrColor = color || '#22c55e';

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(cupId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: qrSize,
      margin: 2,
      color: {
        dark: qrColor,
        light: '#FFFFFF',
      },
    });

    // TODO: Add logo overlay using canvas
    // TODO: Generate PDF format if requested
    // TODO: Add label if requested

    return NextResponse.json({
      success: true,
      qrCode: qrDataUrl,
      cupId,
    });
  } catch (error: unknown) {
    const err = error as Error;    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

