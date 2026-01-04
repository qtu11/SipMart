import { getSupabaseAdmin } from './server';

// GreenFeed types
export interface GreenFeedPost {
    postId: string;
    userId: string;
    displayName?: string;
    avatar?: string;
    imageUrl: string;
    caption?: string;
    cupId?: string;
    greenPointsEarned: number;
    likes: number;
    createdAt: Date;
}

export interface Comment {
    commentId: string;
    postId: string;
    userId: string;
    displayName?: string;
    content: string;
    createdAt: Date;
}

const getAdmin = () => getSupabaseAdmin();

// Create feed post
export async function createFeedPost(params: {
    userId: string;
    imageUrl: string;
    caption?: string;
    cupId?: string;
    greenPointsEarned?: number;
}): Promise<GreenFeedPost> {
    const { data: userData } = await getAdmin()
        .from('users')
        .select('display_name, avatar')
        .eq('user_id', params.userId)
        .single();

    const { data, error } = await getAdmin()
        .from('green_feed_posts')
        .insert({
            user_id: params.userId,
            display_name: userData?.display_name,
            avatar: userData?.avatar,
            image_url: params.imageUrl,
            caption: params.caption,
            cup_id: params.cupId,
            green_points_earned: params.greenPointsEarned || 0,
            likes: 0,
        })
        .select()
        .single();

    if (error) throw error;
    return mapPostFromDb(data);
}

// Get feed posts
export async function getFeedPosts(options?: {
    userId?: string;
    limit?: number;
    offset?: number;
}): Promise<GreenFeedPost[]> {
    let query = getAdmin()
        .from('green_feed_posts')
        .select(`
      *,
      comments:comments(count)
    `)
        .order('created_at', { ascending: false });

    if (options?.userId) {
        query = query.eq('user_id', options.userId);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapPostFromDb);
}

// Like/unlike post
export async function toggleLikePost(postId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    // Check if already liked
    const { data: existing } = await getAdmin()
        .from('post_likes')
        .select('like_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        // Unlike
        await getAdmin()
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        // Decrement likes count
        const { data: post } = await getAdmin()
            .from('green_feed_posts')
            .select('likes')
            .eq('post_id', postId)
            .single();

        await getAdmin()
            .from('green_feed_posts')
            .update({ likes: Math.max(0, (post?.likes || 1) - 1) })
            .eq('post_id', postId);

        return { liked: false, likes: Math.max(0, (post?.likes || 1) - 1) };
    } else {
        // Like
        await getAdmin()
            .from('post_likes')
            .insert({
                post_id: postId,
                user_id: userId,
            });

        // Increment likes count
        const { data: post } = await getAdmin()
            .from('green_feed_posts')
            .select('likes')
            .eq('post_id', postId)
            .single();

        const newLikes = (post?.likes || 0) + 1;
        await getAdmin()
            .from('green_feed_posts')
            .update({ likes: newLikes })
            .eq('post_id', postId);

        return { liked: true, likes: newLikes };
    }
}

// Add comment to post
export async function addCommentToPost(
    postId: string,
    userId: string,
    content: string
): Promise<Comment> {
    const { data: userData } = await getAdmin()
        .from('users')
        .select('display_name')
        .eq('user_id', userId)
        .single();

    const { data, error } = await getAdmin()
        .from('comments')
        .insert({
            post_id: postId,
            user_id: userId,
            display_name: userData?.display_name,
            content,
        })
        .select()
        .single();

    if (error) throw error;
    return mapCommentFromDb(data);
}

// Get comments for post
export async function getPostComments(postId: string): Promise<Comment[]> {
    const { data, error } = await getAdmin()
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapCommentFromDb);
}

// Delete post
export async function deleteFeedPost(postId: string, userId: string): Promise<void> {
    const { error } = await getAdmin()
        .from('green_feed_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

    if (error) throw error;
}

// Helper functions
function mapPostFromDb(row: any): GreenFeedPost {
    return {
        postId: row.post_id,
        userId: row.user_id,
        displayName: row.display_name,
        avatar: row.avatar,
        imageUrl: row.image_url,
        caption: row.caption,
        cupId: row.cup_id,
        greenPointsEarned: row.green_points_earned || 0,
        likes: row.likes || 0,
        createdAt: new Date(row.created_at),
    };
}

function mapCommentFromDb(row: any): Comment {
    return {
        commentId: row.comment_id,
        postId: row.post_id,
        userId: row.user_id,
        displayName: row.display_name,
        content: row.content,
        createdAt: new Date(row.created_at),
    };
}
