import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * PUT /api/admin/stores/[storeId]
 * Update store information (admin only)
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const email = req.headers.get('x-admin-email');
        const password = req.headers.get('x-admin-password');

        // Admin validation
        if (!email || !isAdminEmail(email)) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, address, gpsLat, gpsLng, partnerStatus } = body;

        // Validation
        if (!name || !address) {
            return NextResponse.json(
                { error: 'Missing required fields: name, address' },
                { status: 400 }
            );
        }

        const lat = parseFloat(gpsLat);
        const lng = parseFloat(gpsLng);

        if (isNaN(lat) || isNaN(lng)) {
            return NextResponse.json(
                { error: 'Invalid GPS coordinates' },
                { status: 400 }
            );
        }

        // Update store
        const { data, error } = await supabase
            .from('stores')
            .update({
                name,
                address,
                gps_lat: lat,
                gps_lng: lng,
                partner_status: partnerStatus || 'active'
            })
            .eq('store_id', params.storeId)
            .select()
            .single();

        if (error) {
            logger.error('Failed to update store', { error, storeId: params.storeId });
            throw error;
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        logger.info('Store updated successfully', {
            storeId: params.storeId,
            updatedBy: email
        });

        return NextResponse.json({
            success: true,
            store: data
        });

    } catch (error: any) {
        logger.error('Store update API error', { error });
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/stores/[storeId]
 * Soft delete (archive) a store (admin only)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { storeId: string } }
) {
    try {
        const email = req.headers.get('x-admin-email');

        if (!email || !isAdminEmail(email)) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        // Soft delete by setting partner_status to 'archived'
        const { error } = await supabase
            .from('stores')
            .update({
                partner_status: 'archived'
            })
            .eq('store_id', params.storeId);

        if (error) {
            logger.error('Failed to archive store', { error, storeId: params.storeId });
            throw error;
        }

        logger.info('Store archived successfully', {
            storeId: params.storeId,
            archivedBy: email
        });

        return NextResponse.json({
            success: true,
            message: 'Store archived successfully'
        });

    } catch (error: any) {
        logger.error('Store delete API error', { error });
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
