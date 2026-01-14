export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { verifyPartnerAuth } from '@/lib/middleware/partnerAuth';
import { logger } from '@/lib/logger';

// GET: Get features available for current partner based on category
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyPartnerAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse();
        }

        const supabase = getSupabaseAdmin();

        // Get partner's category
        const { data: partner, error } = await supabase
            .from('partners_v2')
            .select(`
                partner_id,
                name,
                category_id,
                partner_categories (
                    cat_id,
                    name,
                    code,
                    icon,
                    features_config
                )
            `)
            .eq('partner_id', authResult.partnerId)
            .single();

        if (error || !partner) {
            return errorResponse('Không tìm thấy thông tin đối tác', 404);
        }

        const category = partner.partner_categories as any;
        if (!category) {
            return errorResponse('Đối tác chưa được phân loại', 400);
        }

        const features = category.features_config || {};

        // Build feature list with descriptions
        const featureList = [
            {
                code: 'cleaning_queue',
                name: 'Hàng đợi vệ sinh',
                description: 'Quản lý ly bẩn và yêu cầu thu gom',
                enabled: features.cleaning_queue === true,
                category: 'operations'
            },
            {
                code: 'menu_management',
                name: 'Quản lý Menu xanh',
                description: 'Tạo combo ưu đãi khi dùng ly SipSmart',
                enabled: features.menu_management === true,
                category: 'marketing'
            },
            {
                code: 'loss_report',
                name: 'Báo cáo thất thoát',
                description: 'Theo dõi tỉ lệ ly không được trả',
                enabled: features.loss_report === true,
                category: 'analytics'
            },
            {
                code: 'service_fee_config',
                name: 'Cấu hình phí phục vụ',
                description: 'Thiết lập phí rửa ly riêng cho quán',
                enabled: features.service_fee_config === true,
                category: 'operations'
            },
            {
                code: 'combo_green_menu',
                name: 'Combo xanh',
                description: 'Tạo combo giảm giá khi dùng ly mượn',
                enabled: features.combo_green_menu === true,
                category: 'marketing'
            },
            {
                code: 'mobile_hub',
                name: 'Trạm di động',
                description: 'Giao diện nhanh cho tài xế mượn/trả ly',
                enabled: features.mobile_hub === true,
                category: 'transport'
            },
            {
                code: 'route_map',
                name: 'Bản đồ luân chuyển',
                description: 'Xem lộ trình ly di chuyển giữa các điểm',
                enabled: features.route_map === true,
                category: 'transport'
            },
            {
                code: 'ticket_integration',
                name: 'Tích hợp vé xe',
                description: 'Liên kết với hệ thống vé giao thông',
                enabled: features.ticket_integration === true,
                category: 'transport'
            },
            {
                code: 'container_tracking',
                name: 'Theo dõi thùng chứa',
                description: 'Quản lý thùng chứa ly trên phương tiện',
                enabled: features.container_tracking === true,
                category: 'transport'
            },
            {
                code: 'eco_exchange',
                name: 'Đổi điểm thưởng',
                description: 'Cho phép khách đổi điểm xanh lấy voucher',
                enabled: features.eco_exchange === true,
                category: 'rewards'
            },
            {
                code: 'lead_generation',
                name: 'Thu thập Lead',
                description: 'Tiếp cận khách hàng tiềm năng qua hệ thống',
                enabled: features.lead_generation === true,
                category: 'marketing'
            },
            {
                code: 'iot_integration',
                name: 'Tích hợp IoT',
                description: 'Kết nối với thiết bị thông minh',
                enabled: features.iot_integration === true,
                category: 'tech'
            },
            {
                code: 'drive_thru_return',
                name: 'Trả ly Drive-thru',
                description: 'Trả ly nhanh không cần xuống xe',
                enabled: features.drive_thru_return === true,
                category: 'energy'
            },
            {
                code: 'esg_report',
                name: 'Báo cáo ESG',
                description: 'Báo cáo môi trường - xã hội - quản trị',
                enabled: features.esg_report === true,
                category: 'analytics'
            },
            {
                code: 'camera_ai',
                name: 'Camera AI',
                description: 'Nhận diện ly tự động bằng camera',
                enabled: features.camera_ai === true,
                category: 'tech'
            }
        ];

        // Group by category
        const groupedFeatures = {
            operations: featureList.filter(f => f.category === 'operations'),
            marketing: featureList.filter(f => f.category === 'marketing'),
            analytics: featureList.filter(f => f.category === 'analytics'),
            transport: featureList.filter(f => f.category === 'transport'),
            rewards: featureList.filter(f => f.category === 'rewards'),
            tech: featureList.filter(f => f.category === 'tech'),
            energy: featureList.filter(f => f.category === 'energy')
        };

        return jsonResponse({
            partner: {
                id: partner.partner_id,
                name: partner.name
            },
            category: {
                id: category.cat_id,
                name: category.name,
                code: category.code,
                icon: category.icon
            },
            features: featureList.filter(f => f.enabled),
            allFeatures: featureList,
            groupedFeatures,
            rawConfig: features
        });

    } catch (error: any) {
        logger.error('Partner Features Error', error);
        return errorResponse(error.message, 500);
    }
}
