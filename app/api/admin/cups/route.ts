import { NextRequest, NextResponse } from 'next/server';
import { createCupWithFallback } from '@/lib/firebase/cups-with-fallback';
import { addCupsToStoreWithFallback } from '@/lib/firebase/stores-with-fallback';
import { generateUniqueCupId, generateQRCodeData, getMaterialDisplayName } from '@/lib/utils/cupId';
import { checkAdminApi } from '@/lib/supabase/admin';
import QRCode from 'qrcode';

// Tạo mã QR cho lô ly mới
export async function POST(request: NextRequest) {
  try {
    // Verify admin using env credentials
    if (!await checkAdminApi(request)) {
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
        await createCupWithFallback(cupId, material, storeId);

        // Tạo QR code data với format: "CUP|{cupId}|{material}|CupSipSmart"
        const qrData = generateQRCodeData(cupId, material);

        cupIds.push(cupId);
        qrDataStrings.push(qrData);
        qrCodes.push({ cupId, qrData });
      } catch (cupError: any) {        // Continue với các cup khác, nhưng log lỗi
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
  } catch (error: unknown) {
    const err = error as Error; return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get cups list (filtered by storeId, status, pagination)
export async function GET(request: NextRequest) {
  try {
    // Verify admin
    if (!await checkAdminApi(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = (await import('@/lib/supabase/server')).getSupabaseAdmin();

    let query = supabase
      .from('cups')
      .select('*', { count: 'exact' });

    // Filter by Store ID
    if (storeId) {
      // Check if storeId is UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
      if (isUuid) {
        query = query.eq('store_id', storeId);
      } else {
        // Fallback or ignore if name provided but no UUID logic readily available without extra lookup
      }
    }

    // Filter by Status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by Search (Cup ID)
    if (search) {
      query = query.ilike('cup_id', `%${search}%`);
    }

    const { data: cups, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      cups: cups || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

