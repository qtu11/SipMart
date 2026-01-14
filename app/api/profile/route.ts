import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (user as any).id || (user as any).user_id;
        const body = await request.json();
        const {
            displayName,
            bio,
            isEmailPublic,
            isStudentIdPublic,
        } = body;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Update auth metadata
        if (displayName !== undefined) {
            const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
                user_metadata: {
                    displayName,
                },
            });
            if (authError) throw authError;
        }

        // Update users table
        const updateData: any = {};
        if (bio !== undefined) updateData.bio = bio;
        if (isEmailPublic !== undefined) updateData.is_email_public = isEmailPublic;
        if (isStudentIdPublic !== undefined) updateData.is_student_id_public = isStudentIdPublic;

        if (Object.keys(updateData).length > 0) {
            const { error: dbError } = await supabase
                .from('users')
                .update(updateData)
                .eq('user_id', userId);

            if (dbError) throw dbError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
