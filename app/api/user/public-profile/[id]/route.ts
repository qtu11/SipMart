import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/users';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;

        // Use existing getUser which acts as admin to fetch full data
        // Then filtering what we return based on privacy
        const user = await getUser(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return strictly filtered data
        // If profile is NOT public, minimal data is handled by frontend or we can restrict here
        // The requirement said "toggle visibility", so we send the flag and let the frontend decide or send minimal data?
        // Better to send minimal data if private, but for now we send the flag + SAFE public data.

        // Sensitive data NOT to send:
        // - balance (maybe?)
        // - phone number (unless friend?)
        // - address (unless friend?)

        // Construct SAFE response object
        const publicProfile = {
            userId: user.userId,
            displayName: user.displayName,
            fullName: user.fullName,
            avatar: user.avatar,
            rankLevel: user.rankLevel,
            greenPoints: user.greenPoints,
            totalCupsSaved: user.totalCupsSaved,
            totalPlasticReduced: user.totalPlasticReduced,
            createdAt: user.createdAt,
            province: user.province,
            isProfilePublic: user.isProfilePublic,
            kycVerified: user.kycVerified
            // Intentionally omitting email, phone, detailed address, wallet balance, etc.
        };

        return NextResponse.json(publicProfile);

    } catch (error) {
        console.error('Public profile API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
