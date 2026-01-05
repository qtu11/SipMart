import { getSupabaseAdmin } from './server';
import { logger } from '../logger';
import { addGreenPoints } from './users';

const getAdmin = () => getSupabaseAdmin();

// ============= GREEN STREAK MANAGEMENT (IMPROVED) =============

export async function updateGreenStreak(
    userId: string,
    success: boolean
): Promise<{ streak: number; voucherAwarded: boolean }> {
    try {
        // Get user's current streak data
        const { data: user, error: userError } = await getAdmin()
            .from('users')
            .select('green_streak, last_return_date, best_streak, green_points')
            .eq('user_id', userId)
            .single();

        if (userError || !user) throw new Error('User not found');

        const now = new Date();
        const lastReturn = user.last_return_date ? new Date(user.last_return_date) : null;

        let newStreak = 0;
        let voucherAwarded = false;

        if (success) {
            // Check if this return is within 24 hours of last return (continuity)
            const isContinuous = lastReturn
                ? (now.getTime() - lastReturn.getTime()) < (24 * 60 * 60 * 1000)
                : true; // First return always starts streak

            if (isContinuous) {
                // Continue streak
                newStreak = (user.green_streak || 0) + 1;
            } else {
                // Streak broken by time gap, restart
                newStreak = 1;
            }

            // Update best streak if exceeded
            const newBestStreak = Math.max(user.best_streak || 0, newStreak);

            // Check if voucher should be awarded (every 5 streak)
            voucherAwarded = newStreak > 0 && newStreak % 5 === 0;

            // Update user's streak in database
            await getAdmin()
                .from('users')
                .update({
                    green_streak: newStreak,
                    last_return_date: now.toISOString(),
                    best_streak: newBestStreak,
                })
                .eq('user_id', userId);

            if (voucherAwarded) {
                // Award streak voucher
                const { data: voucher, error: voucherError } = await getAdmin()
                    .from('rewards')
                    .select('*')
                    .eq('category', 'voucher')
                    .eq('is_active', true)
                    .limit(1)
                    .single();

                if (voucher && !voucherError) {
                    await getAdmin()
                        .from('reward_claims')
                        .insert({
                            user_id: userId,
                            reward_id: voucher.reward_id,
                            points_used: 0, // Free from streak
                            status: 'claimed',
                        });

                    // Send notification
                    await getAdmin()
                        .from('notifications')
                        .insert({
                            user_id: userId,
                            type: 'success',
                            title: '🎁 Green Streak Reward!',
                            message: `Bạn đã đạt ${newStreak} lần trả ly đúng hạn liên tiếp! Nhận voucher giảm giá.`,
                            url: '/rewards',
                        });
                }
            }
        } else {
            // Late return - reset streak to 0
            newStreak = 0;
            await getAdmin()
                .from('users')
                .update({
                    green_streak: 0,
                    last_return_date: now.toISOString(),
                })
                .eq('user_id', userId);
        }

        return { streak: newStreak, voucherAwarded };
    } catch (error) {
        logger.error('Error updating green streak', { error });
        return { streak: 0, voucherAwarded: false };
    }
}

// ============= ACHIEVEMENT MANAGEMENT =============

