// Firebase Challenges & Events Management
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
import { Challenge, UserChallenge, ChallengeType, ChallengeRequirement } from '@/lib/types';

const COLLECTIONS = {
  CHALLENGES: 'challenges',
  USER_CHALLENGES: 'userChallenges',
};

// ============= CHALLENGES CRUD =============

export async function createChallenge(data: Omit<Challenge, 'challengeId' | 'createdAt'>) {
  try {
    const challengeRef = doc(collection(db, COLLECTIONS.CHALLENGES));
    const challengeId = challengeRef.id;

    const challenge: Challenge = {
      ...data,
      challengeId,
      createdAt: new Date(),
    };

    await setDoc(challengeRef, {
      ...challenge,
      requirement: JSON.stringify(challenge.requirement),
      createdAt: serverTimestamp(),
    });

    return { success: true, challengeId };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { success: false, error };
  }
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  try {
    const now = new Date();
    const q = query(
      collection(db, COLLECTIONS.CHALLENGES),
      where('isActive', '==', true),
      where('endDate', '>', now),
      orderBy('endDate', 'asc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        requirement: typeof data.requirement === 'string' 
          ? JSON.parse(data.requirement) 
          : data.requirement,
      } as Challenge;
    });
  } catch (error) {
    console.error('Error getting active challenges:', error);
    return [];
  }
}

export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  try {
    const docRef = doc(db, COLLECTIONS.CHALLENGES, challengeId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      ...data,
      requirement: typeof data.requirement === 'string'
        ? JSON.parse(data.requirement)
        : data.requirement,
    } as Challenge;
  } catch (error) {
    console.error('Error getting challenge:', error);
    return null;
  }
}

// ============= USER CHALLENGES =============

export async function joinChallenge(userId: string, challengeId: string) {
  try {
    // Kiểm tra đã join chưa
    const existing = await getUserChallengeStatus(userId, challengeId);
    if (existing) {
      return { success: false, error: 'Already joined this challenge' };
    }

    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    if (!challenge.isActive) {
      return { success: false, error: 'Challenge is not active' };
    }

    const now = new Date();
    if (now > challenge.endDate) {
      return { success: false, error: 'Challenge has ended' };
    }

    // Tạo user challenge
    const userChallengeRef = doc(collection(db, COLLECTIONS.USER_CHALLENGES));
    const userChallenge: UserChallenge = {
      id: userChallengeRef.id,
      userId,
      challengeId,
      progress: 0,
      completed: false,
      joinedAt: new Date(),
    };

    await setDoc(userChallengeRef, {
      ...userChallenge,
      joinedAt: serverTimestamp(),
    });

    return { success: true, userChallenge };
  } catch (error) {
    console.error('Error joining challenge:', error);
    return { success: false, error };
  }
}

export async function getUserChallenges(userId: string): Promise<UserChallenge[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_CHALLENGES),
      where('userId', '==', userId),
      orderBy('joinedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    // Populate challenge data
    const userChallenges = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as UserChallenge;
        const challenge = await getChallengeById(data.challengeId);
        return {
          ...data,
          challenge: challenge || undefined,
        };
      })
    );

    return userChallenges;
  } catch (error) {
    console.error('Error getting user challenges:', error);
    return [];
  }
}

async function getUserChallengeStatus(
  userId: string,
  challengeId: string
): Promise<UserChallenge | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_CHALLENGES),
      where('userId', '==', userId),
      where('challengeId', '==', challengeId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserChallenge;
  } catch (error) {
    console.error('Error getting user challenge status:', error);
    return null;
  }
}

export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  progress: number
) {
  try {
    const userChallenge = await getUserChallengeStatus(userId, challengeId);
    if (!userChallenge) {
      // Auto join if not joined
      await joinChallenge(userId, challengeId);
    }

    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    const requirement = challenge.requirement;
    const completed = progress >= (requirement.count || 1);

    // Update progress
    const q = query(
      collection(db, COLLECTIONS.USER_CHALLENGES),
      where('userId', '==', userId),
      where('challengeId', '==', challengeId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      const updateData: any = { progress };

      if (completed && !userChallenge?.completed) {
        updateData.completed = true;
        updateData.completedAt = serverTimestamp();

        // Thưởng points
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentPoints = userDoc.data().greenPoints || 0;
          await updateDoc(userRef, {
            greenPoints: currentPoints + challenge.rewardPoints,
          });
        }

        // Unlock badge nếu có
        if (challenge.rewardBadge) {
          const { unlockAchievement } = await import('./achievements');
          await unlockAchievement(userId, challenge.rewardBadge);
        }
      }

      await updateDoc(docRef, updateData);

      return {
        success: true,
        completed,
        rewardPoints: completed ? challenge.rewardPoints : 0,
      };
    }

    return { success: false, error: 'User challenge not found' };
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return { success: false, error };
  }
}

// ============= AUTO CHECK CHALLENGES =============

export async function checkAndUpdateChallenges(
  userId: string,
  action: string,
  metadata?: any
) {
  try {
    const userChallenges = await getUserChallenges(userId);
    const activeChallenges = userChallenges.filter(uc => !uc.completed);

    for (const userChallenge of activeChallenges) {
      if (!userChallenge.challenge) continue;

      const requirement = userChallenge.challenge.requirement;
      let newProgress = userChallenge.progress;

      // Check conditions based on requirement type
      switch (requirement.type) {
        case 'return_fast':
          if (action === 'return' && metadata?.returnTimeHours) {
            const timeLimit = requirement.timeLimit || 2;
            if (metadata.returnTimeHours <= timeLimit) {
              newProgress += 1;
            }
          }
          break;

        case 'cups_count':
          if (action === 'return') {
            newProgress += 1;
          }
          break;

        case 'green_feed':
          if (action === 'post_feed') {
            newProgress += 1;
          }
          break;

        case 'social':
          if (action === 'add_friend') {
            newProgress += 1;
          }
          break;
      }

      if (newProgress > userChallenge.progress) {
        await updateChallengeProgress(
          userId,
          userChallenge.challengeId,
          newProgress
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error checking challenges:', error);
    return { success: false, error };
  }
}

// ============= INITIALIZE DEFAULT CHALLENGES =============

export async function initializeDefaultChallenges() {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const defaultChallenges: Omit<Challenge, 'challengeId' | 'createdAt'>[] = [
    {
      name: 'Return Fast Week',
      description: 'Trả ly < 2h trong tuần này',
      type: 'weekly',
      requirement: {
        type: 'return_fast',
        count: 7,
        timeLimit: 2,
      },
      rewardPoints: 500,
      startDate: now,
      endDate: nextWeek,
      isActive: true,
    },
    {
      name: 'Eco Week',
      description: 'Mượn 10 ly trong tuần',
      type: 'weekly',
      requirement: {
        type: 'cups_count',
        count: 10,
      },
      rewardPoints: 300,
      startDate: now,
      endDate: nextWeek,
      isActive: true,
    },
    {
      name: 'Share Your Cup',
      description: 'Đăng 5 bài Green Feed',
      type: 'weekly',
      requirement: {
        type: 'green_feed',
        count: 5,
      },
      rewardPoints: 200,
      startDate: now,
      endDate: nextWeek,
      isActive: true,
    },
  ];

  const results = await Promise.all(
    defaultChallenges.map(challenge => createChallenge(challenge))
  );

  return {
    success: true,
    created: results.filter(r => r.success).length,
  };
}

