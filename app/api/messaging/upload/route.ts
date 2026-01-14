import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/middleware/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/messaging/upload - Upload ảnh/file cho chat
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.userId;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('Upload error: No file in formData. FormData keys:', Array.from(formData.keys()));
            return NextResponse.json({
                success: false,
                error: 'No file provided',
                details: 'File field is missing from FormData'
            }, { status: 400 });
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only images are allowed.' },
                { status: 400 }
            );
        }

        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('chat-media') // Bucket name - cần tạo bucket này trong Supabase
            .upload(fileName, file, {
                contentType: file.type,
                cacheControl: '3600',
            });

        if (error) throw error;

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from('chat-media').getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
        });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
