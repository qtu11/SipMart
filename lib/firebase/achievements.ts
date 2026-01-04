// Firebase Achievements & Badges Management
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
} from 'firebase/firestore';
import { Achievement, UserAchievement, AchievementRarity, AchievementCategory } from '@/lib/types';

const COLLECTIONS = {
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'userAchievements',
};

// ============= ACHIEVEMENTS CRUD =============

export async function createAchievement(data: Omit<Achievement, 'achievementId' | 'createdAt'>) {
  try {
    const achievementRef = doc(collection(db, COLLECTIONS.ACHIEVEMENTS));
    const achievementId = achievementRef.id;

    const achievement: Achievement = {
      ...data,
      achievementId,
      createdAt: new Date(),
    };

    await setDoc(achievementRef, {
      ...achievement,
      createdAt: serverTimestamp(),
    });

    return { success: true, achievementId };
  } catch (error) {    return { success: false, error };
  }
}

export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ACHIEVEMENTS),
      orderBy('rarity', 'desc'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Achievement);
  } catch (error) {    return [];
  }
}

export async function getAchievementsByCategory(category: AchievementCategory): Promise<Achievement[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ACHIEVEMENTS),
      where('category', '==', category),
      orderBy('requirement', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Achievement);
  } catch (error) {    return [];
  }
}

// ============= USER ACHIEVEMENTS =============

export async function unlockAchievement(userId: string, achievementId: string) {
  try {
    // Kiểm tra đã unlock chưa
    const existing = await getUserAchievement(userId, achievementId);
    if (existing) {
      return { success: false, error: 'Achievement already unlocked' };
    }

    // Lấy thông tin achievement
    const achievementDoc = await getDoc(doc(db, COLLECTIONS.ACHIEVEMENTS, achievementId));
    if (!achievementDoc.exists()) {
      return { success: false, error: 'Achievement not found' };
    }

    const achievement = achievementDoc.data() as Achievement;

    // Tạo user achievement
    const userAchievementRef = doc(collection(db, COLLECTIONS.USER_ACHIEVEMENTS));
    const userAchievement: UserAchievement = {
      id: userAchievementRef.id,
      userId,
      achievementId,
      unlockedAt: new Date(),
      progress: achievement.requirement,
    };

    await setDoc(userAchievementRef, {
      ...userAchievement,
      unlockedAt: serverTimestamp(),
    });

    // Cộng Green Points cho user
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentPoints = userDoc.data().greenPoints || 0;
      await updateDoc(userRef, {
        greenPoints: currentPoints + achievement.rewardPoints,
      });
    }

    return {
      success: true,
      userAchievement,
      rewardPoints: achievement.rewardPoints,
    };
  } catch (error) {    return { success: false, error };
  }
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_ACHIEVEMENTS),
      where('userId', '==', userId),
      orderBy('unlockedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    // Populate achievement data
    const userAchievements = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as UserAchievement;
        const achievementDoc = await getDoc(doc(db, COLLECTIONS.ACHIEVEMENTS, data.achievementId));
        return {
          ...data,
          achievement: achievementDoc.exists() ? (achievementDoc.data() as Achievement) : undefined,
        };
      })
    );

    return userAchievements;
  } catch (error) {    return [];
  }
}

async function getUserAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_ACHIEVEMENTS),
      where('userId', '==', userId),
      where('achievementId', '==', achievementId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserAchievement;
  } catch (error) {    return null;
  }
}

export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  progress: number
) {
  try {
    const existing = await getUserAchievement(userId, achievementId);
    
    if (!existing) {
      // Tạo mới với progress
      const userAchievementRef = doc(collection(db, COLLECTIONS.USER_ACHIEVEMENTS));
      const userAchievement: Partial<UserAchievement> = {
        id: userAchievementRef.id,
        userId,
        achievementId,
        progress,
      };
      await setDoc(userAchievementRef, userAchievement);
      return { success: true };
    }

    // Kiểm tra xem đã hoàn thành chưa
    const achievementDoc = await getDoc(doc(db, COLLECTIONS.ACHIEVEMENTS, achievementId));
    if (!achievementDoc.exists()) {
      return { success: false, error: 'Achievement not found' };
    }

    const achievement = achievementDoc.data() as Achievement;
    const newProgress = Math.min(progress, achievement.requirement);

    // Update progress
    const q = query(
      collection(db, COLLECTIONS.USER_ACHIEVEMENTS),
      where('userId', '==', userId),
      where('achievementId', '==', achievementId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { progress: newProgress });

      // Nếu đạt requirement và chưa unlock → unlock
      if (newProgress >= achievement.requirement && !existing.unlockedAt) {
        await updateDoc(docRef, {
          unlockedAt: serverTimestamp(),
        });
        return { success: true, unlocked: true };
      }
    }

    return { success: true };
  } catch (error) {    return { success: false, error };
  }
}

