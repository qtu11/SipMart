import { getSupabaseAdmin } from './server';

const getAdmin = () => getSupabaseAdmin();

export interface Challenge {
    challengeId: string;
    name: string;
    description: string;
    icon?: string;
    type: 'daily' | 'weekly' | 'monthly' | 'special';
    requirementType: 'cups' | 'points' | 'friends' | 'posts' | 'streak';
    requirementValue: number;
    rewardPoints: number;
    rewardBadgeId?: string;
    startDate: Date;
    endDate: Date;
    maxParticipants?: number;
    isActive: boolean;
    createdAt: Date;
}

export interface UserChallenge {
    id: string;
    userId: string;
    challengeId: string;
    progress: number;
    status: 'in_progress' | 'completed' | 'failed';
    joinedAt: Date;
    completedAt?: Date;
}

/**
 * Lấy challenges đang active
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
    const now = new Date().toISOString();

    const { data, error } = await getAdmin()
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gt('end_date', now)
        .order('end_date', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapChallengeFromDb);
}

/**
 * Lấy user's challenge progress
 */
export async function getUserChallenges(userId: string): Promise<(UserChallenge & { challenge: Challenge })[]> {
    const { data, error } = await getAdmin()
        .from('user_challenges')
        .select(`
      *,
      challenges (*)
    `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(row => ({
        ...mapUserChallengeFromDb(row),
        challenge: mapChallengeFromDb(row.challenges),
    }));
}

/**
 * Cập nhật challenge progress
 */
export async function updateChallengeProgress(
    userId: string,
    requirementType: Challenge['requirementType'],
    incrementBy: number = 1
): Promise<{ completed: UserChallenge[]; pointsEarned: number }> {

    const completed: UserChallenge[] = [];
    let totalPointsEarned = 0;

    // Lấy tất cả user challenges đang in_progress với requirement type phù hợp
    const { data: userChallenges, error: ucError } = await getAdmin()
        .from('user_challenges')
        .select(`
      *,
      challenges (*)
    `)
        .eq('user_id', userId)
        .eq('status', 'in_progress');

    if (ucError || !userChallenges) {
        console.error('Error fetching user challenges:', ucError);
        return { completed, pointsEarned: totalPointsEarned };
    }

    // Filter những challenge có requirement type phù hợp
    const relevantChallenges = userChallenges.filter(
        uc => uc.challenges?.requirement_type === requirementType
    );

    for (const uc of relevantChallenges) {
        const challenge = uc.challenges;
        const newProgress = uc.progress + incrementBy;

        // Check if completed
        if (newProgress >= challenge.requirement_value) {
            // Complete challenge
            const { data: updatedUc, error: updateError } = await getAdmin()
                .from('user_challenges')
                .update({
                    progress: newProgress,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', uc.id)
                .select()
                .single();

            if (!updateError && updatedUc) {
                // Award points
                const { addGreenPoints } = await import('./users');
                await addGreenPoints(
                    userId,
                    challenge.reward_points,
                    `Completed challenge: ${challenge.name}`
                );

                totalPointsEarned += challenge.reward_points;
                completed.push(mapUserChallengeFromDb(updatedUc));

                // Send notification
                await getAdmin().from('notifications').insert({
                    user_id: userId,
                    type: 'success',
                    title: '🏆 Thử thách hoàn thành!',
                    message: `Bạn đã hoàn thành "${challenge.name}" và nhận ${challenge.reward_points} Green Points!`,
                    url: '/challenges',
                });

                // Unlock badge if applicable
                if (challenge.reward_badge_id) {
                    const { unlockAchievement } = await import('./achievements');
                    await unlockAchievement(userId, challenge.reward_badge_id);
                }
            }
        } else {
            // Just update progress
            await getAdmin()
                .from('user_challenges')
                .update({ progress: newProgress })
                .eq('id', uc.id);
        }
    }

    return { completed, pointsEarned: totalPointsEarned };
}

/**
 * Check và đánh dấu challenges thất bại (expired)
 */
export async function checkExpiredChallenges(): Promise<number> {
    const now = new Date().toISOString();

    // Lấy challenges đã hết hạn
    const { data: expiredChallenges, error: challengeError } = await getAdmin()
        .from('challenges')
        .select('challenge_id')
        .lt('end_date', now)
        .eq('is_active', true);

    if (challengeError || !expiredChallenges?.length) {
        return 0;
    }

    const challengeIds = expiredChallenges.map(c => c.challenge_id);

    // Đánh dấu user challenges là failed nếu chưa completed
    const { data, error: updateError } = await getAdmin()
        .from('user_challenges')
        .update({ status: 'failed' })
        .in('challenge_id', challengeIds)
        .eq('status', 'in_progress')
        .select('id');

    if (updateError) {
        console.error('Error marking expired challenges:', updateError);
        return 0;
    }

    // Deactivate expired challenges
    await getAdmin()
        .from('challenges')
        .update({ is_active: false })
        .in('challenge_id', challengeIds);

    return data?.length || 0;
}

// Mapping helpers
function mapChallengeFromDb(row: any): Challenge {
    return {
        challengeId: row.challenge_id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        type: row.type as Challenge['type'],
        requirementType: row.requirement_type as Challenge['requirementType'],
        requirementValue: row.requirement_value,
        rewardPoints: row.reward_points,
        rewardBadgeId: row.reward_badge_id,
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        maxParticipants: row.max_participants,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
    };
}

function mapUserChallengeFromDb(row: any): UserChallenge {
    return {
        id: row.id,
        userId: row.user_id,
        challengeId: row.challenge_id,
        progress: row.progress || 0,
        status: row.status as UserChallenge['status'],
        joinedAt: new Date(row.joined_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
}
