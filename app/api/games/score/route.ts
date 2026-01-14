import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return unauthorizedResponse();
        }

        const { gameType, score } = await request.json();
        const userId = authResult.userId;

        if (!gameType || typeof score !== 'number') {
            return errorResponse('Invalid data', 400);
        }

        // Calculate Reward based on game type and score
        let greenPointsReward = 0;

        // Cup Catch: 10 points for every 100 score, max 50 per play
        if (gameType === 'cup_catch') {
            greenPointsReward = Math.min(50, Math.floor(score / 10));
        }
        // Eco Quiz: 10 points per correct answer (passed as score)
        else if (gameType === 'eco_quiz') {
            greenPointsReward = Math.min(100, score * 5);
        }

        // Save Score
        const gameScore = await prisma.gameScore.create({
            data: {
                userId,
                gameType,
                score,
                reward: greenPointsReward,
            }
        });

        // Award Points
        if (greenPointsReward > 0) {
            await prisma.user.update({
                where: { userId },
                data: { greenPoints: { increment: greenPointsReward } }
            });
        }

        return jsonResponse({
            success: true,
            greenPointsEarned: greenPointsReward,
            gameScore
        });

    } catch (error) {
        console.error('Submit Score Error', error);
        return errorResponse('Internal server error');
    }
}
