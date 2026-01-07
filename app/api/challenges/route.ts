import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/middleware/auth';

/**
 * API User tham gia challenge
 * GET: Lấy challenges đang active
 * POST: Tham gia challenge
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Auth optional cho GET
    const authResult = await verifyAuth(request);
    const userId = authResult.userId;

    // Lấy challenges đang active
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .gt('end_date', new Date().toISOString())
      .order('end_date', { ascending: true });

    if (error) throw error;

    // Nếu user đăng nhập, lấy thêm progress
    let userProgress: Record<string, any> = {};
    if (userId) {
      const { data: progress } = await supabase
        .from('user_challenges')
        .select('challenge_id, progress, status, joined_at')
        .eq('user_id', userId);

      userProgress = (progress || []).reduce((acc, p) => {
        acc[p.challenge_id] = p;
        return acc;
      }, {} as Record<string, any>);
    }

    // Enrich challenges với user progress
    const enrichedChallenges = challenges?.map(c => ({
      challengeId: c.challenge_id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      type: c.type,
      requirementType: c.requirement_type,
      requirementValue: c.requirement_value,
      rewardPoints: c.reward_points,
      startDate: c.start_date,
      endDate: c.end_date,
      // User progress
      joined: !!userProgress[c.challenge_id],
      progress: userProgress[c.challenge_id]?.progress || 0,
      status: userProgress[c.challenge_id]?.status || 'not_joined',
      progressPercentage: userProgress[c.challenge_id]
        ? Math.min(100, Math.round((userProgress[c.challenge_id].progress / c.requirement_value) * 100))
        : 0,
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
    // Verify auth
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const body = await request.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Missing challengeId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check challenge exists và đang active
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('is_active', true)
      .gt('end_date', new Date().toISOString())
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found or not active' },
        { status: 404 }
      );
    }

    // Check max participants
    if (challenge.max_participants) {
      const { count } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId);

      if (count && count >= challenge.max_participants) {
        return NextResponse.json(
          { success: false, error: 'Challenge is full' },
          { status: 400 }
        );
      }
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already joined this challenge' },
        { status: 400 }
      );
    }

    // Join challenge
    const { data: userChallenge, error: joinError } = await supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        progress: 0,
        status: 'in_progress',
      })
      .select()
      .single();

    if (joinError) throw joinError;

    // Send notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'success',
      title: '🎯 Tham gia thử thách!',
      message: `Bạn đã tham gia "${challenge.name}". Hoàn thành để nhận ${challenge.reward_points} Green Points!`,
      url: '/challenges',
    });

    return NextResponse.json({
      success: true,
      data: {
        id: userChallenge.id,
        challengeId,
        status: 'in_progress',
      },
      message: `Đã tham gia thử thách "${challenge.name}"`,
    });

  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
