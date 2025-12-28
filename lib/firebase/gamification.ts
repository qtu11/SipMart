import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS, getVirtualTreeRef } from './collections';
import type { VirtualTree } from '../types';

// Tạo cây xanh ảo cho user
export async function createVirtualTree(userId: string): Promise<VirtualTree> {
  const treeData: VirtualTree = {
    userId,
    level: 1,
    growth: 0,
    health: 'healthy',
    lastWatered: new Date(),
    totalWaterings: 0,
  };

  await setDoc(doc(db, COLLECTIONS.VIRTUAL_TREES, userId), {
    ...treeData,
    lastWatered: serverTimestamp(),
  });

  return treeData;
}

// Lấy thông tin cây
export async function getVirtualTree(userId: string): Promise<VirtualTree | null> {
  const treeDoc = await getDoc(doc(db, COLLECTIONS.VIRTUAL_TREES, userId));
  if (!treeDoc.exists()) {
    return await createVirtualTree(userId);
  }

  const data = treeDoc.data();
  return {
    userId: treeDoc.id,
    ...data,
    lastWatered: data.lastWatered?.toDate() || new Date(),
  } as VirtualTree;
}

// Tưới cây (khi trả ly đúng hạn)
export async function waterTree(userId: string, isOnTime: boolean): Promise<void> {
  const tree = await getVirtualTree(userId);
  if (!tree) return;

  const growthIncrease = isOnTime ? 10 : 5; // Trả đúng hạn = +10%, quá hạn = +5%
  let newGrowth = Math.min(100, tree.growth + growthIncrease);
  
  // Logic nâng cấp level
  let newLevel = tree.level;
  let newHealth: 'healthy' | 'wilting' | 'dead' = 'healthy';

  if (newGrowth >= 100 && tree.level < 10) {
    newLevel = tree.level + 1;
    newGrowth = 0; // Reset growth khi lên level
  }

  // Nếu quá hạn nhiều lần, cây héo
  if (!isOnTime && tree.health === 'healthy') {
    newHealth = 'wilting';
  } else if (isOnTime && tree.health === 'wilting') {
    newHealth = 'healthy';
  }

  await updateDoc(doc(db, COLLECTIONS.VIRTUAL_TREES, userId), {
    growth: newGrowth,
    level: newLevel,
    health: newHealth,
    lastWatered: serverTimestamp(),
    totalWaterings: tree.totalWaterings + 1,
  });
}

// Kiểm tra và cập nhật health (cron job)
export async function updateTreeHealth(userId: string): Promise<void> {
  const tree = await getVirtualTree(userId);
  if (!tree) return;

  const daysSinceWatered = Math.floor(
    (Date.now() - tree.lastWatered.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newHealth: 'healthy' | 'wilting' | 'dead' = tree.health;
  let newGrowth = tree.growth;

  if (daysSinceWatered > 7 && tree.health === 'healthy') {
    newHealth = 'wilting';
    newGrowth = Math.max(0, tree.growth - 5);
  } else if (daysSinceWatered > 14) {
    newHealth = 'dead';
    newGrowth = 0;
  }

  if (newHealth !== tree.health || newGrowth !== tree.growth) {
    await updateDoc(doc(db, COLLECTIONS.VIRTUAL_TREES, userId), {
      health: newHealth,
      growth: newGrowth,
    });
  }
}

