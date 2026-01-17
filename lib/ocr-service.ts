/**
 * Mock OCR Service
 * Simulates FPT.AI / VNPT OCR API for extracting info from CCCD images
 */

// Types
export interface OcrResult {
    success: boolean;
    data?: {
        id_number: string;
        full_name: string;
        dob: string;
        gender: string;
        nationality: string;
        place_of_origin: string;
        place_of_residence: string;
        expiry_date?: string;
    };
    confidence: number;
    error?: string;
}

export interface OcrBackResult {
    success: boolean;
    data?: {
        issue_date: string;
        issue_place: string;
        personal_identification?: string;
    };
    confidence: number;
    error?: string;
}

// Vietnamese name components for random generation
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
const middleNames = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Quốc', 'Thanh', 'Ngọc', 'Kim', 'Hoàng'];
const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Hùng', 'Khoa', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tú', 'Tuấn', 'Việt'];

const provinces = [
    'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Bình Dương', 'Đồng Nai', 'Thanh Hóa', 'Nghệ An', 'Thái Bình'
];

const districts = ['Quận 1', 'Quận 3', 'Quận 7', 'Quận Tân Bình', 'Huyện Bình Chánh', 'Quận Ba Đình', 'Quận Cầu Giấy'];

/**
 * Generate random Vietnamese CCCD number (12 digits)
 */
function generateCCCD(): string {
    const provinceCode = Math.floor(Math.random() * 96).toString().padStart(3, '0');
    const genderCentury = Math.floor(Math.random() * 4).toString(); // 0-3
    const birthYear = (90 + Math.floor(Math.random() * 10)).toString(); // 90-99
    const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return provinceCode + genderCentury + birthYear + randomSuffix;
}

/**
 * Generate random Vietnamese name
 */
function generateName(): string {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const middle = middleNames[Math.floor(Math.random() * middleNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${middle} ${last}`;
}

/**
 * Generate random date of birth (18-60 years old)
 */
function generateDob(): string {
    const year = 1964 + Math.floor(Math.random() * 42); // 1964-2006
    const month = (1 + Math.floor(Math.random() * 12)).toString().padStart(2, '0');
    const day = (1 + Math.floor(Math.random() * 28)).toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Generate random address
 */
function generateAddress(): string {
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const street = Math.floor(Math.random() * 500) + 1;
    return `Số ${street}, ${district}, ${province}`;
}

/**
 * Mock OCR for FRONT of CCCD
 */
export async function mockOcrFront(imageUrl: string): Promise<OcrResult> {
    // Simulate API delay (1.5-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

    // 95% success rate
    if (Math.random() < 0.05) {
        return {
            success: false,
            confidence: 0,
            error: 'Không thể nhận diện được ảnh. Vui lòng chụp lại rõ hơn.',
        };
    }

    const gender = Math.random() > 0.5 ? 'Nam' : 'Nữ';
    const province = provinces[Math.floor(Math.random() * provinces.length)];

    return {
        success: true,
        confidence: 85 + Math.random() * 14, // 85-99%
        data: {
            id_number: generateCCCD(),
            full_name: generateName().toUpperCase(),
            dob: generateDob(),
            gender,
            nationality: 'Việt Nam',
            place_of_origin: province,
            place_of_residence: generateAddress(),
        },
    };
}

/**
 * Mock OCR for BACK of CCCD
 */
export async function mockOcrBack(imageUrl: string): Promise<OcrBackResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    if (Math.random() < 0.05) {
        return {
            success: false,
            confidence: 0,
            error: 'Không thể nhận diện được mặt sau CCCD.',
        };
    }

    const issueYear = 2020 + Math.floor(Math.random() * 5);
    const issueMonth = (1 + Math.floor(Math.random() * 12)).toString().padStart(2, '0');
    const issueDay = (1 + Math.floor(Math.random() * 28)).toString().padStart(2, '0');

    return {
        success: true,
        confidence: 80 + Math.random() * 18,
        data: {
            issue_date: `${issueYear}-${issueMonth}-${issueDay}`,
            issue_place: 'Cục Cảnh sát quản lý hành chính về trật tự xã hội',
            personal_identification: 'Vết sẹo: Không có',
        },
    };
}

/**
 * Mock Face Matching (Selfie vs ID Photo)
 * In real implementation, this would use AI face matching service
 */
export async function mockFaceMatch(selfieUrl: string, idPhotoUrl: string): Promise<{
    success: boolean;
    match_score: number;
    is_match: boolean;
    error?: string;
}> {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // 90% match rate for demo
    const matchScore = Math.random() * 100;
    const isMatch = matchScore > 60;

    return {
        success: true,
        match_score: Number(matchScore.toFixed(2)),
        is_match: isMatch,
        error: isMatch ? undefined : 'Khuôn mặt không khớp với ảnh CCCD',
    };
}

/**
 * Combined OCR processing
 */
export async function processKycDocuments(
    frontImageUrl: string,
    backImageUrl: string,
    selfieUrl: string
): Promise<{
    success: boolean;
    front: OcrResult;
    back: OcrBackResult;
    face_match?: { match_score: number; is_match: boolean };
    error?: string;
}> {
    try {
        // Process all in parallel
        const [frontResult, backResult, faceResult] = await Promise.all([
            mockOcrFront(frontImageUrl),
            mockOcrBack(backImageUrl),
            mockFaceMatch(selfieUrl, frontImageUrl),
        ]);

        if (!frontResult.success) {
            return {
                success: false,
                front: frontResult,
                back: backResult,
                error: frontResult.error,
            };
        }

        if (!backResult.success) {
            return {
                success: false,
                front: frontResult,
                back: backResult,
                error: backResult.error,
            };
        }

        return {
            success: true,
            front: frontResult,
            back: backResult,
            face_match: {
                match_score: faceResult.match_score,
                is_match: faceResult.is_match,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            front: { success: false, confidence: 0, error: error.message },
            back: { success: false, confidence: 0, error: error.message },
            error: error.message,
        };
    }
}
