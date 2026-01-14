import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/profile/avatar - Upload avatar
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (user as any).id || (user as any).user_id;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only images (JPG, PNG, GIF, WEBP) are allowed.' },
                { status: 400 }
            );
        }

        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 2MB.' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/${userId}.${fileExt}`;

        // Delete old avatar if exists
        await supabase.storage.from('user-content').remove([fileName]);

        // Upload new avatar
        const { data, error } = await supabase.storage
            .from('user-content') // Create this bucket in Supabase
            .upload(fileName, file, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: true,
            });

        if (error) throw error;

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from('user-content').getPublicUrl(fileName);

        // Update user metadata
        await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
                avatar: publicUrl,
            },
        });

        // Also update users table
        await supabase
            .from('users')
            .update({ avatar: publicUrl })
            .eq('user_id', userId);

        return NextResponse.json({
            success: true,
            url: publicUrl,
        });
    } catch (error: any) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
