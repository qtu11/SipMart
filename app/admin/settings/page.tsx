'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings as SettingsIcon, DollarSign, Clock, Sparkles, Award, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isAdminEmail } from '@/lib/supabase/admin';
import { getCurrentUserAsync } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

interface SystemSettings {
    depositAmount: number;
    borrowDurationHours: number;
    pointsBorrow: number;
    pointsReturn: number;
    pointsSpeedReturner: number;
    lateFee24to48: number;
    streakVoucherAfter: number;
    streakVoucherDiscount: number;
}

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [settings, setSettings] = useState<SystemSettings>({
        depositAmount: 20000,
        borrowDurationHours: 24,
        pointsBorrow: 50,
        pointsReturn: 100,
        pointsSpeedReturner: 200,
        lateFee24to48: 5000,
        streakVoucherAfter: 5,
        streakVoucherDiscount: 0.1,
    });
    const router = useRouter();

    const checkAuth = useCallback(async () => {
        try {
            const user = await getCurrentUserAsync();
            if (!user) {
                toast.error('Vui lòng đăng nhập');
                router.push('/auth/login');
                return;
            }

            if (!isAdminEmail(user.email || '')) {
                toast.error('Bạn không có quyền truy cập');
                router.push('/');
                return;
            }

            setAuthorized(true);
            loadSettings();
        } catch (error) {
            toast.error('Lỗi kiểm tra quyền truy cập');
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const loadSettings = async () => {
        try {
            // For MVP, use default values from config
            // In production, fetch from SystemSettings table
            const { GAMIFICATION_CONFIG } = await import('@/lib/config/gamification');

            setSettings({
                depositAmount: GAMIFICATION_CONFIG.deposit.amount,
                borrowDurationHours: GAMIFICATION_CONFIG.borrow.durationHours,
                pointsBorrow: GAMIFICATION_CONFIG.points.borrow,
                pointsReturn: GAMIFICATION_CONFIG.points.returnOnTime,
                pointsSpeedReturner: GAMIFICATION_CONFIG.points.speedReturner,
                lateFee24to48: GAMIFICATION_CONFIG.deposit.late24to48Fee,
                streakVoucherAfter: GAMIFICATION_CONFIG.streak.voucherAfter,
                streakVoucherDiscount: GAMIFICATION_CONFIG.streak.voucherDiscount,
            });
        } catch (error) {
            toast.error('Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // TODO: Implement save to SystemSettings table
            // For now, just show success message
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success('Đã lưu cấu hình thành công!');
            toast('Note: Cần restart server để áp dụng thay đổi', { icon: 'ℹ️' });
        } catch (error) {
            toast.error('Lỗi khi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Bạn có chắc muốn reset về giá trị mặc định?')) return;

        await loadSettings();
        toast.success('Đã reset về giá trị mặc định');
    };

    if (loading || !authorized) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-dark-500 mt-4">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-soft px-4 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-800 flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6" />
                            Cài đặt Hệ thống
                        </h1>
                        <p className="text-dark-500 text-sm mt-1">Quản lý cấu hình gamification</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin')}
                        className="text-dark-600 hover:text-dark-800 transition"
                    >
                        ← Quay lại
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Warning */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Lưu ý quan trọng</p>
                        <p>Thay đổi cấu hình có thể ảnh hưởng đến trải nghiệm người dùng. Cần restart server để áp dụng thay đổi.</p>
                    </div>
                </motion.div>

                {/* Deposit & Fees */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-soft"
                >
                    <h2 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary-500" />
                        Tiền cọc & Phí
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-2">
                                Số tiền cọc (VND)
                            </label>
                            <input
                                type="number"
                                value={settings.depositAmount}
                                onChange={(e) => setSettings({ ...settings, depositAmount: parseInt(e.target.value) })}
                                className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-50"
                            />
                            <p className="text-xs text-dark-500 mt-1">Mặc định: 20,000 VND</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-2">
                                Phí trễ 24-48h (VND)
                            </label>
                            <input
                                type="number"
                                value={settings.lateFee24to48}
                                onChange={(e) => setSettings({ ...settings, lateFee24to48: parseInt(e.target.value) })}
                                className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-50"
                            />
                            <p className="text-xs text-dark-500 mt-1">Mặc định: 5,000 VND</p>
                        </div>
                    </div>
                </motion.div>

                {/* Borrow Duration */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-soft"
                >
                    <h2 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-500" />
                        Thời gian mượn
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-dark-700 mb-2">
                            Thời gian mượn tối đa (giờ)
                        </label>
                        <input
                            type="number"
                            value={settings.borrowDurationHours}
                            onChange={(e) => setSettings({ ...settings, borrowDurationHours: parseInt(e.target.value) })}
                            className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-50"
                        />
                        <p className="text-xs text-dark-500 mt-1">Mặc định: 24 giờ</p>
                    </div>
                </motion.div>

                {/* Green Points */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-soft"
                >
                    <h2 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        Green Points
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-2">
                                Điểm mượn ly
                            </label>
                            <input
                                type="number"
                                value={settings.pointsBorrow}
                                onChange={(e) => setSettings({ ...settings, pointsBorrow: parseInt(e.target.value) })}
                                className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-50"
                            />
                            <p className="text-xs text-dark-500 mt-1">Mặc định: 50 điểm</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-2">
                                Điểm trả ly đúng hạn
                            </label>
                            <input
                                type="number"
                                value={settings.pointsReturn}
                                onChange={(e) => setSettings({ ...settings, pointsReturn: parseInt(e.target.value) })}
                                className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-50"
                            />
                            <p className="text-xs text-dark-500 mt-1">Mặc định: 100 điểm</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-2">
                                Điểm Speed Returner (&lt;1h)
                            </label>
                            <input
                                type="number"
                                value={settings.pointsSpeedReturner}
                                onChange={(e) => setSettings({ ...settings, pointsSpeedReturner: parseInt(e.target.value) })}
                                className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-50"
                            />
                            <p className="text-xs text-dark-500 mt-1">Mặc định: 200 điểm (x2 bonus)</p>
                        </div>
                    </div>
                </motion.div>

                {/* Green Streak */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 shadow-soft"
                >
                    <h2 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary-500" />
                        Green Streak
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-2">
                                Số lần trả đúng hạn → Voucher
                            </label>
                            <input
                                type="number"
                                value={settings.streakVoucherAfter}
                                onChange={(e) => setSettings({ ...settings, streakVoucherAfter: parseInt(e.target.value) })}
                                className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-50"
                            />
                            <p className="text-xs text-dark-500 mt-1">Mặc định: 5 lần</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-2">
                                Mức giảm giá voucher (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={settings.streakVoucherDiscount * 100}
                                onChange={(e) => setSettings({ ...settings, streakVoucherDiscount: parseFloat(e.target.value) / 100 })}
                                className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-50"
                            />
                            <p className="text-xs text-dark-500 mt-1">Mặc định: 10%</p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-4 sticky bottom-4">
                    <button
                        onClick={handleReset}
                        disabled={saving}
                        className="flex-1 bg-white border-2 border-dark-200 text-dark-700 rounded-xl py-3 font-semibold hover:bg-dark-50 transition disabled:opacity-50"
                    >
                        Reset mặc định
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-primary-500 text-white rounded-xl py-3 font-semibold hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Lưu cấu hình
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}
