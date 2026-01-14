import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
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

        const supabase = getSupabaseAdmin();

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

        // Save Score to game_scores table
        const { data: gameScore, error: scoreError } = await supabase
            .from('game_scores')
            .insert({
                user_id: userId,
                game_type: gameType,
                score,
                reward: greenPointsReward,
            })
            .select()
            .single();

        if (scoreError) {
            console.error('Insert game score error:', scoreError);
            // Continue even if game_scores table doesn't exist
        }

        // Award Points to user
        if (greenPointsReward > 0) {
            const { error: updateError } = await supabase.rpc('increment_green_points', {
                p_user_id: userId,
                p_amount: greenPointsReward
            });

            // Fallback: direct update if RPC doesn't exist
            if (updateError) {
                console.error('RPC increment_green_points error:', updateError);
                // Try direct update
                const { data: userData } = await supabase
                    .from('users')
                    .select('green_points')
                    .eq('user_id', userId)
                    .single();

                if (userData) {
                    await supabase
                        .from('users')
                        .update({ green_points: (userData.green_points || 0) + greenPointsReward })
                        .eq('user_id', userId);
                }
            }
        }

        return jsonResponse({
            success: true,
            greenPointsEarned: greenPointsReward,
            gameScore: gameScore || { gameType, score, reward: greenPointsReward }
        });

    } catch (error) {
        console.error('Submit Score Error', error);
        return errorResponse('Internal server error');
    }
}
