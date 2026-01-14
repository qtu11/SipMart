import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET: List all partner categories
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const { data: categories, error } = await supabase
            .from('partner_categories')
            .select(`
                cat_id,
                name,
                code,
                description,
                icon,
                features_config,
                is_active
            `)
            .eq('is_active', true)
            .order('name');

        if (error) {
            logger.error('Get categories error', error);
            return errorResponse('Không thể lấy danh sách phân loại', 500);
        }

        const transformedCategories = categories?.map(c => ({
            id: c.cat_id,
            name: c.name,
            code: c.code,
            description: c.description,
            icon: c.icon,
            features: c.features_config,
            isActive: c.is_active
        })) || [];

        return jsonResponse({
            categories: transformedCategories,
            total: transformedCategories.length
        });

    } catch (error: any) {
        logger.error('Partner Categories Error', error);
        return errorResponse(error.message, 500);
    }
}
