import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get branch detail
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'branches', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        const { data: branch, error } = await supabase
            .from('partner_branches')
            .select(`
                branch_id,
                name,
                code,
                address,
                phone,
                manager_name,
                latitude,
                longitude,
                operating_hours,
                config,
                cup_capacity,
                current_clean_cups,
                current_dirty_cups,
                accepts_borrow,
                accepts_return,
                is_active,
                created_at,
                store:stores (
                    store_id,
                    name,
                    cup_available,
                    cup_in_use,
                    cup_cleaning,
                    cup_total,
                    partner_status
                )
            `)
            .eq('branch_id', id)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (error || !branch) {
            return errorResponse('Không tìm thấy chi nhánh', 404);
        }

        const store = branch.store as any;

        return jsonResponse({
            id: branch.branch_id,
            name: branch.name,
            code: branch.code,
            address: branch.address,
            phone: branch.phone,
            managerName: branch.manager_name,
            location: {
                lat: branch.latitude,
                lng: branch.longitude
            },
            operatingHours: branch.operating_hours,
            config: branch.config,
            inventory: {
                capacity: branch.cup_capacity,
                cleanCups: branch.current_clean_cups,
                dirtyCups: branch.current_dirty_cups,
                available: store?.cup_available || 0,
                inUse: store?.cup_in_use || 0,
                cleaning: store?.cup_cleaning || 0,
                total: store?.cup_total || 0
            },
            acceptsBorrow: branch.accepts_borrow,
            acceptsReturn: branch.accepts_return,
            isActive: branch.is_active,
            storeId: store?.store_id,
            partnerStatus: store?.partner_status,
            createdAt: branch.created_at
        });

    } catch (error: any) {
        logger.error('Partner Branch GET Error', error);
        return errorResponse(error.message, 500);
    }
}

// PATCH: Update branch
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'branches', 'update');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        // Check branch exists
        const { data: existing } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id')
            .eq('branch_id', id)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (!existing) {
            return errorResponse('Không tìm thấy chi nhánh', 404);
        }

        const body = await request.json();
        const {
            name,
            code,
            address,
            phone,
            managerName,
            lat,
            lng,
            operatingHours,
            cupCapacity,
            acceptsBorrow,
            acceptsReturn,
            isActive,
            config
        } = body;

        const updateData: any = {};

        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code;
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (managerName !== undefined) updateData.manager_name = managerName;
        if (lat !== undefined) updateData.latitude = lat;
        if (lng !== undefined) updateData.longitude = lng;
        if (operatingHours !== undefined) updateData.operating_hours = operatingHours;
        if (cupCapacity !== undefined) updateData.cup_capacity = cupCapacity;
        if (acceptsBorrow !== undefined) updateData.accepts_borrow = acceptsBorrow;
        if (acceptsReturn !== undefined) updateData.accepts_return = acceptsReturn;
        if (isActive !== undefined) updateData.is_active = isActive;
        if (config !== undefined) updateData.config = config;

        const { data: updated, error } = await supabase
            .from('partner_branches')
            .update(updateData)
            .eq('branch_id', id)
            .select()
            .single();

        if (error) {
            logger.error('Update branch error', error);
            return errorResponse('Không thể cập nhật chi nhánh', 500);
        }

        // Update linked store if name/address changed
        if (existing.store_id && (name || address || lat !== undefined || lng !== undefined)) {
            await supabase
                .from('stores')
                .update({
                    name: name || undefined,
                    address: address || undefined,
                    gps_lat: lat !== undefined ? lat : undefined,
                    gps_lng: lng !== undefined ? lng : undefined
                })
                .eq('store_id', existing.store_id);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            branch_id: id,
            action: 'update_branch',
            entity_type: 'branch',
            entity_id: id,
            new_data: updateData
        });

        return jsonResponse({
            success: true,
            branch: {
                id: updated.branch_id,
                name: updated.name,
                isActive: updated.is_active
            }
        }, 'Cập nhật thành công');

    } catch (error: any) {
        logger.error('Partner Branch PATCH Error', error);
        return errorResponse(error.message, 500);
    }
}

// DELETE: Deactivate branch (Owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'branches', 'delete');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        // Soft delete
        const { error } = await supabase
            .from('partner_branches')
            .update({ is_active: false })
            .eq('branch_id', id)
            .eq('partner_id', authResult.partnerId);

        if (error) {
            logger.error('Delete branch error', error);
            return errorResponse('Không thể xóa chi nhánh', 500);
        }

        // Update store status
        const { data: branch } = await supabase
            .from('partner_branches')
            .select('store_id')
            .eq('branch_id', id)
            .single();

        if (branch?.store_id) {
            await supabase
                .from('stores')
                .update({ partner_status: 'inactive' })
                .eq('store_id', branch.store_id);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'delete_branch',
            entity_type: 'branch',
            entity_id: id
        });

        return jsonResponse({ success: true }, 'Đã vô hiệu hóa chi nhánh');

    } catch (error: any) {
        logger.error('Partner Branch DELETE Error', error);
        return errorResponse(error.message, 500);
    }
}
