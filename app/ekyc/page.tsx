'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EKYCUploadPage() {
    const [step, setStep] = useState(1);
    const [frontImage, setFrontImage] = useState<string>('');
    const [backImage, setBackImage] = useState<string>('');
    const [faceImage, setFaceImage] = useState<string>('');
    const [formData, setFormData] = useState({
        idCardNumber: '',
        fullName: '',
        dateOfBirth: '',
        address: '',
    });
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const frontRef = useRef<HTMLInputElement>(null);
    const backRef = useRef<HTMLInputElement>(null);
    const faceRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'front' | 'back' | 'face'
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                if (type === 'front') setFrontImage(base64);
                else if (type === 'back') setBackImage(base64);
                else setFaceImage(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!frontImage || !backImage || !faceImage) {
            setError('Vui lòng tải lên đầy đủ ảnh CCCD và khuôn mặt');
            return;
        }

        if (!formData.idCardNumber || !formData.fullName || !formData.dateOfBirth) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const response = await fetch('/api/ekyc/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frontImage,
                    backImage,
                    faceImage,
                    ...formData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setResult(data);
            setStep(4);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Xác thực danh tính (eKYC)</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Hoàn thành xác thực để được phép thuê xe đạp điện
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${s <= step ? 'bg-green-600 text-white' : 'bg-gray-200'
                                        }`}
                                >
                                    {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                                </div>
                                {s < 4 && (
                                    <div
                                        className={`w-16 h-1 ${s < step ? 'bg-green-600' : 'bg-gray-200'}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Front Image */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Bước 1: Chụp mặt trước CCCD</h3>
                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-green-500"
                                onClick={() => frontRef.current?.click()}
                            >
                                {frontImage ? (
                                    <img
                                        src={frontImage}
                                        alt="Front"
                                        className="max-h-64 mx-auto"
                                    />
                                ) : (
                                    <>
                                        <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                            Nhấn để chụp/tải ảnh mặt trước CCCD
                                        </p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={frontRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, 'front')}
                            />
                            <Button
                                onClick={() => setStep(2)}
                                disabled={!frontImage}
                                className="w-full"
                            >
                                Tiếp theo
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Back Image */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Bước 2: Chụp mặt sau CCCD</h3>
                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-green-500"
                                onClick={() => backRef.current?.click()}
                            >
                                {backImage ? (
                                    <img
                                        src={backImage}
                                        alt="Back"
                                        className="max-h-64 mx-auto"
                                    />
                                ) : (
                                    <>
                                        <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                            Nhấn để chụp/tải ảnh mặt sau CCCD
                                        </p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={backRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, 'back')}
                            />
                            <div className="flex gap-2">
                                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                                    Quay lại
                                </Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!backImage}
                                    className="flex-1"
                                >
                                    Tiếp theo
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Face + Info */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Bước 3: Chụp khuôn mặt & Nhập thông tin</h3>

                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-green-500"
                                onClick={() => faceRef.current?.click()}
                            >
                                {faceImage ? (
                                    <img
                                        src={faceImage}
                                        alt="Face"
                                        className="max-h-64 mx-auto rounded-lg"
                                    />
                                ) : (
                                    <>
                                        <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                            Nhấn để chụp ảnh chân dung
                                        </p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={faceRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, 'face')}
                            />

                            <div className="space-y-3">
                                <div>
                                    <Label>Số CCCD</Label>
                                    <Input
                                        value={formData.idCardNumber}
                                        onChange={(e) =>
                                            setFormData({ ...formData, idCardNumber: e.target.value })
                                        }
                                        placeholder="001234567890"
                                    />
                                </div>
                                <div>
                                    <Label>Họ và tên</Label>
                                    <Input
                                        value={formData.fullName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fullName: e.target.value })
                                        }
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                                <div>
                                    <Label>Ngày sinh</Label>
                                    <Input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) =>
                                            setFormData({ ...formData, dateOfBirth: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Địa chỉ (tùy chọn)</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                        placeholder="123 Đường ABC, Quận XYZ"
                                    />
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                                    Quay lại
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={uploading}
                                    className="flex-1"
                                >
                                    {uploading ? 'Đang xử lý...' : 'Xác thực'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Result */}
                    {step === 4 && result && (
                        <div className="space-y-4">
                            <div className="text-center">
                                {result.status === 'approved' ? (
                                    <>
                                        <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                                        <h3 className="text-xl font-bold text-green-600">
                                            ✅ Xác thực thành công!
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Điểm khớp: {result.match_score}/100
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-16 h-16 mx-auto text-yellow-600 mb-4" />
                                        <h3 className="text-xl font-bold text-yellow-600">
                                            ⏳ Đang chờ phê duyệt
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Điểm khớp: {result.match_score}/100
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Chúng tôi sẽ phản hồi trong 24h
                                        </p>
                                    </>
                                )}
                            </div>

                            <Button onClick={() => window.location.href = '/'} className="w-full">
                                Về trang chủ
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
