import { getSupabaseAdmin } from './server';
import { addGreenPoints } from './users';

const getAdmin = () => getSupabaseAdmin();

export interface UserStreak {
    id: string;
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    streakStartedAt: Date | null;
    updatedAt: Date;
}

/**
 * Lấy streak của user
 */
export async function getUserStreak(userId: string): Promise<UserStreak | null> {
    const { data, error } = await getAdmin()
        .from('user_green_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error || !data) return null;
    return mapStreakFromDb(data);
}

/**
 * Cập nhật streak khi user hoàn thành action xanh (mượn/trả ly)
 */
export async function updateUserStreak(userId: string): Promise<{
    currentStreak: number;
    isNewDay: boolean;
    streakBonusPoints: number;
}> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Lấy streak hiện tại
    const streak = await getUserStreak(userId);

    // Nếu chưa có, tạo mới
    if (!streak) {
        const { data, error } = await getAdmin()
            .from('user_green_streaks')
            .insert({
                user_id: userId,
                current_streak: 1,
                longest_streak: 1,
                last_activity_date: today,
                streak_started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        // Bonus cho ngày đầu
        const bonusPoints = 10;
        await addGreenPoints(userId, bonusPoints, 'First day streak bonus');

        return {
            currentStreak: 1,
            isNewDay: true,
            streakBonusPoints: bonusPoints,
        };
    }

    // Nếu đã activity hôm nay, không cần update
    if (streak.lastActivityDate === today) {
        return {
            currentStreak: streak.currentStreak,
            isNewDay: false,
            streakBonusPoints: 0,
        };
    }

    // Tính khoảng cách ngày
    const lastDate = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
    const todayDate = new Date(today);

    let daysDiff = 999;
    if (lastDate) {
        daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    let newStreak = 1;
    let streakStartedAt = new Date().toISOString();

    if (daysDiff === 1) {
        // Liên tiếp - tăng streak
        newStreak = streak.currentStreak + 1;
        streakStartedAt = streak.streakStartedAt?.toISOString() || new Date().toISOString();
    } else if (daysDiff > 1) {
        // Mất streak - reset về 1
        newStreak = 1;
    }

    const newLongestStreak = Math.max(streak.longestStreak, newStreak);

    // Update database
    await getAdmin()
        .from('user_green_streaks')
        .update({
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_activity_date: today,
            streak_started_at: streakStartedAt,
        })
        .eq('user_id', userId);

    // Tính bonus points theo streak
    let bonusPoints = 0;
    if (newStreak === 3) {
        bonusPoints = 30; // 3 ngày
    } else if (newStreak === 7) {
        bonusPoints = 100; // 1 tuần
    } else if (newStreak === 14) {
        bonusPoints = 200; // 2 tuần
    } else if (newStreak === 30) {
        bonusPoints = 500; // 1 tháng
    } else if (newStreak % 7 === 0) {
        bonusPoints = 50; // Mỗi tuần
    } else if (daysDiff === 1) {
        bonusPoints = 5; // Giữ streak
    }

    if (bonusPoints > 0) {
        await addGreenPoints(userId, bonusPoints, `${newStreak}-day streak bonus`);

        // Notification cho milestone
        if ([3, 7, 14, 30].includes(newStreak)) {
            await getAdmin().from('notifications').insert({
                user_id: userId,
                type: 'success',
                title: `🔥 ${newStreak} ngày liên tiếp!`,
                message: `Tuyệt vời! Bạn đã duy trì streak ${newStreak} ngày và nhận ${bonusPoints} bonus points!`,
                url: '/profile',
            });
        }
    }

    // Check achievement Streak Master (7 ngày)
    if (newStreak >= 7) {
        try {
            const { unlockAchievement } = await import('./achievements');
            // Find achievement by badge_id
            const { data: achievement } = await getAdmin()
                .from('achievements')
                .select('achievement_id')
                .eq('badge_id', 'streak_master')
                .single();

            if (achievement) {
                await unlockAchievement(userId, achievement.achievement_id);
            }
        } catch (e) {
            console.error('Error unlocking streak achievement:', e);
        }
    }

    return {
        currentStreak: newStreak,
        isNewDay: true,
        streakBonusPoints: bonusPoints,
    };
}

/**
 * Lấy leaderboard streak
 */
export async function getStreakLeaderboard(limit: number = 10): Promise<Array<{
    userId: string;
    displayName: string;
    avatar?: string;
    currentStreak: number;
    longestStreak: number;
}>> {
    const { data, error } = await getAdmin()
        .from('user_green_streaks')
        .select(`
      user_id,
      current_streak,
      longest_streak,
      users (display_name, avatar)
    `)
        .order('current_streak', { ascending: false })
        .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.map(row => ({
        userId: row.user_id,
        displayName: (row.users as any)?.display_name || 'Anonymous',
        avatar: (row.users as any)?.avatar,
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
    }));
}

/**
 * Reset streak cho users không active hôm qua (cron job)
 */
export async function resetInactiveStreaks(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data, error } = await getAdmin()
        .from('user_green_streaks')
        .update({
            current_streak: 0,
            streak_started_at: null,
        })
        .lt('last_activity_date', yesterdayStr)
        .gt('current_streak', 0)
        .select('user_id');

    if (error) {
        console.error('Error resetting inactive streaks:', error);
        return 0;
    }

    return data?.length || 0;
}

// Mapping helper
function mapStreakFromDb(row: any): UserStreak {
    return {
        id: row.id,
        userId: row.user_id,
        currentStreak: row.current_streak || 0,
        longestStreak: row.longest_streak || 0,
        lastActivityDate: row.last_activity_date,
        streakStartedAt: row.streak_started_at ? new Date(row.streak_started_at) : null,
        updatedAt: new Date(row.updated_at),
    };
}
