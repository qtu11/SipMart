import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/messaging/presence - Lấy trạng thái online/offline của users
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userIds = searchParams.get('userIds')?.split(',') || [];

        if (userIds.length === 0) {
            return NextResponse.json(
                { error: 'Missing userIds' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: presence, error } = await supabase
            .from('user_presence')
            .select('*')
            .in('user_id', userIds);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            presence: presence || [],
        });
    } catch (error: any) {
        console.error('Error fetching presence:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/messaging/presence - Update trạng thái online/offline
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            // Silently fail for unauthenticated users (they're just browsing)
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 200 });
        }

        const userId = (user as any).id || (user as any).user_id;
        const body = await request.json();
        const { status = 'online' } = body; // online, offline, away, busy

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Upsert presence
        const { error } = await supabase.from('user_presence').upsert(
            {
                user_id: userId,
                status,
                last_seen_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating presence:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
