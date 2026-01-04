import QRCode from 'qrcode';

interface QRWithLogoOptions {
    qrData: string;
    logoUrl?: string;
    logoSize?: number;
    qrSize?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    color?: string;
    margin?: number;
}

/**
 * Helper function để load image từ URL
 */
function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Tạo mã QR với logo ở giữa (Client-side only)
 * @param options - Cấu hình QR code và logo
 * @returns Data URL của QR code có logo
 */
export async function generateQRWithLogo(options: QRWithLogoOptions): Promise<string> {
    const {
        qrData,
        logoUrl = '/logo.png',
        logoSize = 60,
        qrSize = 300,
        errorCorrectionLevel = 'H',
        color = '#000000',
        margin = 2
    } = options;

    try {
        // Tạo QR code base trước (không có logo)
        const qrDataUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel,
            type: 'image/png',
            width: qrSize,
            margin,
            color: {
                dark: color,
                light: '#FFFFFF',
            },
        });

        // Tạo canvas để vẽ (browser canvas)
        const canvas = document.createElement('canvas');
        canvas.width = qrSize;
        canvas.height = qrSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return qrDataUrl;
        }

        // Load QR code image
        const qrImage = await loadImageFromUrl(qrDataUrl);
        ctx.drawImage(qrImage, 0, 0, qrSize, qrSize);

        // Load và vẽ logo ở giữa
        try {
            const logoImage = await loadImageFromUrl(logoUrl);

            // Tính toán vị trí trung tâm
            const logoX = (qrSize - logoSize) / 2;
            const logoY = (qrSize - logoSize) / 2;

            // Vẽ background trắng cho logo (để dễ nhìn hơn)
            const padding = 4;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(
                logoX - padding,
                logoY - padding,
                logoSize + padding * 2,
                logoSize + padding * 2
            );

            // Vẽ logo
            ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        } catch (logoError) {
            // Nếu không load được logo, trả về QR code không có logo
            return qrDataUrl;
        }

        // Chuyển canvas thành data URL
        return canvas.toDataURL('image/png');
    } catch (error) {
        throw new Error(`Failed to generate QR code with logo: ${error}`);
    }
}

/**
 * Tạo nhiều QR codes với logo (cho bulk generation)
 */
export async function generateBulkQRWithLogo(
    qrDataArray: string[],
    options?: Partial<QRWithLogoOptions>
): Promise<string[]> {
    return Promise.all(
        qrDataArray.map(qrData =>
            generateQRWithLogo({ qrData, ...options })
        )
    );
}
