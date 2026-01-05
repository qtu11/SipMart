import { getSupabaseAdmin } from './server';
import { getUser } from './users';

const getAdmin = () => getSupabaseAdmin();

export interface Reward {
    rewardId: string;
    name: string;
    description: string;
    image: string;
    pointsCost: number;
    stock: number;
    category: 'voucher' | 'merchandise' | 'privilege' | 'charity';
    validUntil?: Date;
    isActive: boolean;
    createdAt: Date;
}

export interface RewardClaim {
    claimId: string;
    userId: string;
    rewardId: string;
    pointsUsed: number;
    status: 'pending' | 'claimed' | 'expired';
    claimedAt: Date;
    usedAt?: Date;
}

// Get all active rewards
export async function getAllRewards(category?: Reward['category']): Promise<Reward[]> {
    let query = getAdmin()
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapRewardFromDb);
}

// Get reward by ID
export async function getReward(rewardId: string): Promise<Reward | null> {
    const { data, error } = await getAdmin()
        .from('rewards')
        .select('*')
        .eq('reward_id', rewardId)
        .single();

    if (error || !data) return null;
    return mapRewardFromDb(data);
}

// Claim reward
export async function claimReward(
    userId: string,
    rewardId: string
): Promise<RewardClaim> {
    // Get user's current points
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    // Get reward details
    const reward = await getReward(rewardId);
    if (!reward) throw new Error('Reward not found');

    // Check if user has enough points
    if (user.greenPoints < reward.pointsCost) {
        throw new Error(`Insufficient points. Required: ${reward.pointsCost}, Available: ${user.greenPoints}`);
    }

    // Check stock
    if (reward.stock <= 0) {
        throw new Error('Reward out of stock');
    }

    // Check if reward is still valid
    if (reward.validUntil && new Date() > reward.validUntil) {
        throw new Error('Reward expired');
    }

    // Deduct points from user
    const { updateUser } = await import('./users');
    await updateUser(userId, {
        greenPoints: user.greenPoints - reward.pointsCost,
    });

    // Decrease stock
    await getAdmin()
        .from('rewards')
        .update({
            stock: reward.stock - 1,
        })
        .eq('reward_id', rewardId);

    // Create reward claim
    const { data, error } = await getAdmin()
        .from('reward_claims')
        .insert({
            user_id: userId,
            reward_id: rewardId,
            points_used: reward.pointsCost,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;

    // Send notification
    await getAdmin()
        .from('notifications')
        .insert({
            user_id: userId,
            type: 'success',
            title: '🎁 Reward Claimed!',
            message: `Bạn vừa đổi thành công: ${reward.name}`,
            url: '/rewards',
        });

    return mapRewardClaimFromDb(data);
}

// Get user's reward claims
export async function getUserRewardClaims(userId: string): Promise<RewardClaim[]> {
    const { data, error } = await getAdmin()
        .from('reward_claims')
        .select('*')
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapRewardClaimFromDb);
}

// Get user's reward claims with reward details
export async function getUserRewardClaimsWithDetails(userId: string): Promise<
    Array<RewardClaim & { reward: Reward }>
> {
    const { data, error } = await getAdmin()
        .from('reward_claims')
        .select(`
      *,
      rewards (*)
    `)
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => ({
        ...mapRewardClaimFromDb(row),
        reward: mapRewardFromDb(row.rewards),
    }));
}

// Mark reward claim as used
export async function useRewardClaim(claimId: string): Promise<RewardClaim> {
    const { data, error } = await getAdmin()
        .from('reward_claims')
        .update({
            status: 'claimed',
            used_at: new Date().toISOString(),
        })
        .eq('claim_id', claimId)
        .select()
        .single();

    if (error) throw error;
    return mapRewardClaimFromDb(data);
}

// Map database row to Reward
function mapRewardFromDb(row: any): Reward {
    return {
        rewardId: row.reward_id,
        name: row.name,
        description: row.description,
        image: row.image,
        pointsCost: row.points_cost,
        stock: row.stock,
        category: row.category as Reward['category'],
        validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
    };
}

// Map database row to RewardClaim
function mapRewardClaimFromDb(row: any): RewardClaim {
    return {
        claimId: row.claim_id,
        userId: row.user_id,
        rewardId: row.reward_id,
        pointsUsed: row.points_used,
        status: row.status as RewardClaim['status'],
        claimedAt: new Date(row.claimed_at),
        usedAt: row.used_at ? new Date(row.used_at) : undefined,
    };
}
