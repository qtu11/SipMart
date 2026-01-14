import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: List branches
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'branches', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();
        const canViewAll = authResult.permissions?.dashboard?.view_all_branches === true;

        let query = supabase
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
                    cup_available,
                    cup_in_use,
                    cup_total,
                    partner_status
                )
            `)
            .eq('partner_id', authResult.partnerId);

        if (!canViewAll && authResult.branchId) {
            query = query.eq('branch_id', authResult.branchId);
        }

        const { data: branches, error } = await query.order('name');

        if (error) {
            logger.error('Get branches error', error);
            return errorResponse('Không thể lấy danh sách chi nhánh', 500);
        }

        const transformedBranches = branches?.map(b => ({
            id: b.branch_id,
            name: b.name,
            code: b.code,
            address: b.address,
            phone: b.phone,
            managerName: b.manager_name,
            location: {
                lat: b.latitude,
                lng: b.longitude
            },
            operatingHours: b.operating_hours,
            config: b.config,
            inventory: {
                capacity: b.cup_capacity,
                cleanCups: b.current_clean_cups,
                dirtyCups: b.current_dirty_cups,
                available: (b.store as any)?.cup_available || 0,
                inUse: (b.store as any)?.cup_in_use || 0,
                total: (b.store as any)?.cup_total || 0
            },
            acceptsBorrow: b.accepts_borrow,
            acceptsReturn: b.accepts_return,
            isActive: b.is_active,
            storeId: (b.store as any)?.store_id,
            partnerStatus: (b.store as any)?.partner_status,
            createdAt: b.created_at
        })) || [];

        return jsonResponse({
            branches: transformedBranches,
            total: transformedBranches.length
        });

    } catch (error: any) {
        logger.error('Partner Branches GET Error', error);
        return errorResponse(error.message, 500);
    }
}

// POST: Create new branch (Owner only)
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'branches', 'create');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
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
            config
        } = body;

        if (!name || !address) {
            return errorResponse('Tên và địa chỉ là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Create store first
        const { data: newStore, error: storeError } = await supabase
            .from('stores')
            .insert({
                name,
                address,
                gps_lat: lat || 0,
                gps_lng: lng || 0,
                partner_status: 'pending',
                cup_available: 0,
                cup_total: 0
            })
            .select()
            .single();

        if (storeError) {
            logger.error('Create store error', storeError);
            return errorResponse('Không thể tạo cửa hàng', 500);
        }

        // Create branch
        const { data: newBranch, error: branchError } = await supabase
            .from('partner_branches')
            .insert({
                partner_id: authResult.partnerId,
                store_id: newStore.store_id,
                name,
                code: code || null,
                address,
                phone: phone || null,
                manager_name: managerName || null,
                latitude: lat || null,
                longitude: lng || null,
                operating_hours: operatingHours || null,
                config: config || {},
                cup_capacity: cupCapacity || 50,
                current_clean_cups: 0,
                current_dirty_cups: 0,
                accepts_borrow: acceptsBorrow !== false,
                accepts_return: acceptsReturn !== false,
                is_active: true
            })
            .select()
            .single();

        if (branchError) {
            // Rollback store
            await supabase.from('stores').delete().eq('store_id', newStore.store_id);
            logger.error('Create branch error', branchError);
            return errorResponse('Không thể tạo chi nhánh', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'create_branch',
            entity_type: 'branch',
            entity_id: newBranch.branch_id,
            new_data: { name, address, code }
        });

        logger.info(`Branch created: ${name} by ${authResult.email}`);

        return jsonResponse({
            success: true,
            branch: {
                id: newBranch.branch_id,
                storeId: newStore.store_id,
                name: newBranch.name,
                address: newBranch.address
            }
        }, 'Tạo chi nhánh thành công');

    } catch (error: any) {
        logger.error('Partner Branches POST Error', error);
        return errorResponse(error.message, 500);
    }
}
