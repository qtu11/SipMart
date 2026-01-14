import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/profile/[userId] - Get user profile
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const currentUser = await getCurrentUser();
        const userId = params.userId;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get user profile from auth.users metadata
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

        if (authError || !authUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get additional data from users table if exists
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Check if current user is friends with this user
        let isFriend = false;
        if (currentUser) {
            const currentUserId = (currentUser as any).id || (currentUser as any).user_id;
            const { data: friendship } = await supabase
                .from('friendships')
                .select('friendship_id')
                .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
                .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
                .single();

            isFriend = !!friendship;
        }

        const isOwnProfile = currentUser && ((currentUser as any).id === userId || (currentUser as any).user_id === userId);

        // Build profile response
        const profile = {
            userId: authUser.user.id,
            email: authUser.user.email,
            displayName: authUser.user.user_metadata?.displayName || userData?.display_name || authUser.user.email,
            avatar: authUser.user.user_metadata?.avatar || userData?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.user.email || 'User')}`,
            bio: userData?.bio || '',
            greenPoints: userData?.green_points || 0,
            rankLevel: userData?.rank_level || 'seed',
            totalCupsSaved: userData?.total_cups_saved || 0,
            totalPlasticReduced: userData?.total_plastic_reduced || 0,
            greenStreak: userData?.green_streak || 0,
            bestStreak: userData?.best_streak || 0,
            createdAt: authUser.user.created_at,

            // Privacy-controlled fields
            studentId: undefined as string | undefined,
            emailVisible: undefined as string | undefined,

            // Metadata
            isOwnProfile,
            isFriend,
        };

        // Apply privacy controls
        if (isOwnProfile) {
            // Show everything to self
            profile.studentId = userData?.student_id;
            profile.emailVisible = authUser.user.email;
        } else if (isFriend) {
            // Show to friends based on privacy settings
            if (userData?.is_student_id_public !== false) {
                profile.studentId = userData?.student_id;
            }
            if (userData?.is_email_public !== false) {
                profile.emailVisible = authUser.user.email;
            }
        } else {
            // Public view - only show if explicitly public
            if (userData?.is_student_id_public === true) {
                profile.studentId = userData?.student_id;
            }
            if (userData?.is_email_public === true) {
                profile.emailVisible = authUser.user.email;
            }
        }

        return NextResponse.json({
            success: true,
            profile,
        });
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
