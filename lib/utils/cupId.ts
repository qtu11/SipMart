import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

/**
 * Tạo ID ly 8 số ngẫu nhiên
 */
function generate8DigitId(): string {
  const min = 10000000; // 10000000
  const max = 99999999; // 99999999
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Kiểm tra ID đã tồn tại chưa
 * Check cả Firestore và Supabase
 */
async function isCupIdExists(cupId: string): Promise<boolean> {
  // Check Firestore first
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const cupDoc = await getDoc(doc(db, COLLECTIONS.CUPS, cupId));
    if (cupDoc.exists()) return true;
  } catch (error) {
    console.warn('Error checking cup ID in Firestore:', error);
  }

  // Check Supabase as fallback
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase/server');
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('cups')
        .select('cup_id')
        .eq('cup_id', cupId)
        .single();
      
      if (data && !error) return true;
    }
  } catch (error) {
    console.warn('Error checking cup ID in Supabase:', error);
  }

  return false;
}

/**
 * Tạo cup ID 8 số duy nhất
 * Retry tối đa 100 lần để tránh vòng lặp vô hạn
 */
export async function generateUniqueCupId(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const cupId = generate8DigitId();
    const exists = await isCupIdExists(cupId);

    if (!exists) {
      return cupId;
    }

    attempts++;
  }

  // Nếu không tìm được ID duy nhất sau 100 lần, throw error
  throw new Error('Không thể tạo cup ID duy nhất. Vui lòng thử lại.');
}

/**
 * Parse QR code data
 * Format: "CUP|{cupId}|{material}|CupSipSmart"
 * Hoặc format cũ: URL với cup_id param
 */
export function parseQRCodeData(qrData: string): { cupId: string; material?: string } | null {
  try {
    // Format mới: "CUP|12345678|pp_plastic|CupSipSmart"
    if (qrData.startsWith('CUP|')) {
      const parts = qrData.split('|');
      if (parts.length >= 4 && parts[3] === 'CupSipSmart') {
        const cupId = parts[1];
        const material = parts[2];
        // Validate cupId là 8 số
        if (/^\d{8}$/.test(cupId)) {
          return { cupId, material: material as 'pp_plastic' | 'bamboo_fiber' };
        }
      }
    }

    // Format cũ: URL với cup_id param (backward compatibility)
    if (qrData.includes('cup_id=')) {
      const url = new URL(qrData);
      const cupId = url.searchParams.get('cup_id');
      if (cupId) {
        return { cupId };
      }
    }

    // Format đơn giản: chỉ có cup ID (8 số) - backward compatibility
    if (/^\d{8}$/.test(qrData.trim())) {
      return { cupId: qrData.trim() };
    }

    return null;
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
}

/**
 * Tạo QR code data string
 * Format: "CUP|{cupId}|{material}|CupSipSmart"
 */
export function generateQRCodeData(cupId: string, material: 'pp_plastic' | 'bamboo_fiber'): string {
  return `CUP|${cupId}|${material}|CupSipSmart`;
}

/**
 * Get material display name
 */
export function getMaterialDisplayName(material: 'pp_plastic' | 'bamboo_fiber'): string {
  const names: Record<'pp_plastic' | 'bamboo_fiber', string> = {
    pp_plastic: 'Nhựa PP cao cấp',
    bamboo_fiber: 'Sợi tre',
  };
  return names[material] || material;
}

