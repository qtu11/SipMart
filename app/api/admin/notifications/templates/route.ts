import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/notifications/templates
 * Get notification templates (Admin only)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Get auth token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        // Verify user with token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('user_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const { data: templates, error } = await supabase
            .from('notification_templates')
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            templates: templates || []
        });

    } catch (error: any) {
        console.error('GET /api/admin/notifications/templates error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/notifications/templates
 * Create notification template (Admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Check admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('user_id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, content_html, emoji, category, is_active = true } = body;

        // Validation
        if (!name || !content_html) {
            return NextResponse.json(
                { error: 'Missing required fields: name, content_html' },
                { status: 400 }
            );
        }

        const { data: template, error } = await supabase
            .from('notification_templates')
            .insert({
                name,
                description,
                content_html,
                emoji,
                category,
                is_active,
                created_by: admin.admin_id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            message: 'Template created successfully',
            template
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST /api/admin/notifications/templates error:', error);
        return NextResponse.json(
            { error: 'Failed to create template', details: error.message },
            { status: 500 }
        );
    }
}
