import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET: Get user's tree status
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);

    // Allow getting other users' tree if userId param exists (for viewing friends)
    // But default to current user
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');
    const userId = targetUserId || authResult.userId;

    if (!userId) {
      return unauthorizedResponse();
    }

    let tree = await prisma.virtualTree.findUnique({
      where: { userId },
    });

    if (!tree) {
      // Create new tree if not exists
      tree = await prisma.virtualTree.create({
        data: {
          userId,
          level: 1,
          growth: 0,
          health: 'healthy',
        },
      });
    }

    return jsonResponse(tree);

  } catch (error) {
    logger.error('Tree GET API Error', { error });
    return errorResponse('Internal Server Error', 500);
  }
}

// POST: Water the tree
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.userId) {
      return unauthorizedResponse();
    }

    const userId = authResult.userId;

    // Check daily limit or cooldown if needed (logic simplified here)
    // For now, simple watering mechanic

    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      let tree = await tx.virtualTree.findUnique({
        where: { userId },
      });

      if (!tree) {
        tree = await tx.virtualTree.create({
          data: { userId, level: 1, growth: 0 },
        });
      }

      // Check if already watered today (optional logic for streak)
      // const today = new Date();
      // const lastWatered = new Date(tree.lastWatered);
      // const isSameDay = today.getDate() === lastWatered.getDate() && 
      //                   today.getMonth() === lastWatered.getMonth() &&
      //                   today.getFullYear() === lastWatered.getFullYear();

      // Calculation
      const growthAdd = 10; // 10% per water
      let newGrowth = tree.growth + growthAdd;
      let newLevel = tree.level;
      let leveledUp = false;

      if (newGrowth >= 100) {
        newLevel += 1;
        newGrowth = newGrowth - 100;
        leveledUp = true;
      }

      // Restore health
      const newHealth = 'healthy';

      const updatedTree = await tx.virtualTree.update({
        where: { userId },
        data: {
          growth: newGrowth,
          level: newLevel,
          health: newHealth,
          lastWatered: new Date(),
          totalWaterings: { increment: 1 },
        },
      });

      // If leveled up, maybe add Green Points or create specific notification
      if (leveledUp) {
        // Add 50 bonus points
        await tx.user.update({
          where: { userId },
          data: { greenPoints: { increment: 50 } }
        });

        // Log Game Score/Activity
        await tx.gameScore.create({
          data: {
            userId,
            gameType: 'tree_level_up',
            score: newLevel,
            reward: 50,
            metadata: JSON.stringify({ oldLevel: tree.level, newLevel }),
          }
        });
      }

      return { tree: updatedTree, leveledUp };
    });

    return jsonResponse(result);

  } catch (error) {
    logger.error('Tree POST API Error', { error });
    return errorResponse('Internal Server Error', 500);
  }
}
