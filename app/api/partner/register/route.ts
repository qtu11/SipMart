import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        // User must be logged in to register as partner
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return unauthorizedResponse('Vui lòng đăng nhập để đăng ký đối tác');
        }

        const body = await request.json();
        const {
            // Partner info
            partnerName,
            legalName,
            taxCode,
            categoryCode,
            contactEmail,
            contactPhone,
            address,
            // First branch info
            branchName,
            branchAddress,
            branchPhone,
            branchLat,
            branchLng,
            // User info for partner portal
            displayName,
            password
        } = body;

        // Validate required fields
        if (!partnerName || !contactEmail || !contactPhone) {
            return errorResponse('Tên doanh nghiệp, email và số điện thoại là bắt buộc', 400);
        }

        if (!branchName || !branchAddress) {
            return errorResponse('Tên và địa chỉ chi nhánh đầu tiên là bắt buộc', 400);
        }

        if (!password || password.length < 6) {
            return errorResponse('Mật khẩu phải có ít nhất 6 ký tự', 400);
        }

        const supabase = getSupabaseAdmin();

        // Check if email already registered as partner
        const { data: existingPartner } = await supabase
            .from('partner_users')
            .select('user_id')
            .eq('email', contactEmail.toLowerCase())
            .single();

        if (existingPartner) {
            return errorResponse('Email đã được đăng ký làm đối tác', 400);
        }

        // Get category
        let categoryId = null;
        if (categoryCode) {
            const { data: category } = await supabase
                .from('partner_categories')
                .select('cat_id')
                .eq('code', categoryCode)
                .single();
            categoryId = category?.cat_id;
        }

        // Get owner role
        const { data: ownerRole } = await supabase
            .from('partner_roles')
            .select('role_id')
            .eq('code', 'owner')
            .single();

        if (!ownerRole) {
            return errorResponse('Lỗi cấu hình hệ thống: không tìm thấy role owner', 500);
        }

        // Start creating entities
        // 1. Create Partner
        const { data: newPartner, error: partnerError } = await supabase
            .from('partners_v2')
            .insert({
                name: partnerName,
                legal_name: legalName || partnerName,
                tax_code: taxCode || null,
                category_id: categoryId,
                contact_email: contactEmail.toLowerCase(),
                contact_phone: contactPhone,
                address: address || branchAddress,
                status: 'pending', // Needs admin approval
                settings: {},
                metadata: {
                    registered_from: 'partner_portal',
                    registered_by_user: authResult.userId
                }
            })
            .select()
            .single();

        if (partnerError) {
            logger.error('Create partner error', partnerError);
            return errorResponse('Không thể tạo đối tác', 500);
        }

        // 2. Create Store
        const { data: newStore, error: storeError } = await supabase
            .from('stores')
            .insert({
                name: branchName,
                address: branchAddress,
                gps_lat: branchLat || 0,
                gps_lng: branchLng || 0,
                partner_status: 'pending',
                cup_available: 0,
                cup_total: 0
            })
            .select()
            .single();

        if (storeError) {
            // Rollback partner
            await supabase.from('partners_v2').delete().eq('partner_id', newPartner.partner_id);
            logger.error('Create store error', storeError);
            return errorResponse('Không thể tạo cửa hàng', 500);
        }

        // 3. Create Branch
        const { data: newBranch, error: branchError } = await supabase
            .from('partner_branches')
            .insert({
                partner_id: newPartner.partner_id,
                store_id: newStore.store_id,
                name: branchName,
                address: branchAddress,
                phone: branchPhone || contactPhone,
                latitude: branchLat || null,
                longitude: branchLng || null,
                cup_capacity: 50,
                current_clean_cups: 0,
                current_dirty_cups: 0,
                accepts_borrow: true,
                accepts_return: true,
                is_active: true
            })
            .select()
            .single();

        if (branchError) {
            // Rollback
            await supabase.from('stores').delete().eq('store_id', newStore.store_id);
            await supabase.from('partners_v2').delete().eq('partner_id', newPartner.partner_id);
            logger.error('Create branch error', branchError);
            return errorResponse('Không thể tạo chi nhánh', 500);
        }

        // 4. Create Partner User (Owner)
        const passwordHash = await bcrypt.hash(password, 10);

        const { data: newUser, error: userError } = await supabase
            .from('partner_users')
            .insert({
                partner_id: newPartner.partner_id,
                branch_id: newBranch.branch_id,
                role_id: ownerRole.role_id,
                email: contactEmail.toLowerCase(),
                password_hash: passwordHash,
                display_name: displayName || partnerName,
                phone: contactPhone,
                is_active: true
            })
            .select()
            .single();

        if (userError) {
            // Rollback
            await supabase.from('partner_branches').delete().eq('branch_id', newBranch.branch_id);
            await supabase.from('stores').delete().eq('store_id', newStore.store_id);
            await supabase.from('partners_v2').delete().eq('partner_id', newPartner.partner_id);
            logger.error('Create partner user error', userError);
            return errorResponse('Không thể tạo tài khoản', 500);
        }

        // 5. Create Draft Contract
        await supabase.from('partner_contracts').insert({
            store_id: newStore.store_id,
            contract_type: 'hybrid',
            commission_rate: 5,
            fixed_fee: 0,
            handling_fee_per_scan: 200,
            plastic_saving_unit_price: 1500,
            start_date: new Date().toISOString().split('T')[0],
            status: 'draft'
        });

        // 6. Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: newPartner.partner_id,
            user_id: newUser.user_id,
            action: 'register_partner',
            entity_type: 'partner',
            entity_id: newPartner.partner_id,
            new_data: {
                partnerName,
                branchName,
                contactEmail,
                categoryCode
            }
        });

        // 7. Send notification to admin
        await supabase.from('system_notifications').insert({
            type: 'info',
            title: 'Đối tác mới đăng ký',
            message: `${partnerName} vừa đăng ký làm đối tác. Chi nhánh: ${branchName}`,
            target_audience: 'all',
            priority: 8,
            is_active: true
        });

        logger.info(`New partner registered: ${partnerName} (${contactEmail})`);

        return jsonResponse({
            success: true,
            partner: {
                id: newPartner.partner_id,
                name: newPartner.name,
                status: newPartner.status
            },
            branch: {
                id: newBranch.branch_id,
                name: newBranch.name
            },
            user: {
                id: newUser.user_id,
                email: newUser.email
            },
            message: 'Đăng ký thành công! Vui lòng chờ Admin duyệt tài khoản trong 1-2 ngày làm việc.'
        });

    } catch (error: any) {
        logger.error('Partner Register API Error', error);
        return errorResponse(error.message || 'Internal Server Error', 500);
    }
}
