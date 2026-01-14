export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// GET - Search user by student ID
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Missing studentId parameter' }, { status: 400 });
        }

        // Security check: Verify user is authenticated
        const { verifyAuth } = await import('@/lib/middleware/auth');
        const authResult = await verifyAuth(req);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        const supabase = getSupabaseAdmin();

        // Search for user with matching student_id
        const { data: user, error } = await supabase
            .from('users')
            .select('user_id, display_name, email, student_id, avatar_url, green_points, rank_level')
            .eq('student_id', studentId)
            .single();

        if (error || !user) {
            logger.info('Student ID not found', { studentId });
            return NextResponse.json({
                success: false,
                message: 'Không tìm thấy sinh viên với mã số này'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                userId: user.user_id,
                displayName: user.display_name,
                email: user.email,
                studentId: user.student_id,
                avatarUrl: user.avatar_url,
                greenPoints: user.green_points,
                rankLevel: user.rank_level,
            },
        });
    } catch (error: any) {
        logger.error('Friend search error', { error });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
