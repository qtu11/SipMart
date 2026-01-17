'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Camera, Check, ChevronRight, ChevronLeft,
    AlertCircle, Loader2, Shield, FileCheck, User, CreditCard,
    Sparkles, X, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import NextImage from 'next/image';

interface KycFormProps {
    userId: string;
    existingData?: {
        front_img_path?: string;
        back_img_path?: string;
        selfie_img_path?: string;
        status?: string;
        rejection_reason?: string;
    };
    onComplete?: () => void;
}

type Step = 1 | 2 | 3;

interface ImageData {
    file?: File;
    preview?: string;
    path?: string;
    uploaded: boolean;
}

export default function KycForm({ userId, existingData, onComplete }: KycFormProps) {
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [frontImage, setFrontImage] = useState<ImageData>({ uploaded: false });
    const [backImage, setBackImage] = useState<ImageData>({ uploaded: false });
    const [selfieImage, setSelfieImage] = useState<ImageData>({ uploaded: false });

    const frontInputRef = useRef<HTMLInputElement>(null);
    const backInputRef = useRef<HTMLInputElement>(null);
    const selfieInputRef = useRef<HTMLInputElement>(null);

    // Upload image to Supabase Storage
    const uploadImage = async (file: File, type: 'front' | 'back' | 'selfie'): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error } = await supabase.storage
            .from('kyc-documents')
            .upload(filePath, file, { upsert: true });

        if (error) {
            console.error('Upload error:', error);
            toast.error(`Lỗi upload ảnh: ${error.message}`);
            return null;
        }

        return filePath;
    };

    // Handle file selection
    const handleFileSelect = useCallback(async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'front' | 'back' | 'selfie'
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast.error('Chỉ chấp nhận file ảnh');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Ảnh quá lớn (tối đa 10MB)');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = event.target?.result as string;
            const imageData: ImageData = { file, preview, uploaded: false };

            switch (type) {
                case 'front':
                    setFrontImage(imageData);
                    break;
                case 'back':
                    setBackImage(imageData);
                    break;
                case 'selfie':
                    setSelfieImage(imageData);
                    break;
            }
        };
        reader.readAsDataURL(file);
    }, []);

    // Upload all images and submit
    const handleSubmit = async () => {
        if (!frontImage.file || !backImage.file || !selfieImage.file) {
            toast.error('Vui lòng upload đầy đủ 3 ảnh');
            return;
        }

        setSubmitting(true);

        try {
            // Upload all images
            const [frontPath, backPath, selfiePath] = await Promise.all([
                uploadImage(frontImage.file, 'front'),
                uploadImage(backImage.file, 'back'),
                uploadImage(selfieImage.file, 'selfie'),
            ]);

            if (!frontPath || !backPath || !selfiePath) {
                throw new Error('Upload ảnh thất bại');
            }

            // Submit to API
            const response = await fetch('/api/kyc/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    front_img_path: frontPath,
                    back_img_path: backPath,
                    selfie_img_path: selfiePath,
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Gửi xác minh thất bại');
            }

            toast.success('🎉 Đã gửi hồ sơ xác minh! Vui lòng chờ duyệt.');
            onComplete?.();
        } catch (error: any) {
            console.error('Submit error:', error);
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    // Step indicators
    const steps = [
        { num: 1, title: 'CCCD/CMND', icon: CreditCard },
        { num: 2, title: 'Ảnh Selfie', icon: User },
        { num: 3, title: 'Xác nhận', icon: FileCheck },
    ];

    // Check if can proceed to next step
    const canProceed = () => {
        switch (step) {
            case 1:
                return frontImage.preview && backImage.preview;
            case 2:
                return selfieImage.preview;
            case 3:
                return true;
            default:
                return false;
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Rejection Banner */}
            {existingData?.status === 'rejected' && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-red-700">Hồ sơ bị từ chối</h4>
                            <p className="text-sm text-red-600 mt-1">{existingData.rejection_reason}</p>
                            <p className="text-xs text-red-500 mt-2">Vui lòng gửi lại với thông tin chính xác hơn.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 px-4">
                {steps.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = step === s.num;
                    const isCompleted = step > s.num;

                    return (
                        <div key={s.num} className="flex items-center flex-1">
                            <motion.div
                                animate={{ scale: isActive ? 1.1 : 1 }}
                                className={`flex flex-col items-center cursor-pointer`}
                                onClick={() => s.num < step && setStep(s.num as Step)}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted
                                        ? 'bg-green-500 text-white'
                                        : isActive
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs font-medium mt-2 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                                    {s.title}
                                </span>
                            </motion.div>
                            {idx < steps.length - 1 && (
                                <div className={`flex-1 h-1 mx-3 rounded-full transition-all ${step > s.num ? 'bg-green-500' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Form Content */}
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
                {/* Step 1: Front & Back ID */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Chụp ảnh CCCD/CMND</h2>
                            <p className="text-sm text-gray-500 mt-1">Đảm bảo ảnh rõ nét, đủ ánh sáng</p>
                        </div>

                        {/* Front Image */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mặt trước <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                ref={frontInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, 'front')}
                            />
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                onClick={() => frontInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${frontImage.preview
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                                    }`}
                            >
                                {frontImage.preview ? (
                                    <div className="relative aspect-[1.6/1] rounded-lg overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={frontImage.preview} alt="Front" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFrontImage({ uploaded: false }); }}
                                            className="absolute top-2 left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-8 text-gray-500">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                                            <CreditCard className="w-8 h-8" />
                                        </div>
                                        <span className="font-medium">Nhấn để chọn ảnh mặt trước</span>
                                        <span className="text-xs mt-1">JPG, PNG (tối đa 10MB)</span>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Back Image */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mặt sau <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                ref={backInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, 'back')}
                            />
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                onClick={() => backInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${backImage.preview
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                                    }`}
                            >
                                {backImage.preview ? (
                                    <div className="relative aspect-[1.6/1] rounded-lg overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={backImage.preview} alt="Back" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setBackImage({ uploaded: false }); }}
                                            className="absolute top-2 left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-8 text-gray-500">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                                            <CreditCard className="w-8 h-8 rotate-180" />
                                        </div>
                                        <span className="font-medium">Nhấn để chọn ảnh mặt sau</span>
                                        <span className="text-xs mt-1">JPG, PNG (tối đa 10MB)</span>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Step 2: Selfie */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Chụp ảnh Selfie</h2>
                            <p className="text-sm text-gray-500 mt-1">Giữ CCCD cạnh mặt và chụp ảnh</p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Hướng dẫn chụp
                            </h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Giữ CCCD cạnh khuôn mặt</li>
                                <li>• Đảm bảo cả mặt và CCCD đều rõ nét</li>
                                <li>• Không đội mũ, đeo kính râm</li>
                                <li>• Ánh sáng đủ, không bị ngược sáng</li>
                            </ul>
                        </div>

                        {/* Selfie Upload */}
                        <div>
                            <input
                                type="file"
                                ref={selfieInputRef}
                                className="hidden"
                                accept="image/*"
                                capture="user"
                                onChange={(e) => handleFileSelect(e, 'selfie')}
                            />
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                onClick={() => selfieInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${selfieImage.preview
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                                    }`}
                            >
                                {selfieImage.preview ? (
                                    <div className="relative aspect-[3/4] max-w-xs mx-auto rounded-lg overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={selfieImage.preview} alt="Selfie" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelfieImage({ uploaded: false }); }}
                                            className="absolute top-2 left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-12 text-gray-500">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Camera className="w-10 h-10" />
                                        </div>
                                        <span className="font-medium text-lg">Nhấn để chụp/chọn ảnh Selfie</span>
                                        <span className="text-xs mt-1">Ảnh chân dung cùng CCCD</span>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Xác nhận thông tin</h2>
                            <p className="text-sm text-gray-500 mt-1">Kiểm tra lại ảnh trước khi gửi</p>
                        </div>

                        {/* Image Preview Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 mb-2">Mặt trước</p>
                                <div className="aspect-[1.6/1] rounded-lg overflow-hidden border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {frontImage.preview && <img src={frontImage.preview} alt="Front" className="w-full h-full object-cover" />}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 mb-2">Mặt sau</p>
                                <div className="aspect-[1.6/1] rounded-lg overflow-hidden border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {backImage.preview && <img src={backImage.preview} alt="Back" className="w-full h-full object-cover" />}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 mb-2">Selfie</p>
                                <div className="aspect-[1.6/1] rounded-lg overflow-hidden border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {selfieImage.preview && <img src={selfieImage.preview} alt="Selfie" className="w-full h-full object-cover" />}
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                            <p className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                                Bằng việc gửi xác minh, bạn đồng ý cho SipSmart xử lý thông tin cá nhân theo{' '}
                                <a href="/privacy" className="text-primary-600 underline">Chính sách bảo mật</a>.
                            </p>
                        </div>

                        {/* OCR Info */}
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-800">AI sẽ tự động trích xuất thông tin</span>
                            </div>
                            <p className="text-sm text-green-700">
                                Hệ thống sẽ đọc và lưu thông tin từ CCCD của bạn. Thời gian xử lý khoảng 30 giây.
                            </p>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep((step - 1) as Step)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Quay lại
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep((step + 1) as Step)}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Tiếp tục
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    Gửi xác minh
                                </>
                            )}
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
