// QR Code Scanning API - FIXED with authentication, validation, and proper logging
import { NextRequest, NextResponse } from 'next/server';
import { getCup, getUserCups } from '@/lib/supabase/cups';
import { verifyAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

type ScanAction = 'borrow' | 'return' | 'cleaning' | 'invalid';

interface ScanResponse {
  action: ScanAction;
  cupId: string;
  material?: string;
  cupStatus: string;
  message: string;
  canProceed: boolean;
}

// QR code format: "CUP|{cupId}|{material}|CupSipSmart"
function parseQRCode(qrData: string): { valid: boolean; cupId?: string; material?: string; error?: string } {
  if (!qrData || typeof qrData !== 'string') {
    return { valid: false, error: 'QR data is empty or invalid' };
  }

  const trimmed = qrData.trim();

  // Format 1: "CUP|{cupId}|{material}|SipSmart"
  if (trimmed.startsWith('CUP|')) {
    const parts = trimmed.split('|');
    // Accept both old and new brand for compatibility
    if (parts.length >= 4 && (parts[3] === 'SipSmart' || parts[3] === 'CupSipSmart')) {
      const cupId = parts[1];
      const material = parts[2];
      // Validate cupId is 8 digits or UUID
      if (/^(\d{8}|[0-9a-fA-F-]{36})$/.test(cupId)) {
        return { valid: true, cupId, material };
      }
    }
    return { valid: false, error: 'Mã QR không đúng định dạng SipSmart' };
  }

  // Format 2: URL with cup_id param (backward compatibility)
  if (trimmed.includes('cup_id=')) {
    try {
      const url = new URL(trimmed);
      const cupId = url.searchParams.get('cup_id');
      if (cupId && /^(\d{8}|[0-9a-fA-F-]{36})$/.test(cupId)) {
        return { valid: true, cupId };
      }
    } catch {
      // Not a valid URL
    }
  }

  // Format 3: Just 8-digit cupId or UUID (backward compatibility)
  if (/^(\d{8}|[0-9a-fA-F-]{36})$/.test(trimmed)) {
    return { valid: true, cupId: trimmed };
  }

  return { valid: false, error: 'Mã QR không hợp lệ. Vui lòng quét mã QR của SipSmart.' };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để quét QR' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const body = await request.json();
    const { qrData, storeId } = body;

    // DEBUG: Log raw QR data
    console.log('🔍 QR Scan Debug - Raw data:', qrData);

    // 2. Parse QR code
    const parseResult = parseQRCode(qrData);
    console.log('🔍 QR Scan Debug - Parse result:', parseResult);
    if (!parseResult.valid || !parseResult.cupId) {
      return NextResponse.json({
        action: 'invalid' as ScanAction,
        message: parseResult.error || 'Mã QR không hợp lệ',
        canProceed: false,
      }, { status: 400 });
    }

    const { cupId, material } = parseResult;

    // 3. Get cup from database
    const cup = await getCup(cupId);
    if (!cup) {
      logger.warn('QR scan for non-existent cup', { cupId, userId });
      return NextResponse.json({
        action: 'invalid' as ScanAction,
        cupId,
        cupStatus: 'not_found',
        message: 'Ly không tồn tại trong hệ thống. Có thể mã QR đã cũ.',
        canProceed: false,
      }, { status: 404 });
    }

    // 4. Get user's currently borrowed cups
    const userCups = await getUserCups(userId);
    const isUserBorrowingThisCup = userCups.some(c => c.cupId === cupId);

    // 5. Determine action based on cup status and user context
    let action: ScanAction = 'invalid';
    let message = '';
    const materialName = material === 'pp_plastic' ? 'Nhựa PP' :
      material === 'bamboo_fiber' ? 'Sợi tre' : 'Không xác định';

    switch (cup.status) {
      case 'available':
        if (isUserBorrowingThisCup) {
          // Data inconsistency - cup is available but user thinks they have it
          action = 'invalid';
          message = 'Lỗi dữ liệu: Ly đã được trả về. Vui lòng liên hệ hỗ trợ.';
        } else {
          action = 'borrow';
          message = `Sẵn sàng mượn ly ${cupId} (${materialName})`;
        }
        break;

      case 'in_use':
        if (isUserBorrowingThisCup && cup.currentUserId === userId) {
          action = 'return';
          message = `Sẵn sàng trả ly ${cupId}`;
        } else if (cup.currentUserId === userId) {
          // Cup says this user has it, but not in userCups list - data issue
          action = 'return';
          message = `Sẵn sàng trả ly ${cupId}`;
        } else {
          action = 'invalid';
          message = 'Ly này đang được người khác mượn';
        }
        break;

      case 'cleaning':
        action = 'cleaning';
        message = 'Ly đang được vệ sinh, vui lòng chọn ly khác';
        break;

      case 'damaged':
        action = 'invalid';
        message = 'Ly này đã hỏng và không thể sử dụng';
        break;

      default:
        action = 'invalid';
        message = 'Trạng thái ly không xác định';
    }

    logger.info('QR scan processed', {
      userId,
      cupId,
      action,
      cupStatus: cup.status
    });

    const response: ScanResponse = {
      action,
      cupId,
      material: material || cup.qrCode?.split('|')[2],
      cupStatus: cup.status,
      message,
      canProceed: action === 'borrow' || action === 'return',
    };

    return NextResponse.json(response);

  } catch (error) {
    const err = error as Error;
    logger.error('QR scan error', { error: err.message });
    return NextResponse.json(
      { error: 'Lỗi xử lý QR. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
