import { NextRequest, NextResponse } from 'next/server';
import { getCupWithFallback } from '@/lib/firebase/cups-with-fallback';
import { getUserCups } from '@/lib/firebase/cups';
import { getOngoingTransactions } from '@/lib/firebase/transactions';

// API để quét QR và tự động nhận diện hành vi Mượn/Trả
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cupId } = body;

    if (!userId || !cupId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Lấy thông tin cup (sử dụng fallback)
    const cup = await getCupWithFallback(cupId);
    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 });
    }

    // Kiểm tra user có đang mượn cup này không
    const userCups = await getUserCups(userId);
    const isUserBorrowing = userCups.some(c => c.cupId === cupId);

    // Logic tự động nhận diện
    if (cup.status === 'available' && !isUserBorrowing) {
      // Hành vi: Mượn ly
      return NextResponse.json({
        action: 'borrow',
        cupId,
        cupStatus: cup.status,
        message: 'Sẵn sàng mượn ly này',
      });
    } else if (cup.status === 'in_use' && isUserBorrowing) {
      // Hành vi: Trả ly
      return NextResponse.json({
        action: 'return',
        cupId,
        cupStatus: cup.status,
        message: 'Sẵn sàng trả ly này',
      });
    } else if (cup.status === 'cleaning') {
      return NextResponse.json({
        action: 'cleaning',
        cupId,
        cupStatus: cup.status,
        message: 'Ly đang được vệ sinh',
      });
    } else {
      return NextResponse.json({
        action: 'invalid',
        cupId,
        cupStatus: cup.status,
        message: 'Không thể thực hiện hành động này',
      });
    }
  } catch (error: any) {
    console.error('QR scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

