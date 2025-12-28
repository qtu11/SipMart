import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS, getStoreRef } from './collections';
import type { Store } from '../types';

// Tạo store mới
export async function createStore(
  storeId: string,
  name: string,
  gpsLocation: { lat: number; lng: number },
  address: string
): Promise<Store> {
  const storeData: Store = {
    storeId,
    name,
    gpsLocation,
    address,
    cupInventory: {
      available: 0,
      inUse: 0,
      cleaning: 0,
      total: 0,
    },
    partnerStatus: 'active',
    createdAt: new Date(),
  };

  await setDoc(doc(db, COLLECTIONS.STORES, storeId), {
    ...storeData,
    createdAt: serverTimestamp(),
  });

  return storeData;
}

// Lấy thông tin store
export async function getStore(storeId: string): Promise<Store | null> {
  const storeDoc = await getDoc(doc(db, COLLECTIONS.STORES, storeId));
  if (!storeDoc.exists()) return null;

  const data = storeDoc.data();
  return {
    storeId: storeDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as Store;
}

// Cập nhật inventory khi mượn ly
export async function updateInventoryOnBorrow(storeId: string): Promise<void> {
  const storeRef = doc(db, COLLECTIONS.STORES, storeId);
  await updateDoc(storeRef, {
    'cupInventory.available': increment(-1),
    'cupInventory.inUse': increment(1),
  });
}

// Cập nhật inventory khi trả ly
export async function updateInventoryOnReturn(storeId: string): Promise<void> {
  const storeRef = doc(db, COLLECTIONS.STORES, storeId);
  await updateDoc(storeRef, {
    'cupInventory.inUse': increment(-1),
    'cupInventory.cleaning': increment(1),
  });
}

// Cập nhật inventory khi vệ sinh xong
export async function updateInventoryOnCleaned(storeId: string): Promise<void> {
  const storeRef = doc(db, COLLECTIONS.STORES, storeId);
  await updateDoc(storeRef, {
    'cupInventory.cleaning': increment(-1),
    'cupInventory.available': increment(1),
  });
}

// Thêm cups vào store (Admin)
export async function addCupsToStore(storeId: string, count: number): Promise<void> {
  const storeRef = doc(db, COLLECTIONS.STORES, storeId);
  await updateDoc(storeRef, {
    'cupInventory.available': increment(count),
    'cupInventory.total': increment(count),
  });
}

// Lấy tất cả stores
export async function getAllStores(): Promise<Store[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.STORES));
  return snapshot.docs.map(doc => ({
    storeId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Store[];
}

