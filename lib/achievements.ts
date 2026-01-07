import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Trigger create achievement post API
 */
async function createAchievementPost(userId: string, achievementType: string, data: any) {
    try {
        await fetch(`${APP_URL}/api/feed/achievement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                achievementType,
                data,
            }),
        });
        logger.info('Achievement triggered', { userId, type: achievementType });
    } catch (error) {
        logger.error('Achievement trigger error', { error, userId });
    }
}

/**
 * Helper function to check if user should get achievement post
 * and trigger it if needed
 */
export async function checkAndTriggerAchievements(userId: string) {
    try {
        const supabase = getSupabaseAdmin();

        // Get user stats
        const { data: user, error } = await supabase
            .from('users')
            .select('total_cups_saved, rank_level, green_points')
            .eq('user_id', userId)
            .single();

        if (error || !user) {
            logger.error('Failed to fetch user for achievements', { userId, error });
            return;
        }

        const totalCups = user.total_cups_saved || 0;
        const currentRank = user.rank_level;

        // 1. Check Cup Milestones
        const milestones = [
            { cups: 50, type: 'milestone_50' },
            { cups: 100, type: 'milestone_100' },
            { cups: 500, type: 'milestone_500' },
        ];

        for (const milestone of milestones) {
            if (totalCups >= milestone.cups) {
                // Check if achievement post already exists
                const { data: existingPost } = await supabase
                    .from('green_feed_posts')
                    .select('post_id')
                    .eq('user_id', userId)
                    .eq('achievement_type', milestone.type)
                    .single();

                if (!existingPost) {
                    await createAchievementPost(userId, milestone.type, { totalCups });
                }
            }
        }

        // 2. Check Rank Up
        // Check if we have posted an achievement for the CURRENT rank
        if (currentRank && currentRank !== 'seed') {
            const { data: existingRankPost } = await supabase
                .from('green_feed_posts')
                .select('post_id')
                .eq('user_id', userId)
                .eq('achievement_type', 'rank_up')
                .ilike('caption', `%${currentRank}%`) // Simple check if caption contains rank name
                .single();

            // Also check using metadata if possible, but caption check is a fallback
            if (!existingRankPost) {
                await createAchievementPost(userId, 'rank_up', { newRank: currentRank, totalCups });
            }
        }

    } catch (error) {
        logger.error('Achievement trigger error', { error, userId });
    }
}

/**
 * Check if user just made their first friend
 */
export async function checkFirstFriend(userId: string) {
    try {
        const supabase = getSupabaseAdmin();

        // Count friends
        const { count, error } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`user_id1.eq.${userId},user_id2.eq.${userId}`);

        if (error) {
            logger.error('Error checking friendships', { error });
            return;
        }

        // If exactly 1 friend (the one just added)
        if (count === 1) {
            // Check if already posted
            const { data: existingPost } = await supabase
                .from('green_feed_posts')
                .select('post_id')
                .eq('user_id', userId)
                .eq('achievement_type', 'first_friend')
                .single();

            if (!existingPost) {
                await createAchievementPost(userId, 'first_friend', {});
            }
        }
    } catch (error) {
        logger.error('First friend achievement error', { error, userId });
    }
}

