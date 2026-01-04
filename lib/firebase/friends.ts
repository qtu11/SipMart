import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';
import { getUser } from './users';

export interface FriendRequest {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface Friendship {
  friendshipId: string;
  userId1: string;
  userId2: string;
  createdAt: Date;
}

// Tìm user theo studentId
export async function findUserByStudentId(studentId: string): Promise<{ userId: string; displayName?: string; avatar?: string; email: string } | null> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const userDoc = snapshot.docs[0];
    const data = userDoc.data();

    return {
      userId: userDoc.id,
      displayName: data.displayName,
      avatar: data.avatar,
      email: data.email,
    };
  } catch (error) {    throw error;
  }
}

// Gửi lời mời kết bạn
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<string> {
  try {
    // Kiểm tra đã là bạn chưa
    const existingFriendship = await checkFriendship(fromUserId, toUserId);
    if (existingFriendship) {
      throw new Error('Đã là bạn bè');
    }

    // Kiểm tra đã gửi request chưa
    const existingRequest = await checkFriendRequest(fromUserId, toUserId);
    if (existingRequest) {
      throw new Error('Đã gửi lời mời kết bạn');
    }

    // Tạo friend request
    const requestId = `${fromUserId}_${toUserId}_${Date.now()}`;
    const requestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);

    await setDoc(requestRef, {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return requestId;
  } catch (error: unknown) {
    const err = error as Error;    throw error;
  }
}

// Chấp nhận lời mời kết bạn
export async function acceptFriendRequest(requestId: string, currentUserId: string): Promise<void> {
  try {
    const requestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }

    const requestData = requestDoc.data();
    if (requestData.toUserId !== currentUserId) {
      throw new Error('Unauthorized');
    }

    if (requestData.status !== 'pending') {
      throw new Error('Request already processed');
    }

    // Cập nhật status
    await updateDoc(requestRef, {
      status: 'accepted',
    });

    // Tạo friendship
    const friendshipId = `${requestData.fromUserId}_${requestData.toUserId}`;
    const friendshipRef = doc(db, COLLECTIONS.FRIENDSHIPS, friendshipId);

    await setDoc(friendshipRef, {
      userId1: requestData.fromUserId,
      userId2: requestData.toUserId,
      createdAt: serverTimestamp(),
    });

    // Thêm vào friends list của cả 2 user
    const user1Ref = doc(db, COLLECTIONS.USERS, requestData.fromUserId);
    const user2Ref = doc(db, COLLECTIONS.USERS, requestData.toUserId);

    await updateDoc(user1Ref, {
      friends: arrayUnion(requestData.toUserId),
    });

    await updateDoc(user2Ref, {
      friends: arrayUnion(requestData.fromUserId),
    });
  } catch (error: unknown) {
    const err = error as Error;    throw error;
  }
}

// Từ chối lời mời kết bạn
export async function rejectFriendRequest(requestId: string, currentUserId: string): Promise<void> {
  try {
    const requestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }

    const requestData = requestDoc.data();
    if (requestData.toUserId !== currentUserId) {
      throw new Error('Unauthorized');
    }

    await updateDoc(requestRef, {
      status: 'rejected',
    });
  } catch (error: unknown) {
    const err = error as Error;    throw error;
  }
}

// Lấy danh sách friend requests
export async function getFriendRequests(userId: string, type: 'sent' | 'received' = 'received'): Promise<FriendRequest[]> {
  try {
    const requestsRef = collection(db, COLLECTIONS.FRIEND_REQUESTS);
    const field = type === 'sent' ? 'fromUserId' : 'toUserId';
    const q = query(requestsRef, where(field, '==', userId), where('status', '==', 'pending'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        requestId: doc.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as FriendRequest;
    });
  } catch (error) {    throw error;
  }
}

// Lấy danh sách bạn bè
export async function getFriends(userId: string): Promise<Array<{ userId: string; displayName?: string; avatar?: string }>> {
  try {
    const user = await getUser(userId);
    if (!user || !(user as any).friends || (user as any).friends.length === 0) {
      return [];
    }

    const friendIds = (user as any).friends;
    const friendsData = await Promise.all(
      friendIds.map(async (friendId: string) => {
        const friend = await getUser(friendId);
        if (!friend) return null;
        return {
          userId: friend.userId,
          displayName: friend.displayName,
          avatar: friend.avatar,
        };
      })
    );

    return friendsData.filter(f => f !== null) as Array<{ userId: string; displayName?: string; avatar?: string }>;
  } catch (error) {    throw error;
  }
}

// Kiểm tra đã là bạn chưa
export async function checkFriendship(userId1: string, userId2: string): Promise<boolean> {
  try {
    const user1 = await getUser(userId1);
    if (!user1) return false;

    const friends = (user1 as any).friends || [];
    return friends.includes(userId2);
  } catch (error) {    return false;
  }
}

// Kiểm tra đã gửi request chưa
async function checkFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  try {
    const requestsRef = collection(db, COLLECTIONS.FRIEND_REQUESTS);
    const q = query(
      requestsRef,
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {    return false;
  }
}

// Hủy kết bạn
export async function removeFriend(userId1: string, userId2: string): Promise<void> {
  try {
    const user1Ref = doc(db, COLLECTIONS.USERS, userId1);
    const user2Ref = doc(db, COLLECTIONS.USERS, userId2);

    await updateDoc(user1Ref, {
      friends: arrayRemove(userId2),
    });

    await updateDoc(user2Ref, {
      friends: arrayRemove(userId1),
    });

    // Xóa friendship document
    const friendshipId = userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
    const friendshipRef = doc(db, COLLECTIONS.FRIENDSHIPS, friendshipId);
    await updateDoc(friendshipRef, {
      deleted: true,
    });
  } catch (error) {    throw error;
  }
}

