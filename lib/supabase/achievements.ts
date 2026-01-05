import { getSupabaseAdmin } from './server';

const getAdmin = () => getSupabaseAdmin();

export interface Achievement {
    achievementId: string;
    badgeId: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    requirement: number;
    rewardPoints: number;
    specialReward?: string;
    category: 'cups' | 'social' | 'streak' | 'eco' | 'special';
    createdAt: Date;
}

export interface UserAchievement {
    id: string;
    userId: string;
    achievementId: string;
    unlockedAt: Date;
    progress: number;
}

// Get all achievements
export async function getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await getAdmin()
        .from('achievements')
        .select('*')
        .order('requirement', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapAchievementFromDb);
}

// Get user's unlocked achievements
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await getAdmin()
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapUserAchievementFromDb);
}

// Get user's achievements with full achievement data
export async function getUserAchievementsWithDetails(userId: string): Promise<
    Array<UserAchievement & { achievement: Achievement }>
> {
    const { data, error } = await getAdmin()
        .from('user_achievements')
        .select(`
      *,
      achievements (*)
    `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => ({
        ...mapUserAchievementFromDb(row),
        achievement: mapAchievementFromDb(row.achievements),
    }));
}

// Unlock achievement for user
export async function unlockAchievement(
    userId: string,
    achievementId: string
): Promise<UserAchievement> {
    // Check if already unlocked
    const { data: existing } = await getAdmin()
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();

    if (existing) {
        return mapUserAchievementFromDb(existing);
    }

    // Get achievement requirement
    const { data: achievement, error: achError } = await getAdmin()
        .from('achievements')
        .select('requirement')
        .eq('achievement_id', achievementId)
        .single();

    if (achError || !achievement) throw new Error('Achievement not found');

    // Create achievement unlock
    const { data, error } = await getAdmin()
        .from('user_achievements')
        .insert({
            user_id: userId,
            achievement_id: achievementId,
            progress: achievement.requirement,
        })
        .select()
        .single();

    if (error) throw error;
    return mapUserAchievementFromDb(data);
}

// Check achievement progress for user
export async function checkAchievementProgress(
    userId: string,
    achievementId: string
): Promise<{ current: number; required: number; percentage: number; unlocked: boolean }> {
    // Get achievement
    const { data: achievement, error: achError } = await getAdmin()
        .from('achievements')
        .select('*')
        .eq('achievement_id', achievementId)
        .single();

    if (achError || !achievement) {
        return { current: 0, required: 1, percentage: 0, unlocked: false };
    }

    // Check if already unlocked
    const { data: userAch } = await getAdmin()
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();

    if (userAch) {
        return {
            current: achievement.requirement,
            required: achievement.requirement,
            percentage: 100,
            unlocked: true,
        };
    }

    // Get user stats to calculate progress
    const { data: user, error: userError } = await getAdmin()
        .from('users')
        .select('total_cups_saved, green_points')
        .eq('user_id', userId)
        .single();

    if (userError || !user) {
        return { current: 0, required: achievement.requirement, percentage: 0, unlocked: false };
    }

    let current = 0;
    switch (achievement.category) {
        case 'cups':
            current = user.total_cups_saved;
            break;
        case 'eco':
        case 'special':
            current = user.green_points;
            break;
        default:
            current = 0;
    }

    const percentage = Math.min(100, Math.round((current / achievement.requirement) * 100));

    return {
        current,
        required: achievement.requirement,
        percentage,
        unlocked: false,
    };
}

// Map database row to Achievement
function mapAchievementFromDb(row: any): Achievement {
    return {
        achievementId: row.achievement_id,
        badgeId: row.badge_id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        rarity: row.rarity as Achievement['rarity'],
        requirement: row.requirement,
        rewardPoints: row.reward_points || 0,
        specialReward: row.special_reward || undefined,
        category: row.category as Achievement['category'],
        createdAt: new Date(row.created_at),
    };
}

// Map database row to UserAchievement
function mapUserAchievementFromDb(row: any): UserAchievement {
    return {
        id: row.id,
        userId: row.user_id,
        achievementId: row.achievement_id,
        unlockedAt: new Date(row.unlocked_at),
        progress: row.progress || 0,
    };
}
