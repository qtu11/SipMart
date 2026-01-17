'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface SimpleQRCodeProps {
    data: string;
    size?: number;
    label?: string;
}

export default function SimpleQRCode({ data, size = 200, label }: SimpleQRCodeProps) {
    const [qrImage, setQrImage] = useState<string>('');

    useEffect(() => {
        if (data) {
            QRCode.toDataURL(data, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            })
                .then(setQrImage)
                .catch(console.error);
        }
    }, [data, size]);

    if (!qrImage) {
        return (
            <div
                className="bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <span className="text-gray-400 text-sm">Đang tạo...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <img src={qrImage} alt="QR Code" width={size} height={size} className="rounded-lg" />
            {label && <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>}
        </div>
    );
}
