import { getSupabaseAdmin } from './server';

// Story types
export interface Story {
    storyId: string;
    userId: string;
    displayName?: string;
    avatar?: string;
    type: 'image' | 'video' | 'achievement' | 'milestone';
    content: string;
    thumbnail?: string;
    achievementType?: 'cup_saved' | 'points' | 'rank_up' | 'challenge';
    achievementData?: any;
    createdAt: Date;
    expiresAt: Date;
}

const getAdmin = () => getSupabaseAdmin();

// Create story
export async function createStory(params: {
    userId: string;
    type: Story['type'];
    content: string;
    thumbnail?: string;
    achievementType?: Story['achievementType'];
    achievementData?: any;
}): Promise<Story> {
    const { data: userData } = await getAdmin()
        .from('users')
        .select('display_name, avatar')
        .eq('user_id', params.userId)
        .single();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Stories expire after 24 hours

    const { data, error } = await getAdmin()
        .from('stories')
        .insert({
            user_id: params.userId,
            display_name: userData?.display_name,
            avatar: userData?.avatar,
            type: params.type,
            content: params.content,
            thumbnail: params.thumbnail,
            achievement_type: params.achievementType,
            achievement_data: params.achievementData ? JSON.stringify(params.achievementData) : null,
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    return mapStoryFromDb(data);
}

// Create achievement story
export async function createAchievementStory(
    userId: string,
    achievementType: Story['achievementType'],
    achievementData: any
): Promise<Story> {
    let content = '';
    switch (achievementType) {
        case 'cup_saved':
            content = `Đã cứu ${achievementData.count} ly nhựa! 🌱`;
            break;
        case 'rank_up':
            content = `Lên hạng ${achievementData.rank}! 🎉`;
            break;
        case 'points':
            content = `Đạt ${achievementData.points} điểm! ⭐`;
            break;
        case 'challenge':
            content = `Hoàn thành thử thách: ${achievementData.name}! 🏆`;
            break;
        default:
            content = 'Achievement unlocked! 🎯';
    }

    return createStory({
        userId,
        type: 'achievement',
        content,
        achievementType,
        achievementData,
    });
}

// Get stories (for feed)
export async function getStories(userId?: string): Promise<Story[]> {
    const now = new Date();

    let query = getAdmin()
        .from('stories')
        .select('*')
        .gt('expires_at', now.toISOString())
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapStoryFromDb);
}

// Get user stories
export async function getUserStories(userId: string): Promise<Story[]> {
    return getStories(userId);
}

// View story
export async function viewStory(storyId: string, userId: string): Promise<void> {
    // Check if already viewed
    const { data: existing } = await getAdmin()
        .from('story_views')
        .select('view_id')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .single();

    if (!existing) {
        await getAdmin()
            .from('story_views')
            .insert({
                story_id: storyId,
                user_id: userId,
            });
    }
}

// Delete story
export async function deleteStory(storyId: string, userId: string): Promise<void> {
    await getAdmin()
        .from('stories')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', userId);
}

// Clean expired stories (cron job)
export async function cleanExpiredStories(): Promise<number> {
    const now = new Date();

    const { data, error } = await getAdmin()
        .from('stories')
        .delete()
        .lt('expires_at', now.toISOString())
        .select();

    if (error) throw error;
    return data?.length || 0;
}

// Helper function
function mapStoryFromDb(row: any): Story {
    return {
        storyId: row.story_id,
        userId: row.user_id,
        displayName: row.display_name,
        avatar: row.avatar,
        type: row.type as Story['type'],
        content: row.content,
        thumbnail: row.thumbnail,
        achievementType: row.achievement_type as Story['achievementType'],
        achievementData: row.achievement_data ? JSON.parse(row.achievement_data) : undefined,
        createdAt: new Date(row.created_at),
        expiresAt: new Date(row.expires_at),
    };
}
