import { getAdminDb } from './admin-config';
import { COLLECTIONS } from './collections';
import type { Store } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

// Admin SDK functions for stores (bypasses security rules)

export async function addCupsToStoreAdmin(storeId: string, count: number): Promise<void> {
  const db = getAdminDb();
  const storeRef = db.collection(COLLECTIONS.STORES).doc(storeId);
  
  await storeRef.update({
    'cupInventory.available': FieldValue.increment(count),
    'cupInventory.total': FieldValue.increment(count),
  });
}

export async function getAllStoresAdmin(): Promise<Store[]> {
  const db = getAdminDb();
  const snapshot = await db.collection(COLLECTIONS.STORES).get();
  
  return snapshot.docs.map(doc => ({
    storeId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Store[];
}

export async function getStoreAdmin(storeId: string): Promise<Store | null> {
  const db = getAdminDb();
  const storeDoc = await db.collection(COLLECTIONS.STORES).doc(storeId).get();
  
  if (!storeDoc.exists) return null;

  const data = storeDoc.data();
  return {
    storeId: storeDoc.id,
    ...data,
    createdAt: data?.createdAt?.toDate() || new Date(),
  } as Store;
}

export async function updateInventoryOnBorrowAdmin(storeId: string): Promise<void> {
  const db = getAdminDb();
  const storeRef = db.collection(COLLECTIONS.STORES).doc(storeId);
  
  await storeRef.update({
    'cupInventory.available': FieldValue.increment(-1),
    'cupInventory.inUse': FieldValue.increment(1),
  });
}

export async function updateInventoryOnReturnAdmin(storeId: string): Promise<void> {
  const db = getAdminDb();
  const storeRef = db.collection(COLLECTIONS.STORES).doc(storeId);
  
  await storeRef.update({
    'cupInventory.inUse': FieldValue.increment(-1),
    'cupInventory.cleaning': FieldValue.increment(1),
  });
}

export async function updateInventoryOnCleanedAdmin(storeId: string): Promise<void> {
  const db = getAdminDb();
  const storeRef = db.collection(COLLECTIONS.STORES).doc(storeId);
  
  await storeRef.update({
    'cupInventory.cleaning': FieldValue.increment(-1),
    'cupInventory.available': FieldValue.increment(1),
  });
}





