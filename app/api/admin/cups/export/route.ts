import { NextRequest, NextResponse } from 'next/server';
import { getCupWithFallback } from '@/lib/firebase/cups-with-fallback';
import { generateQRCodeData } from '@/lib/utils/cupId';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import QRCode from 'qrcode';

// Export QR codes as ZIP or PDF
export async function GET(request: NextRequest) {
  try {
    // Verify admin
    if (!verifyAdminFromRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin credentials required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cupIdsParam = searchParams.get('cupIds');
    const format = searchParams.get('format') || 'json'; // json, zip, pdf

    if (!cupIdsParam) {
      return NextResponse.json(
        { error: 'Missing cupIds parameter' },
        { status: 400 }
      );
    }

    const cupIds = cupIdsParam.split(',').filter(Boolean);

    if (cupIds.length === 0) {
      return NextResponse.json(
        { error: 'No cup IDs provided' },
        { status: 400 }
      );
    }

    // Fetch cups data và generate QR codes
    const qrCodesData = await Promise.all(
      cupIds.map(async (cupId) => {
        try {
          const cup = await getCupWithFallback(cupId);
          if (!cup) return null;

          const qrData = generateQRCodeData(cupId, cup.material);
          const qrImage = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 400,
            margin: 2,
          });

          return {
            cupId,
            material: cup.material,
            qrData,
            qrImage,
            status: cup.status,
            createdAt: cup.createdAt,
          };
        } catch (error) {
          console.error(`Error generating QR for cup ${cupId}:`, error);
          return null;
        }
      })
    );

    const validQRCodes = qrCodesData.filter(Boolean);

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        count: validQRCodes.length,
        qrCodes: validQRCodes,
      });
    }

    // TODO: Implement ZIP/PDF export nếu cần
    // Hiện tại chỉ support JSON
    return NextResponse.json({
      success: true,
      count: validQRCodes.length,
      qrCodes: validQRCodes,
    });
  } catch (error: any) {
    console.error('Export QR codes error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

