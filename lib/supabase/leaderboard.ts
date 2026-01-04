import { getSupabaseAdmin } from './server';
import { getUser } from './users';

// Leaderboard entry type
export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    avatar?: string;
    greenPoints: number;
    totalCupsSaved: number;
    rank: number;
    rankLevel: string;
    studentId?: string;
}

const getAdmin = () => getSupabaseAdmin();

// Get global leaderboard
export async function getGlobalLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const { data, error } = await getAdmin()
        .from('users')
        .select('user_id, display_name, avatar, green_points, total_cups_saved, rank_level, student_id')
        .eq('is_blacklisted', false)
        .order('green_points', { ascending: false })
        .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.map((row, index) => ({
        userId: row.user_id,
        displayName: row.display_name || 'Anonymous',
        avatar: row.avatar,
        greenPoints: row.green_points || 0,
        totalCupsSaved: row.total_cups_saved || 0,
        rank: index + 1,
        rankLevel: row.rank_level,
        studentId: row.student_id,
    }));
}

// Get leaderboard by rank level
export async function getLeaderboardByRank(
    rankLevel: string,
    limit: number = 50
): Promise<LeaderboardEntry[]> {
    const { data, error } = await getAdmin()
        .from('users')
        .select('user_id, display_name, avatar, green_points, total_cups_saved, rank_level, student_id')
        .eq('rank_level', rankLevel)
        .eq('is_blacklisted', false)
        .order('green_points', { ascending: false })
        .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.map((row, index) => ({
        userId: row.user_id,
        displayName: row.display_name || 'Anonymous',
        avatar: row.avatar,
        greenPoints: row.green_points || 0,
        totalCupsSaved: row.total_cups_saved || 0,
        rank: index + 1,
        rankLevel: row.rank_level,
        studentId: row.student_id,
    }));
}

// Get user's rank and position
export async function getUserRank(userId: string): Promise<{
    rank: number;
    totalUsers: number;
    percentile: number;
    entry: LeaderboardEntry;
}> {
    // Get user data
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    // Count users with more points
    const { count: higherCount } = await getAdmin()
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('green_points', user.greenPoints)
        .eq('is_blacklisted', false);

    // Count total users
    const { count: totalCount } = await getAdmin()
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_blacklisted', false);

    const rank = (higherCount || 0) + 1;
    const totalUsers = totalCount || 1;
    const percentile = ((totalUsers - rank) / totalUsers) * 100;

    return {
        rank,
        totalUsers,
        percentile: Math.round(percentile * 10) / 10,
        entry: {
            userId: user.userId,
            displayName: user.displayName || user.email,
            avatar: user.avatar,
            greenPoints: user.greenPoints,
            totalCupsSaved: user.totalCupsSaved,
            rank,
            rankLevel: user.rankLevel,
            studentId: user.studentId,
        },
    };
}

// Get leaderboard with user's position highlighted
export async function getLeaderboardWithUser(
    userId: string,
    limit: number = 50
): Promise<{
    leaderboard: LeaderboardEntry[];
    userRank: number;
    userEntry?: LeaderboardEntry;
}> {
    const leaderboard = await getGlobalLeaderboard(limit);
    const userRankData = await getUserRank(userId);

    return {
        leaderboard,
        userRank: userRankData.rank,
        userEntry: userRankData.entry,
    };
}

// Get friends leaderboard
export async function getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
    // Get user's friends
    const { getFriends } = await import('./friends');
    const friendIds = await getFriends(userId);

    if (friendIds.length === 0) return [];

    // Get friends data
    const { data, error } = await getAdmin()
        .from('users')
        .select('user_id, display_name, avatar, green_points, total_cups_saved, rank_level, student_id')
        .in('user_id', friendIds)
        .eq('is_blacklisted', false)
        .order('green_points', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row, index) => ({
        userId: row.user_id,
        displayName: row.display_name || 'Anonymous',
        avatar: row.avatar,
        greenPoints: row.green_points || 0,
        totalCupsSaved: row.total_cups_saved || 0,
        rank: index + 1,
        rankLevel: row.rank_level,
        studentId: row.student_id,
    }));
}
