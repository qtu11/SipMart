import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

// Verify admin access
async function verifyAdminAccess(supabase: any, userId: string) {
    const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (!admin || !['super_admin', 'store_admin'].includes(admin.role)) {
        throw new Error('Admin access required');
    }

    return admin;
}

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyAdminAccess(supabase, user.id);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pending';

        // Get eKYC verifications
        const { data: verifications, error } = await supabase
            .from('ekyc_verifications')
            .select(
                `
        verification_id,
        user_id,
        id_card_number,
        full_name,
        date_of_birth,
        verification_status,
        ai_match_score,
        front_image_url,
        back_image_url,
        face_image_url,
        created_at,
        users:user_id (
          email,
          display_name
        )
      `
            )
            .eq('verification_status', status)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            verifications: verifications || [],
            count: verifications?.length || 0,
        });
    } catch (error: any) {
        if (error.message === 'Admin access required') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Approve or reject eKYC
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyAdminAccess(supabase, user.id);

        const body = await req.json();
        const { verification_id, action, notes } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be approve or reject' },
                { status: 400 }
            );
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const verifiedAt = action === 'approve' ? new Date().toISOString() : null;
        const expiresAt =
            action === 'approve'
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                : null;

        // Update verification
        const { data: verification, error: updateError } = await supabase
            .from('ekyc_verifications')
            .update({
                verification_status: newStatus,
                admin_reviewed_by: user.id,
                admin_notes: notes,
                reviewed_at: new Date().toISOString(),
                verified_at: verifiedAt,
                expires_at: expiresAt,
            })
            .eq('verification_id', verification_id)
            .select('user_id')
            .single();

        if (updateError) {
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 }
            );
        }

        // Log action
        await supabase.from('ekyc_verification_logs').insert({
            verification_id,
            action: action === 'approve' ? 'admin_approved' : 'admin_rejected',
            actor_id: user.id,
            actor_type: 'admin',
            details: { notes },
        });

        // Send notification to user
        await supabase.from('notifications').insert({
            user_id: verification.user_id,
            type: action === 'approve' ? 'success' : 'warning',
            title:
                action === 'approve'
                    ? '✅ eKYC đã được phê duyệt!'
                    : '❌ eKYC không được phê duyệt',
            message:
                action === 'approve'
                    ? 'Bạn đã được xác thực và có thể thuê xe đạp điện.'
                    : `Lý do: ${notes || 'Thông tin không hợp lệ'}`,
        });

        return NextResponse.json({
            success: true,
            verification_id,
            status: newStatus,
            message: `eKYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
    } catch (error: any) {
        if (error.message === 'Admin access required') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
