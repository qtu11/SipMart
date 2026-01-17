import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const uploadSchema = z.object({
    frontImage: z.string(), // Base64
    backImage: z.string(), // Base64  
    faceImage: z.string(), // Base64
    idCardNumber: z.string().min(9).max(12),
    fullName: z.string().min(3),
    dateOfBirth: z.string(), // YYYY-MM-DD
    address: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            );
        }

        // 2. Check if user already has eKYC
        const { data: existing } = await supabase
            .from('ekyc_verifications')
            .select('verification_id, verification_status')
            .eq('user_id', user.id)
            .single();

        if (existing && existing.verification_status === 'approved') {
            return NextResponse.json(
                { error: 'You are already verified.' },
                { status: 400 }
            );
        }

        if (existing && existing.verification_status === 'pending') {
            return NextResponse.json(
                { error: 'Your verification is pending review.' },
                { status: 400 }
            );
        }

        // 3. Parse and validate
        const body = await req.json();
        const validated = uploadSchema.parse(body);

        // 4. Upload images to Supabase Storage
        const bucketName = 'ekyc-documents';
        const userId = user.id;
        const timestamp = Date.now();

        // Convert base64 to Buffer
        const frontBuffer = Buffer.from(
            validated.frontImage.replace(/^data:image\/\w+;base64,/, ''),
            'base64'
        );
        const backBuffer = Buffer.from(
            validated.backImage.replace(/^data:image\/\w+;base64,/, ''),
            'base64'
        );
        const faceBuffer = Buffer.from(
            validated.faceImage.replace(/^data:image\/\w+;base64,/, ''),
            'base64'
        );

        // Upload files
        const frontPath = `${userId}/front_${timestamp}.jpg`;
        const backPath = `${userId}/back_${timestamp}.jpg`;
        const facePath = `${userId}/face_${timestamp}.jpg`;

        const [frontUpload, backUpload, faceUpload] = await Promise.all([
            supabase.storage.from(bucketName).upload(frontPath, frontBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            }),
            supabase.storage.from(bucketName).upload(backPath, backBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            }),
            supabase.storage.from(bucketName).upload(facePath, faceBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            }),
        ]);

        if (frontUpload.error || backUpload.error || faceUpload.error) {
            return NextResponse.json(
                { error: 'Failed to upload images' },
                { status: 500 }
            );
        }

        // 5. AI Verification (Mock - integrate with actual AI service)
        const aiMatchScore = await performAIVerification({
            frontImage: frontPath,
            faceImage: facePath,
        });

        // 6. Determine status (auto-approve if score >= 85)
        const verificationStatus = aiMatchScore >= 85 ? 'approved' : 'pending';
        const verifiedAt = aiMatchScore >= 85 ? new Date().toISOString() : null;
        const expiresAt =
            aiMatchScore >= 85
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
                : null;

        // 7. Create/Update eKYC record
        const ekycData = {
            user_id: userId,
            id_card_number: validated.idCardNumber,
            full_name: validated.fullName,
            date_of_birth: validated.dateOfBirth,
            address: validated.address || null,
            front_image_url: frontPath,
            back_image_url: backPath,
            face_image_url: facePath,
            ai_match_score: aiMatchScore,
            verification_status: verificationStatus,
            verified_at: verifiedAt,
            expires_at: expiresAt,
            ai_verification_data: {
                timestamp: new Date().toISOString(),
                score: aiMatchScore,
                method: 'mock_ai',
            },
        };

        const { data: verification, error: insertError } = existing
            ? await supabase
                .from('ekyc_verifications')
                .update(ekycData)
                .eq('verification_id', existing.verification_id)
                .select()
                .single()
            : await supabase
                .from('ekyc_verifications')
                .insert(ekycData)
                .select()
                .single();

        if (insertError) {
            console.error('eKYC insert error:', insertError);
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        // 8. Create verification log
        await supabase.from('ekyc_verification_logs').insert({
            verification_id: verification.verification_id,
            action: 'submitted',
            actor_id: userId,
            actor_type: 'user',
            details: {
                ai_score: aiMatchScore,
                auto_approved: verificationStatus === 'approved',
            },
        });

        // 9. If auto-approved, update user table (trigger will handle this)
        // The trigger 'trigger_update_user_ekyc' will automatically update users table

        return NextResponse.json({
            success: true,
            verification_id: verification.verification_id,
            status: verificationStatus,
            match_score: aiMatchScore,
            message:
                verificationStatus === 'approved'
                    ? '✅ Xác thực thành công! Bạn đã được phê duyệt tự động.'
                    : '⏳ Hồ sơ của bạn đang chờ xem xét. Chúng tôi sẽ phản hồi trong 24h.',
        });
    } catch (error: any) {
        console.error('eKYC upload error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Check eKYC status
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: verification } = await supabase
            .from('ekyc_verifications')
            .select('verification_id, verification_status, ai_match_score, verified_at, expires_at')
            .eq('user_id', user.id)
            .single();

        if (!verification) {
            return NextResponse.json({
                verified: false,
                message: 'No eKYC verification found',
            });
        }

        return NextResponse.json({
            verified: verification.verification_status === 'approved',
            status: verification.verification_status,
            match_score: verification.ai_match_score,
            verified_at: verification.verified_at,
            expires_at: verification.expires_at,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * AI Verification Response Structure
 */
interface AIVerificationResult {
    overallScore: number;           // 0-100 composite score
    faceSimilarity: number;         // 0-100 face match score
    ocrConfidence: number;          // 0-100 text extraction confidence
    livenessScore: number;          // 0-100 anti-spoofing score
    fraudFlags: string[];           // Array of detected issues
    extractedData: {
        idNumber: string;
        fullName: string;
        dateOfBirth: string;
        address: string;
        expiryDate: string;
    };
    processingTimeMs: number;
}

/**
 * AI Verification Function
 * In production, integrate with:
 * - VNPay eKYC API
 * - Google Cloud Vision API
 * - AWS Rekognition
 * - FPT.AI eKYC
 */
async function performAIVerification(params: {
    frontImage: string;
    faceImage: string;
    backImage?: string;
}): Promise<number> {
    const startTime = Date.now();

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate realistic verification scores
    const faceSimilarity = Math.floor(Math.random() * 15) + 85;  // 85-100
    const ocrConfidence = Math.floor(Math.random() * 10) + 90;   // 90-100
    const livenessScore = Math.floor(Math.random() * 12) + 88;   // 88-100

    // Detect potential fraud flags
    const fraudFlags: string[] = [];
    if (faceSimilarity < 90) fraudFlags.push('low_face_match');
    if (ocrConfidence < 92) fraudFlags.push('blurry_document');

    // Calculate composite score (weighted average)
    const overallScore = Math.floor(
        faceSimilarity * 0.5 +    // 50% weight on face match
        ocrConfidence * 0.3 +     // 30% weight on document quality
        livenessScore * 0.2       // 20% weight on liveness
    );

    const processingTimeMs = Date.now() - startTime;

    // Log AI verification result
    console.log('[eKYC AI]', JSON.stringify({
        overallScore,
        faceSimilarity,
        ocrConfidence,
        livenessScore,
        fraudFlags,
        processingTimeMs,
    }));

    // In production, store detailed result in ai_verification_data column
    // For now, return the overall score
    return overallScore;
}

/**
 * Validate ID card format (Vietnamese CCCD)
 */
function validateIdCardFormat(idNumber: string): boolean {
    // CCCD 12 digits, CMND 9 digits
    return /^\d{9}$|^\d{12}$/.test(idNumber);
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}
