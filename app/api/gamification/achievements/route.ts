import { NextRequest, NextResponse } from 'next/server';
import {
    getAllAchievements,
    getUserAchievementsWithDetails,
    checkAchievementProgress
} from '@/lib/supabase/achievements';

// GET - Get all achievements or user's achievements
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const includeProgress = searchParams.get('includeProgress') === 'true';

        if (!userId) {
            // Get all achievements (public list)
            const achievements = await getAllAchievements();
            return NextResponse.json({
                success: true,
                achievements: achievements.map((a) => ({
                    achievementId: a.achievementId,
                    badgeId: a.badgeId,
                    name: a.name,
                    description: a.description,
                    icon: a.icon,
                    rarity: a.rarity,
                    requirement: a.requirement,
                    rewardPoints: a.rewardPoints,
                    category: a.category,
                })),
            });
        }

        // Get user's unlocked achievements with details
        const userAchievements = await getUserAchievementsWithDetails(userId);

        // If includeProgress, also get progress for locked achievements
        let progressData = null;
        if (includeProgress) {
            const allAchievements = await getAllAchievements();
            const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

            const lockedAchievements = allAchievements.filter(
                (a) => !unlockedIds.has(a.achievementId)
            );

            const progressPromises = lockedAchievements.map(async (a) => ({
                achievementId: a.achievementId,
                name: a.name,
                icon: a.icon,
                progress: await checkAchievementProgress(userId, a.achievementId),
            }));

            progressData = await Promise.all(progressPromises);
        }

        return NextResponse.json({
            success: true,
            unlocked: userAchievements.map((ua) => ({
                achievementId: ua.achievementId,
                name: ua.achievement.name,
                icon: ua.achievement.icon,
                rarity: ua.achievement.rarity,
                unlockedAt: ua.unlockedAt,
                rewardPoints: ua.achievement.rewardPoints,
            })),
            locked: progressData || [],
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
