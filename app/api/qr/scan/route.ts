import { NextRequest, NextResponse } from 'next/server';
import { getCup } from '@/lib/supabase/cups';
import { getUserCups } from '@/lib/supabase/cups';
import { getOngoingTransactions } from '@/lib/supabase/transactions';

// API để quét QR và tự động nhận diện hành vi Mượn/Trả

type ScanAction = 'borrow' | 'return' | 'cleaning' | 'invalid';

interface ScanResponse {
  action: ScanAction;
  cupId: string;
  cupStatus: string;
  message: string;
}

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

    // Lấy thông tin cup từ Supabase
    const cup = await getCup(cupId);
    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 });
    }

    // Kiểm tra user có đang mượn cup này không
    const userCups = await getUserCups(userId);
    const isUserBorrowing = userCups.some(c => c.cupId === cupId);

    // Logic tự động nhận diện
    // Logic tự động nhận diện
    let action: ScanAction = 'invalid';
    let message = 'Không thể thực hiện hành động này';

    if (cup.status === 'available' && !isUserBorrowing) {
      action = 'borrow';
      message = 'Sẵn sàng mượn ly này';
    } else if (cup.status === 'in_use' && isUserBorrowing) {
      action = 'return';
      message = 'Sẵn sàng trả ly này';
    } else if (cup.status === 'cleaning') {
      action = 'cleaning';
      message = 'Ly đang được vệ sinh';
    }

    return NextResponse.json({
      action,
      cupId,
      cupStatus: cup.status,
      message,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

