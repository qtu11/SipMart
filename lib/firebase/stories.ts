import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';
import { getUser } from './users';

export interface Story {
  storyId: string;
  userId: string;
  displayName?: string;
  avatar?: string;
  type: 'image' | 'video' | 'achievement' | 'milestone';
  content: string; // URL cho image/video, text cho achievement
  thumbnail?: string; // Cho video
  achievementType?: 'cup_saved' | 'points' | 'rank_up' | 'challenge';
  achievementData?: any;
  createdAt: Date;
  expiresAt: Date;
  views: string[]; // User IDs đã xem
  likes: string[]; // User IDs đã like
}

const STORY_DURATION_HOURS = 24; // Story tồn tại 24 giờ

// Tạo story mới
export async function createStory(
  userId: string,
  type: Story['type'],
  content: string,
  thumbnail?: string,
  achievementType?: Story['achievementType'],
  achievementData?: any
): Promise<string> {
  try {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const storyId = `story_${userId}_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + STORY_DURATION_HOURS * 60 * 60 * 1000);

    const storyRef = doc(db, COLLECTIONS.STORIES, storyId);

    await setDoc(storyRef, {
      userId,
      displayName: user.displayName,
      avatar: user.avatar,
      type,
      content,
      thumbnail,
      achievementType,
      achievementData,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      views: [],
      likes: [],
    });

    return storyId;
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
}

// Lấy stories của bạn bè và user hiện tại
export async function getStories(userId: string, friendIds: string[]): Promise<Story[]> {
  try {
    const allUserIds = [userId, ...friendIds];
    const now = Timestamp.now();

    const storiesRef = collection(db, COLLECTIONS.STORIES);
    const q = query(
      storiesRef,
      where('userId', 'in', allUserIds.slice(0, 10)), // Firestore chỉ hỗ trợ 10 items trong 'in'
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const stories: Story[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      stories.push({
        storyId: doc.id,
        userId: data.userId,
        displayName: data.displayName,
        avatar: data.avatar,
        type: data.type,
        content: data.content,
        thumbnail: data.thumbnail,
        achievementType: data.achievementType,
        achievementData: data.achievementData,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        views: data.views || [],
        likes: data.likes || [],
      });
    });

    // Lấy thêm nếu có nhiều friends
    if (allUserIds.length > 10) {
      const remainingIds = allUserIds.slice(10);
      for (const friendId of remainingIds) {
        const friendStories = query(
          storiesRef,
          where('userId', '==', friendId),
          where('expiresAt', '>', now),
          orderBy('expiresAt', 'desc'),
          limit(5)
        );

        const friendSnapshot = await getDocs(friendStories);
        friendSnapshot.docs.forEach(doc => {
          const data = doc.data();
          stories.push({
            storyId: doc.id,
            userId: data.userId,
            displayName: data.displayName,
            avatar: data.avatar,
            type: data.type,
            content: data.content,
            thumbnail: data.thumbnail,
            achievementType: data.achievementType,
            achievementData: data.achievementData,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || new Date(),
            views: data.views || [],
            likes: data.likes || [],
          });
        });
      }
    }

    // Sắp xếp lại theo thời gian
    return stories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting stories:', error);
    throw error;
  }
}

// Lấy stories của một user cụ thể
export async function getUserStories(userId: string): Promise<Story[]> {
  try {
    const now = Timestamp.now();
    const storiesRef = collection(db, COLLECTIONS.STORIES);
    const q = query(
      storiesRef,
      where('userId', '==', userId),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        storyId: doc.id,
        userId: data.userId,
        displayName: data.displayName,
        avatar: data.avatar,
        type: data.type,
        content: data.content,
        thumbnail: data.thumbnail,
        achievementType: data.achievementType,
        achievementData: data.achievementData,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        views: data.views || [],
        likes: data.likes || [],
      } as Story;
    });
  } catch (error) {
    console.error('Error getting user stories:', error);
    throw error;
  }
}

// Đánh dấu đã xem story
export async function viewStory(storyId: string, userId: string): Promise<void> {
  try {
    const storyRef = doc(db, COLLECTIONS.STORIES, storyId);
    const storyDoc = await getDoc(storyRef);

    if (!storyDoc.exists()) {
      throw new Error('Story not found');
    }

    const data = storyDoc.data();
    const views = data.views || [];

    if (!views.includes(userId)) {
      await setDoc(storyRef, {
        views: [...views, userId],
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error viewing story:', error);
    throw error;
  }
}

// Like/Unlike story
export async function toggleStoryLike(storyId: string, userId: string): Promise<boolean> {
  try {
    const storyRef = doc(db, COLLECTIONS.STORIES, storyId);
    const storyDoc = await getDoc(storyRef);

    if (!storyDoc.exists()) {
      throw new Error('Story not found');
    }

    const data = storyDoc.data();
    const likes = data.likes || [];
    const isLiked = likes.includes(userId);

    if (isLiked) {
      await setDoc(storyRef, {
        likes: likes.filter((id: string) => id !== userId),
      }, { merge: true });
      return false;
    } else {
      await setDoc(storyRef, {
        likes: [...likes, userId],
      }, { merge: true });
      return true;
    }
  } catch (error) {
    console.error('Error toggling story like:', error);
    throw error;
  }
}

// Xóa story
export async function deleteStory(storyId: string, userId: string): Promise<void> {
  try {
    const storyRef = doc(db, COLLECTIONS.STORIES, storyId);
    const storyDoc = await getDoc(storyRef);

    if (!storyDoc.exists()) {
      throw new Error('Story not found');
    }

    const data = storyDoc.data();
    if (data.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await deleteDoc(storyRef);
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
}

// Tạo achievement story tự động
export async function createAchievementStory(
  userId: string,
  achievementType: Story['achievementType'],
  achievementData: any
): Promise<string> {
  try {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    let content = '';
    let displayText = '';

    switch (achievementType) {
      case 'cup_saved':
        displayText = `🎉 Đã cứu ${achievementData.count} ly!`;
        content = `Tôi đã cứu được ${achievementData.count} ly nhựa! 🌱 Cùng nhau bảo vệ môi trường!`;
        break;
      case 'points':
        displayText = `⭐ Đạt ${achievementData.points} Green Points!`;
        content = `Tôi đã tích lũy được ${achievementData.points} Green Points! 🏆`;
        break;
      case 'rank_up':
        displayText = `🚀 Lên rank ${achievementData.rank}!`;
        content = `Tôi đã lên rank ${achievementData.rank}! Tiếp tục sống xanh! 🌿`;
        break;
      case 'challenge':
        displayText = `🏅 Hoàn thành thử thách!`;
        content = achievementData.description || 'Tôi đã hoàn thành thử thách sống xanh!';
        break;
    }

    return await createStory(userId, 'achievement', content, undefined, achievementType, {
      ...achievementData,
      displayText,
    });
  } catch (error) {
    console.error('Error creating achievement story:', error);
    throw error;
  }
}

