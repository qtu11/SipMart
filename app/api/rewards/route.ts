import { NextRequest } from 'next/server';
import { getAllRewards, claimReward, getUserRewardClaimsWithDetails } from '@/lib/supabase/rewards';
import { getUser } from '@/lib/supabase/users';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyAuth } from '@/lib/middleware/auth';
import { validateRequest, rewardClaimSchema } from '@/lib/validation/schemas';

// GET - List all rewards or user's claimed rewards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as any;
    const userId = searchParams.get('userId');

    if (userId) {
      // Get user's claimed rewards
      const claims = await getUserRewardClaimsWithDetails(userId);
      const transformedClaims = claims.map((c) => ({
        claimId: c.claimId,
        rewardName: c.reward.name,
        rewardImage: c.reward.image,
        pointsUsed: c.pointsUsed,
        status: c.status,
        claimedAt: c.claimedAt,
        usedAt: c.usedAt,
      }));
      return jsonResponse({ claims: transformedClaims });
    }

    // Get all active rewards
    const rewards = await getAllRewards(category);
    const transformedRewards = rewards.map((r) => ({
      rewardId: r.rewardId,
      name: r.name,
      description: r.description,
      image: r.image,
      pointsCost: r.pointsCost,
      stock: r.stock,
      category: r.category,
      validUntil: r.validUntil,
    }));

    return jsonResponse({ rewards: transformedRewards });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

// POST - Claim a reward
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify auth
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.userId) {
      return unauthorizedResponse();
    }

    const userId = authResult.userId;
    const body = await request.json();

    // Validation
    const validation = validateRequest(rewardClaimSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { rewardId } = validation.data;

    // Claim reward (this also deducts points)
    const claim = await claimReward(userId, rewardId);

    // Get updated user
    const user = await getUser(userId);

    return jsonResponse({
      claimId: claim.claimId,
      pointsUsed: claim.pointsUsed,
      remainingPoints: user?.greenPoints || 0,
    }, 'Reward claimed successfully');

  } catch (error: unknown) {
    return errorResponse(error);
  }
}
