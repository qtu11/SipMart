import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
  Transaction as FirestoreTransaction,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS, getCupRef } from './collections';
import type { Cup, CupStatus } from '../types';

// Tạo cup mới (Admin)
export async function createCup(
  cupId: string,
  material: 'pp_plastic' | 'bamboo_fiber'
): Promise<Cup> {
  const cupData: Cup = {
    cupId, // 8-digit ID
    material,
    status: 'available',
    createdAt: new Date(),
    totalUses: 0,
  };

  await setDoc(doc(db, COLLECTIONS.CUPS, cupId), {
    ...cupData,
    createdAt: serverTimestamp(),
  });

  return cupData;
}

// Tìm cup theo ID (hỗ trợ cả 8-digit ID và UUID cũ)
export async function findCupById(cupId: string): Promise<Cup | null> {
  // Thử tìm trực tiếp với cupId
  let cup = await getCup(cupId);
  if (cup) return cup;

  // Nếu không tìm thấy, có thể là format cũ (UUID)
  // Hoặc có thể cần search theo field cupId trong document
  // Hiện tại Firestore dùng document ID = cupId, nên không cần search thêm
  return null;
}

// Lấy thông tin cup
export async function getCup(cupId: string): Promise<Cup | null> {
  const cupDoc = await getDoc(doc(db, COLLECTIONS.CUPS, cupId));
  if (!cupDoc.exists()) return null;

  const data = cupDoc.data();
  return {
    cupId: cupDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastCleanedAt: data.lastCleanedAt?.toDate(),
  } as Cup;
}

// Cập nhật trạng thái cup
export async function updateCupStatus(
  cupId: string,
  status: CupStatus,
  userId?: string,
  transactionId?: string,
  transaction: FirestoreTransaction | null = null
): Promise<void> {
  const cupRef = doc(db, COLLECTIONS.CUPS, cupId);
  const updateData: any = {
    status,
    lastActivity: serverTimestamp(),
  };

  if (status === 'in_use' && userId) {
    updateData.currentUserId = userId;
    updateData.currentTransactionId = transactionId;
  } else if (status === 'available') {
    updateData.currentUserId = null;
    updateData.currentTransactionId = null;
    updateData.lastCleanedAt = serverTimestamp();
  }

  if (status === 'available') {
    updateData.totalUses = increment(1);
  }

  if (transaction) {
    transaction.update(cupRef, updateData);
  } else {
    await updateDoc(cupRef, updateData);
  }
}

// Lấy danh sách cups theo status
export async function getCupsByStatus(status: CupStatus): Promise<Cup[]> {
  const q = query(collection(db, COLLECTIONS.CUPS), where('status', '==', status));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc: any) => ({
    cupId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    lastCleanedAt: doc.data().lastCleanedAt?.toDate(),
  })) as Cup[];
}

// Lấy cups đang được user mượn
export async function getUserCups(userId: string): Promise<Cup[]> {
  const q = query(
    collection(db, COLLECTIONS.CUPS),
    where('currentUserId', '==', userId),
    where('status', '==', 'in_use')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc: any) => ({
    cupId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Cup[];
}

