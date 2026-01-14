import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/middleware/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.userId;
        const { conversationId, isTyping } = await request.json();

        if (!conversationId) {
            return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: request.headers.get('Authorization')! },
            },
        });

        if (isTyping) {
            // Upsert typing indicator
            const { error } = await supabase
                .from('typing_indicators')
                .upsert(
                    { conversation_id: conversationId, user_id: userId, started_at: new Date().toISOString() },
                    { onConflict: 'conversation_id,user_id' }
                );
            if (error) throw error;
        } else {
            // Delete typing indicator
            const { error } = await supabase
                .from('typing_indicators')
                .delete()
                .match({ conversation_id: conversationId, user_id: userId });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Typing API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
