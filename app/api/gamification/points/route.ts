import { NextRequest, NextResponse } from 'next/server';
import { getUser, addGreenPoints } from '@/lib/supabase/users';
import { getSupabaseAdmin } from '@/lib/supabase/server';

// GET - Get user's points balance and history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400 }
            );
        }

        // Get user
        const user = await getUser(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get points history from EcoAction
        const { data: history, error } = await getSupabaseAdmin()
            .from('eco_actions')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            currentPoints: user.greenPoints,
            rankLevel: user.rankLevel,
            history: (history || []).map((action) => ({
                actionId: action.action_id,
                type: action.type,
                points: action.points,
                description: action.description,
                timestamp: action.timestamp,
            })),
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Award points (internal use only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, points, reason } = body;

        if (!userId || points === undefined || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Award points
        const result = await addGreenPoints(userId, points, reason);

        // Get updated user
        const user = await getUser(userId);

        return NextResponse.json({
            success: true,
            pointsAdded: result.pointsAdded,
            rankUp: result.rankUp,
            newRank: result.newRank,
            currentPoints: user?.greenPoints || 0,
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
