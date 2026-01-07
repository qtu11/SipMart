import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';

/**
 * API Admin quản lý challenges (thử thách)
 * GET: Lấy danh sách challenges
 * POST: Tạo challenge mới
 */

interface CreateChallengeBody {
    name: string;
    description: string;
    icon?: string;
    type: 'daily' | 'weekly' | 'monthly' | 'special';
    requirementType: 'cups' | 'points' | 'friends' | 'posts' | 'streak';
    requirementValue: number;
    rewardPoints: number;
    rewardBadgeId?: string;
    startDate: string;
    endDate: string;
    maxParticipants?: number;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const activeOnly = searchParams.get('active') !== 'false';

        let query = supabase
            .from('challenges')
            .select(`
        *,
        user_challenges (
          count
        )
      `)
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('type', type);
        }

        if (activeOnly) {
            query = query.eq('is_active', true).gt('end_date', new Date().toISOString());
        }

        const { data: challenges, error } = await query;

        if (error) throw error;

        // Enrich với participant count
        const enrichedChallenges = challenges?.map(c => ({
            ...c,
            participantCount: c.user_challenges?.[0]?.count || 0,
            user_challenges: undefined, // Remove raw data
        }));

        return NextResponse.json({
            success: true,
            challenges: enrichedChallenges,
        });

    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify admin
        if (!verifyAdminFromRequest(request)) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: CreateChallengeBody = await request.json();
        const {
            name,
            description,
            icon,
            type,
            requirementType,
            requirementValue,
            rewardPoints,
            rewardBadgeId,
            startDate,
            endDate,
            maxParticipants,
        } = body;

        // Validation
        if (!name || !description || !type || !requirementType || !requirementValue || !rewardPoints || !startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
            return NextResponse.json(
                { success: false, error: 'End date must be after start date' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        const { data: challenge, error } = await supabase
            .from('challenges')
            .insert({
                name,
                description,
                icon,
                type,
                requirement_type: requirementType,
                requirement_value: requirementValue,
                reward_points: rewardPoints,
                reward_badge_id: rewardBadgeId,
                start_date: startDate,
                end_date: endDate,
                max_participants: maxParticipants,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;

        // Audit log
        await supabase.from('audit_logs').insert({
            actor_type: 'admin',
            action: 'create_challenge',
            resource_type: 'challenges',
            resource_id: challenge.challenge_id,
            new_value: { name, type, requirementType, rewardPoints },
        });

        return NextResponse.json({
            success: true,
            challenge: {
                challengeId: challenge.challenge_id,
                name: challenge.name,
                type: challenge.type,
                startDate: challenge.start_date,
                endDate: challenge.end_date,
            },
            message: 'Challenge created successfully',
        });

    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
