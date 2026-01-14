import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const supabase = getSupabaseAdmin();

        // Log logout activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            branch_id: authResult.branchId,
            action: 'logout',
            entity_type: 'session',
            ip_address: request.headers.get('x-forwarded-for') || null,
            user_agent: request.headers.get('user-agent') || null
        });

        logger.info(`Partner logout: ${authResult.email}`);

        return jsonResponse({ success: true }, 'Đăng xuất thành công');

    } catch (error: any) {
        logger.error('Partner Logout Error', error);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}
