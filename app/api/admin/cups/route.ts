import { NextRequest, NextResponse } from 'next/server';
import { createCupWithFallback } from '@/lib/firebase/cups-with-fallback';
import { addCupsToStoreWithFallback } from '@/lib/firebase/stores-with-fallback';
import { generateUniqueCupId, generateQRCodeData, getMaterialDisplayName } from '@/lib/utils/cupId';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import QRCode from 'qrcode';

// Tạo mã QR cho lô ly mới
export async function POST(request: NextRequest) {
  try {
    // Verify admin using env credentials
    if (!verifyAdminFromRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin credentials required' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { count, material, storeId } = body;

    if (!count || count <= 0 || !material || !storeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const cupIds: string[] = [];
    const qrDataStrings: string[] = [];
    const qrCodes: Array<{ cupId: string; qrData: string; qrImage?: string }> = [];

    // Tạo từng cup với 8-digit ID
    for (let i = 0; i < count; i++) {
      try {
        const cupId = await generateUniqueCupId();
        await createCupWithFallback(cupId, material);
        
        // Tạo QR code data với format: "CUP|{cupId}|{material}|CupSipSmart"
        const qrData = generateQRCodeData(cupId, material);
        
        cupIds.push(cupId);
        qrDataStrings.push(qrData);
        qrCodes.push({ cupId, qrData });
      } catch (cupError: any) {
        console.error(`Error creating cup ${i + 1}/${count}:`, cupError);
        // Continue với các cup khác, nhưng log lỗi
        throw new Error(`Failed to create cup ${i + 1}: ${cupError.message}`);
      }
    }

    // Cập nhật inventory store
    await addCupsToStoreWithFallback(storeId, count);

    // Tạo QR code images (base64)
    const qrCodesWithImages = await Promise.all(
      qrCodes.map(async (qr) => {
        try {
          const qrImage = await QRCode.toDataURL(qr.qrData, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2,
          });
          return { ...qr, qrImage };
        } catch (error) {
          console.error('Error generating QR code image:', error);
          return qr;
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: `Đã tạo ${count} mã QR thành công`,
      cupIds,
      qrDataStrings,
      qrCodes: qrCodesWithImages,
      materialDisplayName: getMaterialDisplayName(material),
      brand: 'CupSipSmart',
      downloadUrl: `/api/admin/cups/export?cupIds=${cupIds.join(',')}`,
    });
  } catch (error: any) {
    console.error('Create cups error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

