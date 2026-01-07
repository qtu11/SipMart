import { NextRequest, NextResponse } from 'next/server';
import { checkAdminApi } from '@/lib/supabase/admin';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        // 1. Verify Admin Auth
        if (!await checkAdminApi(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = params.userId;
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            displayName,
            walletBalance,
            greenPoints,
            rankLevel,
            totalCupsSaved,
            totalPlasticReduced
        } = body;

        // 2. Prepare update data
        const updateData: any = {};
        if (displayName !== undefined) updateData.display_name = displayName;
        if (walletBalance !== undefined) updateData.wallet_balance = walletBalance;
        if (greenPoints !== undefined) updateData.green_points = greenPoints;
        if (rankLevel !== undefined) updateData.rank_level = rankLevel;
        if (totalCupsSaved !== undefined) updateData.total_cups_saved = totalCupsSaved;
        if (totalPlasticReduced !== undefined) updateData.total_plastic_reduced = totalPlasticReduced;

        updateData.updated_at = new Date().toISOString();

        const supabase = (await import('@/lib/supabase/server')).getSupabaseAdmin();

        // 3. Update User
        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, user: data });
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
}
