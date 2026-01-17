'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    CreditCard,
    Building2,
    Wallet,
    Settings,
    Eye,
    EyeOff,
    ToggleLeft,
    ToggleRight,
    RefreshCw,
    Shield,
    History,
    Check,
    X,
    QrCode,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';

interface PaymentSetting {
    id: string;
    provider_name: string;
    config_key: string;
    config_value: string;
    is_sensitive: boolean;
    is_active: boolean;
    description: string;
    updated_at: string;
}

interface ProviderGroup {
    name: string;
    displayName: string;
    icon: React.ElementType;
    color: string;
    settings: PaymentSetting[];
    isActive: boolean;
}

const providerMeta: Record<string, { displayName: string; icon: React.ElementType; color: string }> = {
    vnpay: { displayName: 'VNPay', icon: CreditCard, color: 'blue' },
    momo: { displayName: 'MoMo', icon: Wallet, color: 'pink' },
    bank: { displayName: 'Chuyển khoản Ngân hàng', icon: Building2, color: 'emerald' },
};

export default function PaymentSettingsPage() {
    const [settings, setSettings] = useState<PaymentSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const getAuthHeader = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ? `Bearer ${session.access_token}` : '';
    }, [supabase]);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/payment-settings', {
                headers: { Authorization: await getAuthHeader() },
            });
            const data = await res.json();
            if (data.settings) setSettings(data.settings);
        } catch (error) {
            toast.error('Không thể tải cấu hình thanh toán');
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !isAdminEmail(user.email || '')) {
                router.push('/');
                return;
            }
            setAuthorized(true);
            fetchSettings();
        };
        checkAuth();
    }, [supabase, router, fetchSettings]);

    const toggleProvider = async (providerName: string, isActive: boolean) => {
        try {
            setSaving(true);
            const res = await fetch('/api/admin/payment-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: await getAuthHeader(),
                },
                body: JSON.stringify({ provider_name: providerName, is_active: isActive }),
            });

            if (res.ok) {
                toast.success(`${isActive ? 'Bật' : 'Tắt'} ${providerMeta[providerName]?.displayName || providerName}`);
                fetchSettings();
            }
        } catch (error) {
            toast.error('Lỗi cập nhật');
        } finally {
            setSaving(false);
        }
    };

    const saveSetting = async (id: string, value: string) => {
        try {
            setSaving(true);
            const res = await fetch('/api/admin/payment-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: await getAuthHeader(),
                },
                body: JSON.stringify({ id, config_value: value }),
            });

            if (res.ok) {
                toast.success('Đã lưu thành công');
                setEditingId(null);
                fetchSettings();
            }
        } catch (error) {
            toast.error('Lỗi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const generateQR = async () => {
        try {
            const res = await fetch('/api/admin/payment-settings/qr-preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: await getAuthHeader(),
                },
                body: JSON.stringify({ amount: 0, description: 'SipMart Qr Test' }),
            });

            const data = await res.json();

            if (res.ok && data.qrUrl) {
                setQrPreview(data.qrUrl);
                toast.success('Đã tạo mã QR thành công');
            } else {
                toast.error(data.error || 'Lỗi tạo QR');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    const providerGroups: ProviderGroup[] = Object.entries(providerMeta).map(([name, meta]) => {
        const providerSettings = settings.filter(s => s.provider_name === name);
        return {
            name,
            ...meta,
            settings: providerSettings,
            isActive: providerSettings.some(s => s.is_active),
        };
    });

    if (!authorized || loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Settings className="w-7 h-7 text-emerald-600" />
                            Cấu hình Thanh toán
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Quản lý phương thức thanh toán và thông tin nhận tiền
                        </p>
                    </div>
                    <button
                        onClick={fetchSettings}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Dữ liệu nhạy cảm</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            Các khóa bí mật được mã hóa và hiển thị dạng ẩn. Mọi thay đổi được ghi nhật ký.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {providerGroups.map((provider) => (
                        <motion.div
                            key={provider.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                        <provider.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{provider.displayName}</h3>
                                        <p className="text-xs text-slate-500">{provider.settings.length} cấu hình</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleProvider(provider.name, !provider.isActive)}
                                    disabled={saving}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${provider.isActive
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    {provider.isActive ? <><ToggleRight className="w-5 h-5" /> Đang bật</> : <><ToggleLeft className="w-5 h-5" /> Đang tắt</>}
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {provider.settings.map((setting) => (
                                    <div key={setting.id} className="px-6 py-4 flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{setting.config_key}</p>
                                            <p className="text-xs text-slate-500">{setting.description}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {editingId === setting.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type={setting.is_sensitive && !showSecrets.has(setting.id) ? 'password' : 'text'}
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="w-64 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                                                        placeholder="Nhập giá trị mới..."
                                                    />
                                                    <button onClick={() => saveSetting(setting.id, editValue)} disabled={saving} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono w-48 truncate">
                                                        {setting.config_value || '(chưa cấu hình)'}
                                                    </span>
                                                    {setting.is_sensitive && (
                                                        <button
                                                            onClick={() => {
                                                                const newSet = new Set(showSecrets);
                                                                if (newSet.has(setting.id)) newSet.delete(setting.id);
                                                                else newSet.add(setting.id);
                                                                setShowSecrets(newSet);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            {showSecrets.has(setting.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { setEditingId(setting.id); setEditValue(''); }}
                                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                                                    >
                                                        Sửa
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {provider.name === 'bank' && (
                                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <QrCode className="w-5 h-5 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">VietQR Preview</span>
                                        </div>
                                        <button onClick={generateQR} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">
                                            Tạo QR
                                        </button>
                                    </div>
                                    {qrPreview && (
                                        <div className="mt-4 flex justify-center">
                                            <img src={qrPreview} alt="VietQR" className="w-48 h-48 rounded-lg shadow-lg" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <button className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
                        <History className="w-4 h-4" />
                        Xem nhật ký thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}
