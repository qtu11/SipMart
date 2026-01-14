import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET: List all partner roles
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const { data: roles, error } = await supabase
            .from('partner_roles')
            .select(`
                role_id,
                name,
                code,
                description,
                permissions,
                level
            `)
            .order('level', { ascending: false });

        if (error) {
            logger.error('Get roles error', error);
            return errorResponse('Không thể lấy danh sách vai trò', 500);
        }

        const transformedRoles = roles?.map(r => ({
            id: r.role_id,
            name: r.name,
            code: r.code,
            description: r.description,
            permissions: r.permissions,
            level: r.level
        })) || [];

        return jsonResponse({
            roles: transformedRoles,
            total: transformedRoles.length
        });

    } catch (error: any) {
        logger.error('Partner Roles Error', error);
        return errorResponse(error.message, 500);
    }
}
