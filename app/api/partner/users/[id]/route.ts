import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get single user detail
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'users', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        const { data: user, error } = await supabase
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
                updated_at,
                partner_roles (
                    role_id,
                    name,
                    code,
                    level,
                    permissions
                ),
                partner_branches (
                    branch_id,
                    name,
                    code,
                    address
                )
            `)
            .eq('user_id', id)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (error || !user) {
            return errorResponse('Không tìm thấy người dùng', 404);
        }

        const role = user.partner_roles as any;
        const branch = user.partner_branches as any;

        return jsonResponse({
            id: user.user_id,
            email: user.email,
            displayName: user.display_name,
            phone: user.phone,
            avatar: user.avatar_url,
            isActive: user.is_active,
            lastLogin: user.last_login,
            loginCount: user.login_count,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            role: role ? {
                id: role.role_id,
                name: role.name,
                code: role.code,
                level: role.level,
                permissions: role.permissions
            } : null,
            branch: branch ? {
                id: branch.branch_id,
                name: branch.name,
                code: branch.code,
                address: branch.address
            } : null
        });

    } catch (error: any) {
        logger.error('Partner User GET Error', error);
        return errorResponse(error.message, 500);
    }
}

// PATCH: Update user (Owner can update all, Manager can update staff only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'users', 'update');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        // Check target user exists and belongs to same partner
        const { data: targetUser, error: findError } = await supabase
            .from('partner_users')
            .select(`
                user_id,
                partner_roles (code, level)
            `)
            .eq('user_id', id)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (findError || !targetUser) {
            return errorResponse('Không tìm thấy người dùng', 404);
        }

        // Manager can only update staff
        const targetRole = targetUser.partner_roles as any;
        if (authResult.role === 'manager' && targetRole?.code !== 'staff') {
            return errorResponse('Bạn chỉ có thể chỉnh sửa nhân viên', 403);
        }

        const body = await request.json();
        const { displayName, phone, roleCode, branchId, isActive, password } = body;

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (displayName !== undefined) updateData.display_name = displayName;
        if (phone !== undefined) updateData.phone = phone;
        if (branchId !== undefined) updateData.branch_id = branchId;
        if (isActive !== undefined) updateData.is_active = isActive;

        // Only owner can change role
        if (roleCode && authResult.role === 'owner') {
            const { data: newRole } = await supabase
                .from('partner_roles')
                .select('role_id')
                .eq('code', roleCode)
                .single();
            if (newRole) {
                updateData.role_id = newRole.role_id;
            }
        }

        // Update password if provided
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const { data: updated, error: updateError } = await supabase
            .from('partner_users')
            .update(updateData)
            .eq('user_id', id)
            .select()
            .single();

        if (updateError) {
            logger.error('Update partner user error', updateError);
            return errorResponse('Không thể cập nhật người dùng', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'update_user',
            entity_type: 'partner_user',
            entity_id: id,
            new_data: { displayName, phone, roleCode, isActive }
        });

        return jsonResponse({
            success: true,
            user: {
                id: updated.user_id,
                displayName: updated.display_name,
                isActive: updated.is_active
            }
        }, 'Cập nhật thành công');

    } catch (error: any) {
        logger.error('Partner User PATCH Error', error);
        return errorResponse(error.message, 500);
    }
}

// DELETE: Deactivate user (Owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'users', 'delete');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        // Cannot delete yourself
        if (id === authResult.userId) {
            return errorResponse('Không thể xóa tài khoản của chính bạn', 400);
        }

        const supabase = getSupabaseAdmin();

        // Soft delete - just deactivate
        const { error } = await supabase
            .from('partner_users')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', id)
            .eq('partner_id', authResult.partnerId);

        if (error) {
            logger.error('Delete partner user error', error);
            return errorResponse('Không thể xóa người dùng', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'delete_user',
            entity_type: 'partner_user',
            entity_id: id
        });

        return jsonResponse({ success: true }, 'Đã vô hiệu hóa người dùng');

    } catch (error: any) {
        logger.error('Partner User DELETE Error', error);
        return errorResponse(error.message, 500);
    }
}
