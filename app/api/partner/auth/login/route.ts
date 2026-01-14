import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'partner-portal-secret-key';
const JWT_EXPIRES_IN = '7d';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email và mật khẩu là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // 1. Tìm partner user
        const { data: user, error: userError } = await supabase
            .from('partner_users')
            .select(`
                user_id,
                partner_id,
                branch_id,
                email,
                password_hash,
                display_name,
                phone,
                avatar_url,
                is_active,
                login_count,
                role_id,
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
                    logo_url,
                    status,
                    category_id,
                    partner_categories (
                        cat_id,
                        name,
                        code,
                        features_config
                    )
                ),
                partner_branches (
                    branch_id,
                    name,
                    address,
                    is_active
                )
            `)
            .eq('email', email.toLowerCase())
            .single();

        if (userError || !user) {
            logger.warn(`Partner login failed - user not found: ${email}`);
            return errorResponse('Email hoặc mật khẩu không đúng', 401);
        }

        // 2. Kiểm tra active
        if (!user.is_active) {
            return errorResponse('Tài khoản đã bị vô hiệu hóa', 403);
        }

        // 3. Kiểm tra partner status
        const partner = user.partners_v2 as any;
        if (partner.status !== 'active') {
            return errorResponse('Đối tác chưa được kích hoạt hoặc đã bị tạm ngưng', 403);
        }

        // 4. Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            logger.warn(`Partner login failed - wrong password: ${email}`);
            return errorResponse('Email hoặc mật khẩu không đúng', 401);
        }

        // 5. Generate JWT token
        const role = user.partner_roles as any;
        const payload = {
            userId: user.user_id,
            partnerId: user.partner_id,
            branchId: user.branch_id,
            email: user.email,
            role: role.code,
            permissions: role.permissions,
            type: 'partner'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // 6. Update login count và last_login
        await supabase
            .from('partner_users')
            .update({
                login_count: (user.login_count || 0) + 1,
                last_login: new Date().toISOString()
            })
            .eq('user_id', user.user_id);

        // 7. Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: user.partner_id,
            user_id: user.user_id,
            branch_id: user.branch_id,
            action: 'login',
            entity_type: 'session',
            new_data: { ip: request.headers.get('x-forwarded-for') || 'unknown' },
            ip_address: request.headers.get('x-forwarded-for') || null,
            user_agent: request.headers.get('user-agent') || null
        });

        logger.info(`Partner login success: ${email}`);

        // 8. Response
        const branch = user.partner_branches as any;
        const category = partner.partner_categories as any;

        return jsonResponse({
            token,
            expiresIn: JWT_EXPIRES_IN,
            user: {
                id: user.user_id,
                email: user.email,
                displayName: user.display_name,
                phone: user.phone,
                avatar: user.avatar_url,
                role: {
                    id: role.role_id,
                    name: role.name,
                    code: role.code,
                    level: role.level
                },
                permissions: role.permissions
            },
            partner: {
                id: partner.partner_id,
                name: partner.name,
                logo: partner.logo_url,
                status: partner.status,
                category: category ? {
                    id: category.cat_id,
                    name: category.name,
                    code: category.code,
                    features: category.features_config
                } : null
            },
            branch: branch ? {
                id: branch.branch_id,
                name: branch.name,
                address: branch.address
            } : null
        }, 'Đăng nhập thành công');

    } catch (error: any) {
        logger.error('Partner Login Error', error);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}
