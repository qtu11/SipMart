import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Transaction as FirestoreTransaction,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS, getUserRef } from './collections';
import type { User, EcoAction } from '../types';

// Tạo user mới
export async function createUser(
  userId: string,
  email: string,
  displayName?: string,
  studentId?: string
): Promise<User> {
  const userData: Omit<User, 'userId'> = {
    email, // Lưu email vào Firestore để dùng cho email notifications
    displayName: displayName || email.split('@')[0],
    walletBalance: 0,
    greenPoints: 0,
    rankLevel: 'seed',
    ecoHistory: [],
    totalCupsSaved: 0,
    totalPlasticReduced: 0,
    createdAt: new Date(),
    lastActivity: new Date(),
    isBlacklisted: false,
    blacklistCount: 0,
  };

  if (studentId) {
    (userData as any).studentId = studentId;
  }

  // Initialize friends array
  (userData as any).friends = [];

  await setDoc(doc(db, COLLECTIONS.USERS, userId), {
    ...userData,
    createdAt: serverTimestamp(),
    lastActivity: serverTimestamp(),
  });

  return { userId, ...userData };
}

// Lấy thông tin user
export async function getUser(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  return {
    userId: userDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastActivity: data.lastActivity?.toDate() || new Date(),
    ecoHistory: (data.ecoHistory || []).map((action: any) => ({
      ...action,
      timestamp: action.timestamp?.toDate() || new Date(),
    })),
  } as User;
}

// Lấy tất cả users (cho admin)
export async function getAllUsers(limitCount?: number): Promise<User[]> {
  try {
    let q = query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'));
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastActivity: data.lastActivity?.toDate() || new Date(),
        ecoHistory: (data.ecoHistory || []).map((action: any) => ({
          ...action,
          timestamp: action.timestamp?.toDate() || new Date(),
        })),
      } as User;
    });
  } catch (error) {    throw error;
  }
}

// Cập nhật ví (trừ/hoàn cọc)
export async function updateWallet(
  userId: string,
  amount: number,
  transaction: FirestoreTransaction | null = null
): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  
  if (transaction) {
    transaction.update(userRef, {
      walletBalance: increment(amount),
      lastActivity: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, {
      walletBalance: increment(amount),
      lastActivity: serverTimestamp(),
    });
  }
}

// Cộng green points
export async function addGreenPoints(
  userId: string,
  points: number,
  reason: string,
  cupId?: string
): Promise<{ rankUp: boolean; oldRank: string; newRank: string }> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const user = await getUser(userId);
  
  if (!user) throw new Error('User not found');

  const oldRank = user.rankLevel;
  const newPoints = user.greenPoints + points;
  let newRank = user.rankLevel;

  // Logic nâng cấp rank
  if (newPoints >= 1000 && user.rankLevel === 'seed') newRank = 'sprout';
  else if (newPoints >= 5000 && user.rankLevel === 'sprout') newRank = 'sapling';
  else if (newPoints >= 15000 && user.rankLevel === 'sapling') newRank = 'tree';
  else if (newPoints >= 50000 && user.rankLevel === 'tree') newRank = 'forest';

  const ecoAction: EcoAction = {
    actionId: `${Date.now()}-${Math.random()}`,
    type: cupId ? 'return' : 'checkin',
    cupId,
    points,
    timestamp: new Date(),
    description: reason,
  };

  await updateDoc(userRef, {
    greenPoints: newPoints,
    rankLevel: newRank,
    ecoHistory: [...(user.ecoHistory || []), ecoAction],
    lastActivity: serverTimestamp(),
  });

  return {
    rankUp: oldRank !== newRank,
    oldRank,
    newRank,
  };
}

// Tăng số ly đã cứu
export async function incrementCupsSaved(userId: string): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    totalCupsSaved: increment(1),
    totalPlasticReduced: increment(15), // Mỗi ly = 15g nhựa
    lastActivity: serverTimestamp(),
  });
}

// Blacklist user
export async function blacklistUser(
  userId: string,
  reason: string
): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const user = await getUser(userId);
  
  if (!user) throw new Error('User not found');

  await updateDoc(userRef, {
    isBlacklisted: true,
    blacklistReason: reason,
    blacklistCount: (user.blacklistCount || 0) + 1,
    lastActivity: serverTimestamp(),
  });
}

// Unblacklist user
export async function unblacklistUser(userId: string): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    isBlacklisted: false,
    blacklistReason: null,
    lastActivity: serverTimestamp(),
  });
}
