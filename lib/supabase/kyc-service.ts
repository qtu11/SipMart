/**
 * KYC Service - Handle eKYC operations with Supabase
 */

import { getSupabaseAdmin } from './server';
import { processKycDocuments } from '../ocr-service';

export interface KycRecord {
    id: string;
    user_id: string;
    id_number: string | null;
    full_name: string | null;
    dob: string | null;
    gender: string | null;
    nationality: string | null;
    place_of_origin: string | null;
    place_of_residence: string | null;
    front_img_path: string | null;
    back_img_path: string | null;
    selfie_img_path: string | null;
    status: 'draft' | 'pending' | 'verified' | 'rejected';
    rejection_reason: string | null;
    ocr_front_data: any;
    ocr_back_data: any;
    ocr_confidence: number | null;
    submitted_at: string | null;
    verified_at: string | null;
    verified_by: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Get KYC status for a user
 */
export async function getKycStatus(userId: string): Promise<{
    status: 'none' | 'draft' | 'pending' | 'verified' | 'rejected';
    kyc?: KycRecord;
}> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('user_kyc')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return { status: 'none' };
    }

    return { status: data.status, kyc: data };
}

/**
 * Create or update KYC draft
 */
export async function saveKycDraft(
    userId: string,
    data: {
        front_img_path?: string;
        back_img_path?: string;
        selfie_img_path?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseAdmin();

    // Check if record exists
    const { data: existing } = await supabase
        .from('user_kyc')
        .select('id, status')
        .eq('user_id', userId)
        .single();

    if (existing) {
        // Can only update if draft or rejected
        if (!['draft', 'rejected'].includes(existing.status)) {
            return { success: false, error: 'Không thể cập nhật hồ sơ đã gửi' };
        }

        const { error } = await supabase
            .from('user_kyc')
            .update({
                ...data,
                status: 'draft',
                rejection_reason: null,
            })
            .eq('id', existing.id);

        if (error) {
            return { success: false, error: error.message };
        }
    } else {
        // Create new record
        const { error } = await supabase
            .from('user_kyc')
            .insert({
                user_id: userId,
                ...data,
                status: 'draft',
            });

        if (error) {
            return { success: false, error: error.message };
        }
    }

    return { success: true };
}

/**
 * Submit KYC for verification (triggers OCR processing)
 */
export async function submitKyc(
    userId: string,
    imagePaths: {
        front_img_path: string;
        back_img_path: string;
        selfie_img_path: string;
    }
): Promise<{
    success: boolean;
    error?: string;
    data?: any;
}> {
    const supabase = getSupabaseAdmin();

    // Get signed URLs for OCR processing
    const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        supabase.storage.from('kyc-documents').createSignedUrl(imagePaths.front_img_path, 300),
        supabase.storage.from('kyc-documents').createSignedUrl(imagePaths.back_img_path, 300),
        supabase.storage.from('kyc-documents').createSignedUrl(imagePaths.selfie_img_path, 300),
    ]);

    if (!frontUrl.data?.signedUrl || !backUrl.data?.signedUrl || !selfieUrl.data?.signedUrl) {
        return { success: false, error: 'Không thể tạo URL cho ảnh' };
    }

    // Process OCR
    const ocrResult = await processKycDocuments(
        frontUrl.data.signedUrl,
        backUrl.data.signedUrl,
        selfieUrl.data.signedUrl
    );

    if (!ocrResult.success) {
        return { success: false, error: ocrResult.error || 'OCR thất bại' };
    }

    // Prepare data for database
    const frontData = ocrResult.front.data;
    const updateData = {
        ...imagePaths,
        id_number: frontData?.id_number,
        full_name: frontData?.full_name,
        dob: frontData?.dob,
        gender: frontData?.gender,
        nationality: frontData?.nationality,
        place_of_origin: frontData?.place_of_origin,
        place_of_residence: frontData?.place_of_residence,
        ocr_front_data: ocrResult.front,
        ocr_back_data: ocrResult.back,
        ocr_confidence: ocrResult.front.confidence,
        status: 'pending',
        submitted_at: new Date().toISOString(),
    };

    // Check existing record
    const { data: existing } = await supabase
        .from('user_kyc')
        .select('id')
        .eq('user_id', userId)
        .single();

    let result;
    if (existing) {
        result = await supabase
            .from('user_kyc')
            .update(updateData)
            .eq('id', existing.id)
            .select()
            .single();
    } else {
        result = await supabase
            .from('user_kyc')
            .insert({ user_id: userId, ...updateData })
            .select()
            .single();
    }

    if (result.error) {
        return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
}

/**
 * Admin: Get all pending KYC requests
 */
export async function getPendingKyc(): Promise<KycRecord[]> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('user_kyc')
        .select('*')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });

    if (error) {
        console.error('Error fetching pending KYC:', error);
        return [];
    }

    return data || [];
}

/**
 * Admin: Get all KYC records with optional filter
 */
export async function getAllKyc(status?: string): Promise<KycRecord[]> {
    const supabase = getSupabaseAdmin();

    let query = supabase
        .from('user_kyc')
        .select('*')
        .order('updated_at', { ascending: false });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching KYC:', error);
        return [];
    }

    return data || [];
}

/**
 * Admin: Approve KYC
 */
export async function approveKyc(
    kycId: string,
    adminId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('user_kyc')
        .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            verified_by: adminId,
            rejection_reason: null,
        })
        .eq('id', kycId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Admin: Reject KYC
 */
export async function rejectKyc(
    kycId: string,
    adminId: string,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('user_kyc')
        .update({
            status: 'rejected',
            verified_at: new Date().toISOString(),
            verified_by: adminId,
            rejection_reason: reason,
        })
        .eq('id', kycId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Get signed URL for viewing KYC document
 */
export async function getKycDocumentUrl(
    path: string,
    expiresIn: number = 60
): Promise<string | null> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .storage
        .from('kyc-documents')
        .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
        return null;
    }

    return data.signedUrl;
}
