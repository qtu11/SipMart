import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { updateUser } from '@/lib/supabase/users';

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.authenticated || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Sanitize body? updateUser does partial updates.
        // We should explicitly map what we allow to update.
        // User interface logic handled in client, here we just pass allowed fields.

        const updateData: any = {};
        if (body.displayName !== undefined) updateData.displayName = body.displayName;
        if (body.fullName !== undefined) updateData.fullName = body.fullName;
        if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.province !== undefined) updateData.province = body.province;
        if (body.isProfilePublic !== undefined) updateData.isProfilePublic = body.isProfilePublic;

        // Perform update
        const updatedUser = await updateUser(auth.userId, updateData);

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
