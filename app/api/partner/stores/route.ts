import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: List stores/branches owned/managed by the current partner user
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const supabase = getSupabaseAdmin();

        // Check if user can view all branches
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
                    address,
                    cup_available,
                    cup_in_use,
                    cup_cleaning,
                    cup_total,
                    partner_status
                )
            `)
            .eq('partner_id', authResult.partnerId);

        // Staff can only see their assigned branch
        if (!canViewAll && authResult.branchId) {
            query = query.eq('branch_id', authResult.branchId);
        }

        const { data: branches, error } = await query.order('name');

        if (error) {
            logger.error('Partner Stores GET Error', error);
            return errorResponse('Không thể lấy danh sách cửa hàng', 500);
        }

        // Transform data
        const stores = branches?.map((b: any) => ({
            branchId: b.branch_id,
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
            inventory: {
                capacity: b.cup_capacity,
                cleanCups: b.current_clean_cups,
                dirtyCups: b.current_dirty_cups,
                available: b.store?.cup_available || 0,
                inUse: b.store?.cup_in_use || 0,
                cleaning: b.store?.cup_cleaning || 0,
                total: b.store?.cup_total || 0
            },
            acceptsBorrow: b.accepts_borrow,
            acceptsReturn: b.accepts_return,
            isActive: b.is_active,
            storeId: b.store?.store_id,
            partnerStatus: b.store?.partner_status,
            createdAt: b.created_at
        })) || [];

        return jsonResponse({ stores, total: stores.length });

    } catch (error: any) {
        logger.error('Partner Stores GET Error', error);
        return errorResponse('Internal Server Error', 500);
    }
}

// POST: Create a new branch (Owner only)
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        // Check permission
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
            acceptsReturn
        } = body;

        if (!name || !address) {
            return errorResponse('Tên và địa chỉ là bắt buộc', 400);
        }

        const supabase = getSupabaseAdmin();

        // Create branch and linked store in transaction
        // First create store
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

        // Then create branch linked to store
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
                cup_capacity: cupCapacity || 50,
                accepts_borrow: acceptsBorrow !== false,
                accepts_return: acceptsReturn !== false,
                is_active: true
            })
            .select()
            .single();

        if (branchError) {
            logger.error('Create branch error', branchError);
            // Rollback store creation
            await supabase.from('stores').delete().eq('store_id', newStore.store_id);
            return errorResponse('Không thể tạo chi nhánh', 500);
        }

        // Log activity
        await supabase.from('partner_activity_log').insert({
            partner_id: authResult.partnerId,
            user_id: authResult.userId,
            action: 'create_branch',
            entity_type: 'branch',
            entity_id: newBranch.branch_id,
            new_data: { name, address }
        });

        logger.info(`Partner branch created: ${name} by ${authResult.email}`);

        return jsonResponse({
            success: true,
            branch: {
                branchId: newBranch.branch_id,
                storeId: newStore.store_id,
                name: newBranch.name,
                address: newBranch.address
            }
        }, 'Tạo chi nhánh thành công');

    } catch (error: any) {
        logger.error('Partner Stores POST Error', error);
        return errorResponse(error.message, 500);
    }
}
