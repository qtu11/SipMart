import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

// GET: List partner users (Owner/Manager only)
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'users', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branch_id');
        const status = searchParams.get('status'); // active, inactive, all

        let query = supabase
            .from('partner_users')
            .select(`
                user_id,
                email,
                display_name,
                phone,
                avatar_url,
                is_active,
                last_login,
                login_count,
                created_at,
                partner_roles (
                    role_id,
                    name,
                    code,
                    level
                ),
                partner_branches (
                    branch_id,
                    name,
                    code
                )
            `)
            .eq('partner_id', authResult.partnerId);

        // Manager can only see users in their branch
        if (authResult.role === 'manager' && authResult.branchId) {
            query = query.eq('branch_id', authResult.branchId);
        } else if (branchId) {
            query = query.eq('branch_id', branchId);
        }

        if (status === 'active') {
            query = query.eq('is_active', true);
        } else if (status === 'inactive') {
            query = query.eq('is_active', false);
        }

        const { data: users, error } = await query.order('created_at', { ascending: false });

        if (error) {
            logger.error('Get partner users error', error);
            return errorResponse('Không thể lấy danh sách nhân viên', 500);
        }

        const transformedUsers = users?.map(u => ({
            id: u.user_id,
            email: u.email,
            displayName: u.display_name,
            phone: u.phone,
            avatar: u.avatar_url,
            isActive: u.is_active,
            lastLogin: u.last_login,
            loginCount: u.login_count,
            createdAt: u.created_at,
            role: u.partner_roles ? {
                id: (u.partner_roles as any).role_id,
                name: (u.partner_roles as any).name,
                code: (u.partner_roles as any).code,
                level: (u.partner_roles as any).level
            } : null,
            branch: u.partner_branches ? {
                id: (u.partner_branches as any).branch_id,
                name: (u.partner_branches as any).name,
                code: (u.partner_branches as any).code
            } : null
        })) || [];

        return jsonResponse({
            users: transformedUsers,
            total: transformedUsers.length
        });

    } catch (error: any) {
        logger.error('Partner Users GET Error', error);
        return errorResponse(error.message, 500);
    }
}

// POST: Create new partner user (Owner only, or Manager for staff)
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'users', 'create');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const body = await request.json();
        const { email, password, displayName, phone, roleCode, branchId } = body;

        if (!email || !password || !displayName || !roleCode) {
            return errorResponse('Email, mật khẩu, tên và role là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Check email exists
        const { data: existingUser } = await supabase
            .from('partner_users')
            .select('user_id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            return errorResponse('Email đã được sử dụng', 400);
        }

        // Get role
        const { data: role, error: roleError } = await supabase
            .from('partner_roles')
            .select('role_id, code, level')
            .eq('code', roleCode)
            .single();

        if (roleError || !role) {
            return errorResponse('Role không hợp lệ', 400);
        }

        // Manager can only create staff
        if (authResult.role === 'manager' && role.code !== 'staff') {
            return errorResponse('Bạn chỉ có thể tạo tài khoản nhân viên', 403);
        }

        // Manager must assign to their branch
        const assignedBranchId = authResult.role === 'manager' ? authResult.branchId : branchId;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const { data: newUser, error: createError } = await supabase
            .from('partner_users')
            .insert({
                partner_id: authResult.partnerId,
                branch_id: assignedBranchId || null,
                role_id: role.role_id,
                email: email.toLowerCase(),
                password_hash: passwordHash,
                display_name: displayName,
                phone: phone || null,
                is_active: true,
                created_by: authResult.userId
            })
            .select()
            .single();

        if (createError) {
            logger.error('Create partner user error', createError);
            return errorResponse('Không thể tạo người dùng', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'create_user',
            entity_type: 'partner_user',
            entity_id: newUser.user_id,
            new_data: { email, displayName, roleCode }
        });

        logger.info(`Partner user created: ${email} by ${authResult.email}`);

        return jsonResponse({
            success: true,
            user: {
                id: newUser.user_id,
                email: newUser.email,
                displayName: newUser.display_name
            }
        }, 'Tạo người dùng thành công');

    } catch (error: any) {
        logger.error('Partner Users POST Error', error);
        return errorResponse(error.message, 500);
    }
}