export async function checkAndUnlockAchievements(
    userId: string
): Promise<string[]> {
    try {
        const { data: user, error: userError } = await getAdmin()
            .from('users')
            .select('total_cups_saved, green_points, total_plastic_reduced')
            .eq('user_id', userId)
            .single();

        if (userError || !user) return [];

        // Get all achievements
        const { data: achievements, error: achError } = await getAdmin()
            .from('achievements')
            .select('*')
            .eq('is_active', true);

        if (achError || !achievements) return [];

        // Get user's current achievements
        const { data: userAchievements, error: userAchError } = await getAdmin()
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userId);

        if (userAchError) return [];

        const unlockedIds = new Set((userAchievements || []).map((ua) => ua.achievement_id));
        const newlyUnlocked: string[] = [];

        for (const achievement of achievements) {
            // Skip if already unlocked
            if (unlockedIds.has(achievement.achievement_id)) continue;

            let shouldUnlock = false;

            // Check achievement criteria based on category (COMPLETE IMPLEMENTATION)
            switch (achievement.category) {
                case 'cups':
                    // E.g., "Save 10 cups", "Save 100 cups"
                    shouldUnlock = user.total_cups_saved >= achievement.requirement;
                    break;

                case 'points':
                    // E.g., "Earn 1000 points", "Earn 10000 points"
                    shouldUnlock = user.green_points >= achievement.requirement;
                    break;

                case 'social':
                    // E.g., "Have 10 friends", "Post 50 times"
                    // Check friends count
                    const { count: friendsCount } = await getAdmin()
                        .from('friendships')
                        .select('*', { count: 'exact', head: true })
                        .or(`user_id1.eq.${userId},user_id2.eq.${userId}`);

                    shouldUnlock = (friendsCount || 0) >= achievement.requirement;
                    break;

                case 'streak':
                    // E.g., "7-day streak", "30-day streak"
                    const { data: streakUser } = await getAdmin()
                        .from('users')
                        .select('green_streak, best_streak')
                        .eq('user_id', userId)
                        .single();

                    // Check either current or best streak
                    shouldUnlock = (streakUser?.best_streak || 0) >= achievement.requirement;
                    break;

                case 'eco':
                    // E.g., "Reduce X grams of plastic"
                    shouldUnlock = (user.total_plastic_reduced || 0) >= achievement.requirement;
                    break;

                case 'special':
                    // Special achievements require manual unlock or specific events
                    // Examples: Speed Returner (< 1h), Zero Waste (no overdue ever), Campus Champion (top 10)
                    // These should be unlocked by specific event handlers
                    // Skip automatic unlock for special achievements in this function
                    shouldUnlock = false;
                    break;

                default:
                    shouldUnlock = false;
            }

            if (shouldUnlock) {
                // Unlock achievement
                await getAdmin()
                    .from('user_achievements')
                    .insert({
                        user_id: userId,
                        achievement_id: achievement.achievement_id,
                        progress: achievement.requirement,
                    });

                // Award bonus points
                if (achievement.reward_points > 0) {
                    await addGreenPoints(
                        userId,
                        achievement.reward_points,
                        `Unlocked achievement: ${achievement.name}`
                    );
                }

                // Send notification
                await getAdmin()
                    .from('notifications')
                    .insert({
                        user_id: userId,
                        type: 'success',
                        title: `🏆 Achievement unlocked!`,
                        message: `Bạn vừa mở khóa: ${achievement.name}`,
                        url: '/profile',
                    });

                newlyUnlocked.push(achievement.achievement_id);
            }
        }

        return newlyUnlocked;
    } catch (error) {
        logger.error('Error checking achievements', { error });
        return [];
    }
}

// ============= TIER MANAGEMENT =============

export async function getTierInfo(userId: string): Promise<{
    currentTier: string;
    borrowLimit: number;
    currentBorrowed: number;
    canBorrow: boolean;
}> {
    try {
        const { data: user, error: userError } = await getAdmin()
            .from('users')
            .select('rank_level')
            .eq('user_id', userId)
            .single();

        if (userError || !user) {
            return {
                currentTier: 'seed',
                borrowLimit: 1,
                currentBorrowed: 0,
                canBorrow: false,
            };
        }

        // Import config
        const { GAMIFICATION_CONFIG } = await import('@/lib/config/gamification');
        const tierConfig = GAMIFICATION_CONFIG.tiers[user.rank_level as keyof typeof GAMIFICATION_CONFIG.tiers] || GAMIFICATION_CONFIG.tiers.seed;

        // Get current borrowed cups
        const { data: transactions, error: txError } = await getAdmin()
            .from('transactions')
            .select('transaction_id')
            .eq('user_id', userId)
            .in('status', ['ongoing', 'overdue']);

        if (txError) throw txError;

        const currentBorrowed = (transactions || []).length;
        const canBorrow = currentBorrowed < tierConfig.borrowLimit;

        return {
            currentTier: user.rank_level,
            borrowLimit: tierConfig.borrowLimit,
            currentBorrowed,
            canBorrow,
        };
    } catch (error) {
        logger.error('Error getting tier info', { error });
        return {
            currentTier: 'seed',
            borrowLimit: 1,
            currentBorrowed: 0,
            canBorrow: false,
        };
    }
}

// ============= FIRST-TIME USER BONUS (FIXED) =============

export async function checkFirstTimeBonus(userId: string): Promise<boolean> {
    try {
        // FIXED: Check transaction count instead of totalCupsSaved
        // totalCupsSaved only increments on return, so first borrow would still be 0
        const { count, error } = await getAdmin()
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            logger.error('Error checking first-time bonus', { error });
            return false;
        }

        // First-time user has 0 transactions
        return count === 0;
    } catch (error) {
        logger.error('Error checking first-time bonus', { error });
        return false;
    }
}

export async function applyFirstTimeBonus(
    userId: string,
    bonusType: 'free_deposit' | 'wallet_credit'
): Promise<void> {
    try {
        if (bonusType === 'wallet_credit') {
            // Add 25,000 VND to wallet
            const { updateWallet } = await import('./users');
            await updateWallet(userId, 25000);

            await getAdmin()
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: 'success',
                    title: '🎉 Welcome Bonus!',
                    message: 'Bạn nhận được 25,000 VND vào ví!',
                });
        }
        // For 'free_deposit', the borrow API will skip deposit deduction
    } catch (error) {
        logger.error('Error applying first-time bonus', { error });
    }
}
