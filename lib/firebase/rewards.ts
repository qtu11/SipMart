// Firebase Rewards Store Management
import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { Reward, RewardClaim, RewardCategory, RewardClaimStatus } from '@/lib/types';

const COLLECTIONS = {
  REWARDS: 'rewards',
  REWARD_CLAIMS: 'rewardClaims',
};

// ============= REWARDS CRUD =============

export async function createReward(data: Omit<Reward, 'rewardId' | 'createdAt'>) {
  try {
    const rewardRef = doc(collection(db, COLLECTIONS.REWARDS));
    const rewardId = rewardRef.id;

    const reward: Reward = {
      ...data,
      rewardId,
      createdAt: new Date(),
    };

    await setDoc(rewardRef, {
      ...reward,
      createdAt: serverTimestamp(),
    });

    return { success: true, rewardId };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getAllRewards(category?: RewardCategory): Promise<Reward[]> {
  try {
    let q;
    if (category) {
      q = query(
        collection(db, COLLECTIONS.REWARDS),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('pointsCost', 'asc')
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.REWARDS),
        where('isActive', '==', true),
        orderBy('category'),
        orderBy('pointsCost', 'asc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Reward);
  } catch (error) {
    return [];
  }
}

export async function getRewardById(rewardId: string): Promise<Reward | null> {
  try {
    const docRef = doc(db, COLLECTIONS.REWARDS, rewardId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Reward) : null;
  } catch (error) {
    return null;
  }
}

export async function updateRewardStock(rewardId: string, quantity: number) {
  try {
    const docRef = doc(db, COLLECTIONS.REWARDS, rewardId);
    await updateDoc(docRef, {
      stock: increment(quantity),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// ============= REWARD CLAIMS =============

export async function claimReward(userId: string, rewardId: string) {
  try {
    // Lấy thông tin reward
    const reward = await getRewardById(rewardId);
    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    if (!reward.isActive) {
      return { success: false, error: 'Reward is not active' };
    }

    if (reward.stock <= 0) {
      return { success: false, error: 'Out of stock' };
    }

    // Kiểm tra points của user
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const currentPoints = userData.greenPoints || 0;

    if (currentPoints < reward.pointsCost) {
      return {
        success: false,
        error: 'Insufficient points',
        required: reward.pointsCost,
        current: currentPoints,
      };
    }

    // Tạo reward claim
    const claimRef = doc(collection(db, COLLECTIONS.REWARD_CLAIMS));
    const claim: RewardClaim = {
      claimId: claimRef.id,
      userId,
      rewardId,
      pointsUsed: reward.pointsCost,
      status: 'pending',
      claimedAt: new Date(),
    };

    await setDoc(claimRef, {
      ...claim,
      claimedAt: serverTimestamp(),
    });

    // Trừ points của user
    await updateDoc(userRef, {
      greenPoints: currentPoints - reward.pointsCost,
    });

    // Giảm stock
    await updateRewardStock(rewardId, -1);

    return {
      success: true,
      claim,
      remainingPoints: currentPoints - reward.pointsCost,
    };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getUserRewardClaims(userId: string): Promise<RewardClaim[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.REWARD_CLAIMS),
      where('userId', '==', userId),
      orderBy('claimedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    // Populate reward data
    const claims = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as RewardClaim;
        const reward = await getRewardById(data.rewardId);
        return {
          ...data,
          reward: reward || undefined,
        };
      })
    );

    return claims;
  } catch (error) {
    return [];
  }
}

export async function updateClaimStatus(
  claimId: string,
  status: RewardClaimStatus,
  usedAt?: Date
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.REWARD_CLAIMS),
      where('claimId', '==', claimId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Claim not found' };
    }

    const docRef = snapshot.docs[0].ref;
    const updateData: any = { status };
    if (usedAt) {
      updateData.usedAt = usedAt;
    }

    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// ============= ADMIN: REWARD MANAGEMENT =============

export async function getAllRewardClaims(): Promise<RewardClaim[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.REWARD_CLAIMS),
      orderBy('claimedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const claims = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as RewardClaim;
        const reward = await getRewardById(data.rewardId);
        return {
          ...data,
          reward: reward || undefined,
        };
      })
    );

    return claims;
  } catch (error) {
    return [];
  }
}

// ============= INITIALIZE DEFAULT REWARDS =============

export async function initializeDefaultRewards() {
  const defaultRewards: Omit<Reward, 'rewardId' | 'createdAt'>[] = [
    // Vouchers
    {
      name: 'Voucher Cà Phê 50k',
      description: 'Voucher giảm giá 50.000đ tại các quán cà phê đối tác',
      image: '/rewards/coffee-voucher.png',
      pointsCost: 500,
      stock: 100,
      category: 'voucher',
      isActive: true,
    },
    {
      name: 'Voucher Trà Sữa 30k',
      description: 'Voucher giảm giá 30.000đ tại các quán trà sữa đối tác',
      image: '/rewards/milk-tea-voucher.png',
      pointsCost: 300,
      stock: 150,
      category: 'voucher',
      isActive: true,
    },
    {
      name: 'Miễn Phí Cọc 1 Lần',
      description: 'Mượn ly không cần đặt cọc (1 lần)',
      image: '/rewards/free-deposit.png',
      pointsCost: 200,
      stock: 500,
      category: 'privilege',
      isActive: true,
    },

    // Merchandise
    {
      name: 'Túi Vải SipSmart',
      description: 'Túi vải canvas cao cấp với logo SipSmart',
      image: '/rewards/tote-bag.png',
      pointsCost: 1500,
      stock: 50,
      category: 'merchandise',
      isActive: true,
    },
    {
      name: 'Sticker Pack',
      description: 'Bộ 10 stickers thiết kế độc quyền về bảo vệ môi trường',
      image: '/rewards/sticker-pack.png',
      pointsCost: 50,
      stock: 1000,
      category: 'merchandise',
      isActive: true,
    },

    // Privilege
    {
      name: 'Priority Pass',
      description: 'Ưu tiên mượn ly khi hết (30 ngày)',
      image: '/rewards/priority-pass.png',
      pointsCost: 800,
      stock: 100,
      category: 'privilege',
      isActive: true,
    },

    // Charity
    {
      name: 'Trồng Cây Thật',
      description: 'Trồng 1 cây thật có tên bạn tại khu vực trường',
      image: '/rewards/plant-tree.png',
      pointsCost: 5000,
      stock: 20,
      category: 'charity',
      isActive: true,
    },
  ];

  const results = await Promise.all(
    defaultRewards.map(reward => createReward(reward))
  );

  return {
    success: true,
    created: results.filter(r => r.success).length,
  };
}