// ============= AUTO CHECK ACHIEVEMENTS =============

export async function checkAndUnlockAchievements(userId: string, action: string, metadata?: any) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const achievements = await getAllAchievements();
    const userAchievements = await getUserAchievements(userId);
    const unlockedIds = userAchievements.map(ua => ua.achievementId);

    const toUnlock: string[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.includes(achievement.achievementId)) continue;

      let shouldUnlock = false;

      // Check conditions based on badgeId
      switch (achievement.badgeId) {
        case 'first_cup':
          shouldUnlock = userData.totalCupsSaved >= 1;
          break;
        case 'speed_returner':
          // Kiểm tra từ metadata (transaction return time)
          if (metadata?.returnTimeHours && metadata.returnTimeHours <= 1) {
            shouldUnlock = true;
          }
          break;
        case 'streak_master':
          // Cần logic kiểm tra streak (7 ngày liên tiếp)
          // TODO: Implement streak tracking
          break;
        case 'eco_warrior':
          shouldUnlock = userData.totalCupsSaved >= 100;
          break;
        case 'zero_waste':
          // Kiểm tra không có lần nào quá hạn
          shouldUnlock = userData.blacklistCount === 0 && userData.totalCupsSaved >= 10;
          break;
        // ... Add more conditions
      }

      if (shouldUnlock) {
        toUnlock.push(achievement.achievementId);
      }
    }

    // Unlock tất cả achievements đủ điều kiện
    const results = await Promise.all(
      toUnlock.map(achievementId => unlockAchievement(userId, achievementId))
    );

    return {
      success: true,
      unlockedCount: results.filter(r => r.success).length,
    };
  } catch (error) {    return { success: false, error };
  }
}

// ============= INITIALIZE DEFAULT ACHIEVEMENTS =============

export async function initializeDefaultAchievements() {
  const defaultAchievements: Omit<Achievement, 'achievementId' | 'createdAt'>[] = [
    {
      badgeId: 'first_cup',
      name: 'First Cup',
      description: 'Mượn ly đầu tiên',
      icon: '🌟',
      rarity: 'common',
      requirement: 1,
      rewardPoints: 50,
      category: 'cups',
    },
    {
      badgeId: 'speed_returner',
      name: 'Speed Returner',
      description: 'Trả ly trong 1 giờ',
      icon: '⚡',
      rarity: 'rare',
      requirement: 1,
      rewardPoints: 100,
      category: 'cups',
    },
    {
      badgeId: 'streak_master',
      name: 'Streak Master',
      description: 'Mượn ly 7 ngày liên tiếp',
      icon: '🔥',
      rarity: 'epic',
      requirement: 7,
      rewardPoints: 500,
      category: 'streak',
    },
    {
      badgeId: 'eco_warrior',
      name: 'Eco Warrior',
      description: 'Cứu 100 ly nhựa',
      icon: '🌍',
      rarity: 'epic',
      requirement: 100,
      rewardPoints: 1000,
      category: 'eco',
    },
    {
      badgeId: 'zero_waste',
      name: 'Zero Waste',
      description: 'Không bao giờ quá hạn (10+ cups)',
      icon: '💚',
      rarity: 'legendary',
      requirement: 10,
      rewardPoints: 2000,
      category: 'eco',
    },
    {
      badgeId: 'campus_champion',
      name: 'Campus Champion',
      description: 'Top 10 trường',
      icon: '🎓',
      rarity: 'legendary',
      requirement: 1,
      rewardPoints: 5000,
      category: 'special',
    },
    {
      badgeId: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Có 10+ bạn bè',
      icon: '🤝',
      rarity: 'rare',
      requirement: 10,
      rewardPoints: 200,
      category: 'social',
    },
    {
      badgeId: 'content_creator',
      name: 'Content Creator',
      description: 'Đăng 50+ bài Green Feed',
      icon: '📸',
      rarity: 'epic',
      requirement: 50,
      rewardPoints: 800,
      category: 'social',
    },
  ];

  const results = await Promise.all(
    defaultAchievements.map(achievement => createAchievement(achievement))
  );

  return {
    success: true,
    created: results.filter(r => r.success).length,
  };
}

