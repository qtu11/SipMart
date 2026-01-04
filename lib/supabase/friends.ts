import { getSupabaseAdmin } from './server';

// Friend request type
export interface FriendRequest {
    requestId: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}

// Friendship type
export interface Friendship {
    friendshipId: string;
    userId1: string;
    userId2: string;
    createdAt: Date;
}

const getAdmin = () => getSupabaseAdmin();

// Send friend request
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest> {
    if (fromUserId === toUserId) {
        throw new Error('Cannot send friend request to yourself');
    }

    // Check if request already exists
    const { data: existing } = await getAdmin()
        .from('friend_requests')
        .select('*')
        .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
        .single();

    if (existing) {
        throw new Error('Friend request already exists');
    }

    const { data, error } = await getAdmin()
        .from('friend_requests')
        .insert({
            from_user_id: fromUserId,
            to_user_id: toUserId,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;
    return mapRequestFromDb(data);
}

// Accept friend request
export async function acceptFriendRequest(requestId: string): Promise<Friendship> {
    // Get the request
    const { data: request } = await getAdmin()
        .from('friend_requests')
        .select('*')
        .eq('request_id', requestId)
        .single();

    if (!request) throw new Error('Request not found');

    // Update request status
    await getAdmin()
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('request_id', requestId);

    // Create friendship
    const { data, error } = await getAdmin()
        .from('friendships')
        .insert({
            user_id1: request.from_user_id,
            user_id2: request.to_user_id,
        })
        .select()
        .single();

    if (error) throw error;
    return mapFriendshipFromDb(data);
}

// Reject friend request
export async function rejectFriendRequest(requestId: string): Promise<void> {
    await getAdmin()
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('request_id', requestId);
}

// Get friend requests
export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
    const { data, error } = await getAdmin()
        .from('friend_requests')
        .select('*')
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapRequestFromDb);
}

// Get friends list
export async function getFriends(userId: string): Promise<string[]> {
    const { data, error } = await getAdmin()
        .from('friendships')
        .select('user_id1, user_id2')
        .or(`user_id1.eq.${userId},user_id2.eq.${userId}`);

    if (error) throw error;
    if (!data) return [];

    // Extract friend IDs
    return data.map(row =>
        row.user_id1 === userId ? row.user_id2 : row.user_id1
    );
}

// Check if users are friends
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
    const { data } = await getAdmin()
        .from('friendships')
        .select('friendship_id')
        .or(
            `and(user_id1.eq.${userId1},user_id2.eq.${userId2}),and(user_id1.eq.${userId2},user_id2.eq.${userId1})`
        )
        .single();

    return !!data;
}

// Remove friend
export async function removeFriend(userId1: string, userId2: string): Promise<void> {
    await getAdmin()
        .from('friendships')
        .delete()
        .or(
            `and(user_id1.eq.${userId1},user_id2.eq.${userId2}),and(user_id1.eq.${userId2},user_id2.eq.${userId1})`
        );
}

// Find user by student ID (for friend search)
export async function findUserByStudentId(studentId: string): Promise<any | null> {
    const { data, error } = await getAdmin()
        .from('users')
        .select('user_id, student_id, display_name, avatar, green_points, rank_level')
        .eq('student_id', studentId)
        .single();

    if (error || !data) return null;
    return data;
}

// Helper functions
function mapRequestFromDb(row: any): FriendRequest {
    return {
        requestId: row.request_id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id,
        status: row.status as FriendRequest['status'],
        createdAt: new Date(row.created_at),
    };
}

function mapFriendshipFromDb(row: any): Friendship {
    return {
        friendshipId: row.friendship_id,
        userId1: row.user_id1,
        userId2: row.user_id2,
        createdAt: new Date(row.created_at),
    };
}
