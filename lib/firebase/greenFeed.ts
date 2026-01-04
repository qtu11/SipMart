import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  where,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { COLLECTIONS } from './collections';

export interface GreenFeedPost {
  postId: string;
  userId: string;
  displayName: string;
  avatar?: string;
  imageUrl: string;
  caption?: string;
  cupId?: string;
  greenPointsEarned: number;
  likes: number;
  likedBy: string[]; // Array of user IDs who liked
  comments: FeedComment[];
  createdAt: Date;
}

export interface FeedComment {
  commentId: string;
  userId: string;
  displayName: string;
  avatar?: string;
  content: string;
  createdAt: Date;
}

/**
 * Upload image to Firebase Storage
 */
export async function uploadFeedImage(file: File, userId: string): Promise<string> {
  try {
    // Tạo path: feed/{userId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const storageRef = ref(storage, `feed/${userId}/${filename}`);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {    throw error;
  }
}

/**
 * Tạo post mới trong Green Feed
 */
export async function createFeedPost(
  userId: string,
  displayName: string,
  imageUrl: string,
  caption?: string,
  cupId?: string,
  avatar?: string
): Promise<string> {
  try {
    const postRef = await addDoc(collection(db, COLLECTIONS.GREEN_FEED), {
      userId,
      displayName,
      avatar,
      imageUrl,
      caption: caption || '',
      cupId: cupId || null,
      greenPointsEarned: 10, // Points for posting
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: serverTimestamp(),
    });

    return postRef.id;
  } catch (error) {    throw error;
  }
}

/**
 * Lấy danh sách posts từ Firestore
 */
export async function getFeedPosts(limitCount: number = 20): Promise<GreenFeedPost[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.GREEN_FEED),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const posts: GreenFeedPost[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        postId: doc.id,
        userId: data.userId,
        displayName: data.displayName || 'Anonymous',
        avatar: data.avatar,
        imageUrl: data.imageUrl,
        caption: data.caption,
        cupId: data.cupId,
        greenPointsEarned: data.greenPointsEarned || 0,
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        comments: (data.comments || []).map((c: any) => ({
          ...c,
          createdAt: c.createdAt?.toDate() || new Date(),
        })),
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return posts;
  } catch (error) {    throw error;
  }
}

/**
 * Like/Unlike một post
 */
export async function toggleLikePost(postId: string, userId: string): Promise<boolean> {
  try {
    const postRef = doc(db, COLLECTIONS.GREEN_FEED, postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const postData = postDoc.data();
    const likedBy: string[] = postData.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: likedBy.filter((id) => id !== userId),
      });
      return false;
    } else {
      // Like
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: [...likedBy, userId],
      });
      return true;
    }
  } catch (error) {    throw error;
  }
}

/**
 * Thêm comment vào post
 */
export async function addCommentToPost(
  postId: string,
  userId: string,
  displayName: string,
  content: string,
  avatar?: string
): Promise<string> {
  try {
    const postRef = doc(db, COLLECTIONS.GREEN_FEED, postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const postData = postDoc.data();
    const comments: FeedComment[] = postData.comments || [];

    const newComment: FeedComment = {
      commentId: `${Date.now()}-${Math.random()}`,
      userId,
      displayName,
      avatar,
      content,
      createdAt: new Date(),
    };

    await updateDoc(postRef, {
      comments: [...comments, newComment],
    });

    return newComment.commentId;
  } catch (error) {    throw error;
  }
}

/**
 * Lấy posts của một user cụ thể
 */
export async function getUserFeedPosts(userId: string): Promise<GreenFeedPost[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.GREEN_FEED),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const posts: GreenFeedPost[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        postId: doc.id,
        userId: data.userId,
        displayName: data.displayName || 'Anonymous',
        avatar: data.avatar,
        imageUrl: data.imageUrl,
        caption: data.caption,
        cupId: data.cupId,
        greenPointsEarned: data.greenPointsEarned || 0,
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        comments: (data.comments || []).map((c: any) => ({
          ...c,
          createdAt: c.createdAt?.toDate() || new Date(),
        })),
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return posts;
  } catch (error) {    throw error;
  }
}

