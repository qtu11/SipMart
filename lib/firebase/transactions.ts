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
  Timestamp,
  Transaction as FirestoreTransaction,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS, getTransactionRef } from './collections';
import type { Transaction, TransactionStatus } from '../types';

// Tạo transaction mới (Mượn ly)
export async function createTransaction(
  userId: string,
  cupId: string,
  borrowStoreId: string,
  depositAmount: number,
  dueTime: Date,
  transaction: FirestoreTransaction | null = null
): Promise<string> {
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const transactionData: Omit<Transaction, 'transactionId'> = {
    userId,
    cupId,
    borrowStoreId,
    borrowTime: new Date(),
    dueTime,
    status: 'ongoing',
    depositAmount,
    isOverdue: false,
  };

  const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);

  if (transaction) {
    transaction.set(transactionRef, {
      ...transactionData,
      borrowTime: serverTimestamp(),
      dueTime: Timestamp.fromDate(dueTime),
    });
  } else {
    await setDoc(transactionRef, {
      ...transactionData,
      borrowTime: serverTimestamp(),
      dueTime: Timestamp.fromDate(dueTime),
    });
  }

  return transactionId;
}

// Lấy transaction
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const transactionDoc = await getDoc(doc(db, COLLECTIONS.TRANSACTIONS, transactionId));
  if (!transactionDoc.exists()) return null;

  const data = transactionDoc.data();
  return {
    transactionId: transactionDoc.id,
    ...data,
    borrowTime: data.borrowTime?.toDate() || new Date(),
    dueTime: data.dueTime?.toDate() || new Date(),
    returnTime: data.returnTime?.toDate(),
  } as Transaction;
}

// Cập nhật transaction (Trả ly)
export async function completeTransaction(
  transactionId: string,
  returnStoreId: string,
  refundAmount: number,
  greenPointsEarned: number
): Promise<void> {
  const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
  const transaction = await getTransaction(transactionId);
  
  if (!transaction) throw new Error('Transaction not found');

  const returnTime = new Date();
  const isOverdue = returnTime > transaction.dueTime;
  const overdueHours = isOverdue 
    ? Math.floor((returnTime.getTime() - transaction.dueTime.getTime()) / (1000 * 60 * 60))
    : 0;

  await updateDoc(transactionRef, {
    returnStoreId,
    returnTime: serverTimestamp(),
    status: 'completed' as TransactionStatus,
    refundAmount,
    greenPointsEarned,
    isOverdue,
    overdueHours: isOverdue ? overdueHours : 0,
  });
}

// Lấy transactions đang ongoing của user
export async function getOngoingTransactions(userId: string): Promise<Transaction[]> {
  const q = query(
    collection(db, COLLECTIONS.TRANSACTIONS),
    where('userId', '==', userId),
    where('status', '==', 'ongoing')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      transactionId: doc.id,
      ...data,
      borrowTime: data.borrowTime?.toDate() || new Date(),
      dueTime: data.dueTime?.toDate() || new Date(),
      returnTime: data.returnTime?.toDate(),
    };
  }) as Transaction[];
}

// Lấy tất cả transactions ongoing (cho cron job nhắc nhở)
export async function getAllOngoingTransactions(): Promise<Transaction[]> {
  const q = query(
    collection(db, COLLECTIONS.TRANSACTIONS),
    where('status', '==', 'ongoing')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      transactionId: doc.id,
      ...data,
      borrowTime: data.borrowTime?.toDate() || new Date(),
      dueTime: data.dueTime?.toDate() || new Date(),
      returnTime: data.returnTime?.toDate(),
    };
  }) as Transaction[];
}

// Đánh dấu transaction là overdue
export async function markTransactionOverdue(transactionId: string): Promise<void> {
  const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
  const transaction = await getTransaction(transactionId);
  
  if (!transaction) return;

  const now = new Date();
  const overdueHours = Math.floor((now.getTime() - transaction.dueTime.getTime()) / (1000 * 60 * 60));

  await updateDoc(transactionRef, {
    status: 'overdue' as TransactionStatus,
    isOverdue: true,
    overdueHours,
  });
}

