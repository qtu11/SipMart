import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth, requirePermission } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get partner's contracts
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const permCheck = requirePermission(authResult, 'contracts', 'view');
        if (!permCheck.allowed) {
            return errorResponse(permCheck.error!, 403);
        }

        const supabase = getSupabaseAdmin();

        // Get partner's stores
        const { data: branches } = await supabase
            .from('partner_branches')
            .select('branch_id, store_id, name')
            .eq('partner_id', authResult.partnerId);

        const storeIds = branches?.map(b => b.store_id).filter(Boolean) || [];

        if (storeIds.length === 0) {
            return jsonResponse({ contracts: [], activeContract: null });
        }

        // Get all contracts
        const { data: contracts, error } = await supabase
            .from('partner_contracts')
            .select(`
                contract_id,
                store_id,
                contract_type,
                commission_rate,
                fixed_fee,
                handling_fee_per_scan,
                plastic_saving_unit_price,
                cup_rental_fee,
                min_monthly_transactions,
                start_date,
                end_date,
                document_url,
                status,
                created_at,
                updated_at,
                stores (name)
            `)
            .in('store_id', storeIds)
            .order('start_date', { ascending: false });

        if (error) {
            logger.error('Get contracts error', error);
            return errorResponse('Không thể lấy thông tin hợp đồng', 500);
        }

        // Find active contract
        const now = new Date();
        const activeContract = contracts?.find(c =>
            c.status === 'active' &&
            new Date(c.start_date) <= now &&
            (!c.end_date || new Date(c.end_date) >= now)
        );

        const transformedContracts = contracts?.map(c => ({
            id: c.contract_id,
            storeName: (c.stores as any)?.name,
            type: c.contract_type,
            commissionRate: c.commission_rate,
            fixedFee: c.fixed_fee,
            handlingFeePerScan: c.handling_fee_per_scan,
            plasticSavingUnitPrice: c.plastic_saving_unit_price,
            cupRentalFee: c.cup_rental_fee,
            minMonthlyTransactions: c.min_monthly_transactions,
            startDate: c.start_date,
            endDate: c.end_date,
            documentUrl: c.document_url,
            status: c.status,
            createdAt: c.created_at,
            isActive: c.contract_id === activeContract?.contract_id
        })) || [];

        return jsonResponse({
            contracts: transformedContracts,
            total: transformedContracts.length,
            activeContract: activeContract ? {
                id: activeContract.contract_id,
                type: activeContract.contract_type,
                commissionRate: activeContract.commission_rate,
                fixedFee: activeContract.fixed_fee,
                handlingFeePerScan: activeContract.handling_fee_per_scan,
                plasticSavingUnitPrice: activeContract.plastic_saving_unit_price,
                startDate: activeContract.start_date,
                endDate: activeContract.end_date,
                daysRemaining: activeContract.end_date
                    ? Math.ceil((new Date(activeContract.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : null
            } : null
        });

    } catch (error: any) {
        logger.error('Partner Contracts Error', error);
        return errorResponse(error.message, 500);
    }
}
