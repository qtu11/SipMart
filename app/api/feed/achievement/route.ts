import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// POST - Create achievement post
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, achievementType, data } = body;

        if (!userId || !achievementType) {
            return NextResponse.json(
                { error: 'Missing userId or achievementType' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Get user info
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('display_name, email, green_points, rank_level, total_cups_saved')
            .eq('user_id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Generate achievement content based on type
        let caption = '';
        let achievementTitle = '';
        let greenPointsEarned = 10; // Base reward for achievement post

        switch (achievementType) {
            case 'rank_up':
                achievementTitle = `Thăng hạng ${data.newRank}! 🎉`;
                caption = `Mình vừa thăng hạng lên ${data.newRank}! ${data.totalCups} ly đã cứu, ${user.green_points} Green Points! 🌱 #SipMart #GreenLife`;
                greenPointsEarned = 20;
                break;

            case 'milestone_50':
                achievementTitle = '50 ly đầu tiên! 🎯';
                caption = `Cột mốc 50 ly! Mình đã cứu 50 ly nhựa khỏi môi trường. Cùng hành động vì Trái Đất xanh! 🌍 #SipMart #EcoWarrior`;
                greenPointsEarned = 15;
                break;

            case 'milestone_100':
                achievementTitle = '100 ly - Century Club! 💯';
                caption = `AMAZING! 100 ly đã cứu = 45kg nhựa không rơi vào đại dương! Tự hào quá! 🐋 #SipMart #OceanHero`;
                greenPointsEarned = 25;
                break;

            case 'milestone_500':
                achievementTitle = '500 ly - Eco Legend! 🏆';
                caption = `WOW! 500 ly = 225kg nhựa đã giảm! Đây là sức mạnh của hành động nhỏ! 💪 #SipMart #GreenLegend`;
                greenPointsEarned = 50;
                break;

            case 'first_friend':
                achievementTitle = 'Kết bạn đầu tiên! 👥';
                caption = `Vừa có người bạn đầu tiên trên SipMart! Cùng nhau sống xanh nào! 🤝 #SipMart #GreenFriends`;
                greenPointsEarned = 10;
                break;

            default:
                achievementTitle = 'Thành tựu mới! ✨';
                caption = `Vừa đạt thành tựu mới trên SipMart! 🎉 #SipMart`;
        }

        // Create achievement post
        const { data: post, error: postError } = await supabase
            .from('green_feed_posts')
            .insert({
                user_id: userId,
                image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(achievementTitle)}&background=22c55e&color=fff&size=800`,
                caption,
                green_points_earned: greenPointsEarned,
                post_type: 'achievement',
                achievement_type: achievementType,
            })
            .select()
            .single();

        if (postError) {
            logger.error('Error creating achievement post', { error: postError });
            return NextResponse.json(
                { error: 'Failed to create post' },
                { status: 500 }
            );
        }

        // Award green points for posting achievement
        await supabase
            .from('users')
            .update({
                green_points: user.green_points + greenPointsEarned,
            })
            .eq('user_id', userId);

        logger.info('Achievement post created', {
            userId,
            achievementType,
            postId: post.post_id,
        });

        return NextResponse.json({
            success: true,
            post,
            pointsEarned: greenPointsEarned,
        });
    } catch (error: any) {
        logger.error('Achievement post error', { error });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
