import { getAdminDb } from './admin-config';
import { COLLECTIONS } from './collections';
import type { Cup, CupStatus } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

// Admin SDK functions for cups (bypasses security rules)

export async function createCupAdmin(
  cupId: string,
  material: 'pp_plastic' | 'bamboo_fiber'
): Promise<Cup> {
  const db = getAdminDb();
  const cupRef = db.collection(COLLECTIONS.CUPS).doc(cupId);
  
  const cupData: Omit<Cup, 'cupId'> = {
    material,
    status: 'available',
    createdAt: new Date(),
    totalUses: 0,
  };

  await cupRef.set({
    ...cupData,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    cupId,
    ...cupData,
  };
}

export async function getCupAdmin(cupId: string): Promise<Cup | null> {
  const db = getAdminDb();
  const cupDoc = await db.collection(COLLECTIONS.CUPS).doc(cupId).get();
  
  if (!cupDoc.exists) return null;

  const data = cupDoc.data();
  return {
    cupId: cupDoc.id,
    ...data,
    createdAt: data?.createdAt?.toDate() || new Date(),
    lastCleanedAt: data?.lastCleanedAt?.toDate(),
  } as Cup;
}

export async function updateCupStatusAdmin(
  cupId: string,
  status: CupStatus,
  userId?: string,
  transactionId?: string
): Promise<void> {
  const db = getAdminDb();
  const cupRef = db.collection(COLLECTIONS.CUPS).doc(cupId);
  
  const updateData: any = {
    status,
    lastActivity: FieldValue.serverTimestamp(),
  };

  if (status === 'in_use' && userId) {
    updateData.currentUserId = userId;
    updateData.currentTransactionId = transactionId;
  } else if (status === 'available') {
    updateData.currentUserId = null;
    updateData.currentTransactionId = null;
    updateData.lastCleanedAt = FieldValue.serverTimestamp();
    updateData.totalUses = FieldValue.increment(1);
  }

  await cupRef.update(updateData);
}

export async function getCupsByStatusAdmin(status: CupStatus): Promise<Cup[]> {
  const db = getAdminDb();
  const snapshot = await db.collection(COLLECTIONS.CUPS)
    .where('status', '==', status)
    .get();
  
  return snapshot.docs.map(doc => ({
    cupId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    lastCleanedAt: doc.data().lastCleanedAt?.toDate(),
  })) as Cup[];
}

export async function getUserCupsAdmin(userId: string): Promise<Cup[]> {
  const db = getAdminDb();
  const snapshot = await db.collection(COLLECTIONS.CUPS)
    .where('currentUserId', '==', userId)
    .where('status', '==', 'in_use')
    .get();
  
  return snapshot.docs.map(doc => ({
    cupId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Cup[];
}

