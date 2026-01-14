import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const supabase = getSupabaseAdmin();

        // Fetch full user info
        const { data: user, error } = await supabase
            .from('partner_users')
            .select(`
                user_id,
                partner_id,
                branch_id,
                email,
                display_name,
                phone,
                avatar_url,
                is_active,
                last_login,
                login_count,
                created_at,
                partner_roles!inner (
                    role_id,
                    name,
                    code,
                    permissions,
                    level
                ),
                partners_v2!inner (
                    partner_id,
                    name,
                    legal_name,
                    logo_url,
                    status,
                    category_id,
                    contact_email,
                    contact_phone,
                    address,
                    settings,
                    partner_categories (
                        cat_id,
                        name,
                        code,
                        icon,
                        features_config
                    )
                ),
                partner_branches (
                    branch_id,
                    name,
                    code,
                    address,
                    phone,
                    latitude,
                    longitude,
                    operating_hours,
                    cup_capacity,
                    current_clean_cups,
                    current_dirty_cups,
                    accepts_borrow,
                    accepts_return,
                    is_active
                )
            `)
            .eq('user_id', authResult.userId)
            .single();

        if (error || !user) {
            logger.warn(`Partner user not found: ${authResult.userId}`);
            return errorResponse('Không tìm thấy thông tin người dùng', 404);
        }

        const role = user.partner_roles as any;
        const partner = user.partners_v2 as any;
        const branch = user.partner_branches as any;
        const category = partner.partner_categories as any;

        return jsonResponse({
            user: {
                id: user.user_id,
                email: user.email,
                displayName: user.display_name,
                phone: user.phone,
                avatar: user.avatar_url,
                isActive: user.is_active,
                lastLogin: user.last_login,
                loginCount: user.login_count,
                createdAt: user.created_at
            },
            role: {
                id: role.role_id,
                name: role.name,
                code: role.code,
                level: role.level,
                permissions: role.permissions
            },
            partner: {
                id: partner.partner_id,
                name: partner.name,
                legalName: partner.legal_name,
                logo: partner.logo_url,
                status: partner.status,
                contactEmail: partner.contact_email,
                contactPhone: partner.contact_phone,
                address: partner.address,
                settings: partner.settings
            },
            category: category ? {
                id: category.cat_id,
                name: category.name,
                code: category.code,
                icon: category.icon,
                features: category.features_config
            } : null,
            branch: branch ? {
                id: branch.branch_id,
                name: branch.name,
                code: branch.code,
                address: branch.address,
                phone: branch.phone,
                location: {
                    lat: branch.latitude,
                    lng: branch.longitude
                },
                operatingHours: branch.operating_hours,
                inventory: {
                    capacity: branch.cup_capacity,
                    cleanCups: branch.current_clean_cups,
                    dirtyCups: branch.current_dirty_cups
                },
                acceptsBorrow: branch.accepts_borrow,
                acceptsReturn: branch.accepts_return,
                isActive: branch.is_active
            } : null,
            permissions: role.permissions
        });

    } catch (error: any) {
        logger.error('Partner Me Error', error);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}
