import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { getUser, updateUser } from '@/lib/supabase/users';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!file || !userId) {
            return NextResponse.json(
                { error: 'Missing file or userId' },
                { status: 400 }
            );
        }

        // Verify user exists
        const user = await getUser(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const supabase = getSupabaseAdmin();
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to avatars bucket
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload image' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        // Update user profile in DB
        await updateUser(userId, { avatar: publicUrl });

        // Sync to Auth Metadata to ensure consistency across session-based components
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
            userId,
            { user_metadata: { avatar_url: publicUrl } }
        );

        if (authUpdateError) {
            console.error('Failed to sync auth metadata:', authUpdateError);
            // Non-blocking error, we still succeeded with the file upload and DB update
        }

        return NextResponse.json({
            success: true,
            avatarUrl: publicUrl,
        });
    } catch (error) {
        console.error('Avatar upload API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
