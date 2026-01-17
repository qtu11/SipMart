'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    QrCode, Coffee, Bike, MapPin, Plus, Download,
    Copy, Bus, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SimpleQRCode from '@/components/SimpleQRCode';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/supabase/admin-auth';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Đang tải bản đồ...</div>
});

type QRType = 'cup' | 'ebike' | 'station' | 'bus';

interface QRItem {
    id: string;
    code: string;
    type: QRType;
    qrData: string;
    createdAt: string;
    extra?: any;
}

export default function QRManagementPage() {
    const router = useRouter();
    const supabase = createClient();
    const [activeType, setActiveType] = useState<QRType>('cup');
    const [items, setItems] = useState<QRItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQRPreview, setShowQRPreview] = useState<QRItem | null>(null);

    // Form states
    const [cupForm, setCupForm] = useState({ storeId: '', quantity: 10, material: 'pp_plastic' });
    const [bikeForm, setBikeForm] = useState({ prefix: 'EB', stationId: '', quantity: 1 });
    const [stationForm, setStationForm] = useState({ name: '', address: '', lat: '', lng: '', slots: 10 });
    const [busForm, setBusForm] = useState({ routeCode: '', routeName: '', quantity: 1 });

    const [stores, setStores] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);

    // Auth check
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !isAdminEmail(session.user.email || '')) {
                router.replace('/admin');
            }
        };
        checkAuth();
    }, [router, supabase]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const headers = { 'Authorization': `Bearer ${session.access_token}` };

            // Fetch stores for cup creation
            const storesRes = await fetch('/api/admin/stores', { headers });
            if (storesRes.ok) {
                const storesData = await storesRes.json();
                setStores(storesData.stores || []);
            }

            // Fetch stations for e-bike creation
            const stationsRes = await fetch('/api/admin/ebikes', { headers });
            if (stationsRes.ok) {
                const stationsData = await stationsRes.json();
                setStations(stationsData.stations || []);
            }

            // Fetch existing items based on type
            await fetchItems();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const fetchItems = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const headers = { 'Authorization': `Bearer ${session.access_token}` };

            if (activeType === 'cup') {
                const res = await fetch('/api/admin/cups', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setItems((data.cups || []).map((c: any) => ({
                        id: c.cup_id,
                        code: c.cup_id,
                        type: 'cup' as QRType,
                        qrData: c.qrData || `CUP|${c.cup_id}|${c.material || 'pp_plastic'}|SipSmart`,
                        createdAt: c.created_at,
                        extra: { material: c.material, status: c.status }
                    })));
                }
            } else if (activeType === 'ebike') {
                const res = await fetch('/api/admin/ebikes', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setItems((data.bikes || []).map((b: any) => ({
                        id: b.bike_id,
                        code: b.bike_code,
                        type: 'ebike' as QRType,
                        qrData: `EBIKE|${b.bike_id}|${b.bike_code}|SipSmart`,
                        createdAt: b.created_at,
                        extra: { battery: b.battery_level, status: b.status }
                    })));
                }
            } else if (activeType === 'station') {
                const res = await fetch('/api/admin/ebikes', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setItems((data.stations || []).map((s: any) => ({
                        id: s.station_id,
                        code: s.name,
                        type: 'station' as QRType,
                        qrData: `STATION|${s.station_id}|${s.name}|SipSmart`,
                        createdAt: s.created_at,
                        extra: { address: s.address, slots: s.total_slots }
                    })));
                }
            } else if (activeType === 'bus') {
                const res = await fetch('/api/admin/buses', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setItems((data.buses || []).map((b: any) => ({
                        id: b.bus_id,
                        code: b.route_code,
                        type: 'bus' as QRType,
                        qrData: `BUS|${b.bus_id}|${b.route_code}|SipSmart`,
                        createdAt: b.created_at,
                        extra: { routeName: b.route_name }
                    })));
                } else {
                    setItems([]);
                }
            }
        } catch (e) {
            console.error(e);
            setItems([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchItems();
    }, [activeType]);

    const handleCreateCups = async () => {
        if (!cupForm.storeId) {
            toast.error('Vui lòng chọn cửa hàng');
            return;
        }
        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Vui lòng đăng nhập lại');
                return;
            }
            const res = await fetch('/api/admin/cups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    storeId: cupForm.storeId,
                    count: cupForm.quantity,
                    material: cupForm.material
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Đã tạo ${data.cupIds?.length || cupForm.quantity} ly!`);
                setShowCreateModal(false);
                fetchItems();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Lỗi tạo ly');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateBikes = async () => {
        if (!bikeForm.stationId) {
            toast.error('Vui lòng chọn trạm sạc');
            return;
        }
        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Vui lòng đăng nhập lại');
                return;
            }

            const createdBikes = [];
            for (let i = 0; i < bikeForm.quantity; i++) {
                const bikeCode = `${bikeForm.prefix}-${String(Date.now()).slice(-6)}-${i + 1}`;
                const res = await fetch('/api/admin/ebikes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        action: 'create_bike',
                        bikeCode,
                        stationId: bikeForm.stationId,
                        batteryLevel: 100
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    createdBikes.push(data.bike);
                }
            }
            toast.success(`Đã tạo ${createdBikes.length} xe điện!`);
            setShowCreateModal(false);
            fetchItems();
        } catch (e) {
            toast.error('Lỗi kết nối');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateStation = async () => {
        if (!stationForm.name || !stationForm.address || !stationForm.lat || !stationForm.lng) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Vui lòng đăng nhập lại');
                return;
            }

            const res = await fetch('/api/admin/ebikes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: 'create_station',
                    name: stationForm.name,
                    address: stationForm.address,
                    gpsLat: parseFloat(stationForm.lat),
                    gpsLng: parseFloat(stationForm.lng),
                    totalSlots: stationForm.slots
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Đã tạo trạm sạc!');
                setShowCreateModal(false);
                fetchItems();
                // Show QR preview
                setShowQRPreview({
                    id: data.station.station_id,
                    code: data.station.name,
                    type: 'station',
                    qrData: `STATION|${data.station.station_id}|${data.station.name}|SipSmart`,
                    createdAt: new Date().toISOString()
                });
            } else {
                const err = await res.json();
                toast.error(err.error || 'Lỗi tạo trạm');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateBuses = async () => {
        if (!busForm.routeCode || !busForm.routeName) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Vui lòng đăng nhập lại');
                return;
            }

            const res = await fetch('/api/admin/buses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    routeCode: busForm.routeCode,
                    routeName: busForm.routeName,
                    quantity: busForm.quantity
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Đã tạo ${data.buses?.length || busForm.quantity} mã QR xe bus!`);
                setShowCreateModal(false);
                fetchItems();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Lỗi tạo mã xe bus');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        } finally {
            setCreating(false);
        }
    };

    const handleSeedData = async () => {
        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const headers = { 'Authorization': `Bearer ${session.access_token}` };

            const res = await fetch('/api/admin/setup-data', { method: 'POST', headers });
            if (res.ok) {
                const data = await res.json();
                toast.success(data.message);
                // Refresh data
                const storesRes = await fetch('/api/admin/stores', { headers });
                if (storesRes.ok) {
                    const storesData = await storesRes.json();
                    setStores(storesData.stores || []);
                }
            } else {
                toast.error('Lỗi tạo dữ liệu mẫu');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        } finally {
            setCreating(false);
        }
    };

    const copyQRData = (data: string) => {
        navigator.clipboard.writeText(data);
        toast.success('Đã sao chép dữ liệu QR');
    };

    const downloadQR = async (qrData: string, filename: string) => {
        try {
            const QRCodeLib = await import('qrcode');
            const dataUrl = await QRCodeLib.toDataURL(qrData, { width: 400, margin: 2 });
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Đã tải QR code');
        } catch (e) {
            toast.error('Lỗi tải QR');
        }
    };

    const typeConfig = {
        cup: { icon: Coffee, label: 'Ly', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
        ebike: { icon: Bike, label: 'Xe điện', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        station: { icon: MapPin, label: 'Trạm sạc', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
        bus: { icon: Bus, label: 'Xe bus', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-green-600 hover:underline text-sm mb-2 inline-block">
                        ← Quay lại Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <QrCode className="w-8 h-8 text-green-600" />
                        Quản lý mã QR
                    </h1>
                    <p className="text-gray-500">Tạo và quản lý mã QR cho ly, xe điện, trạm sạc, xe bus</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                    <Plus className="w-5 h-5" />
                    Tạo mới
                </button>
            </div>

            {/* Type Tabs */}
            <div className="flex flex-wrap gap-3">
                {(Object.keys(typeConfig) as QRType[]).map((type) => {
                    const config = typeConfig[type];
                    const Icon = config.icon;
                    const count = type === activeType ? items.length : 0;
                    return (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${activeType === type
                                ? `${config.bgColor} ${config.textColor} ring-2 ring-offset-2`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {config.label}
                            {activeType === type && (
                                <span className="ml-1 px-2 py-0.5 rounded-full bg-white/50 text-sm">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setShowQRPreview(item)}
                    >
                        <div className="flex justify-center mb-3">
                            <SimpleQRCode data={item.qrData} size={100} />
                        </div>
                        <p className="text-center font-semibold text-gray-900 text-sm truncate">{item.code}</p>
                        {item.extra?.status && (
                            <p className="text-center text-xs text-gray-500 mt-1">{item.extra.status}</p>
                        )}
                    </motion.div>
                ))}
                {items.length === 0 && (
                    <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center text-gray-500">
                        <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Chưa có mã QR nào cho loại này</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
                        >
                            Tạo mới
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-xl font-bold text-gray-900">Tạo mã QR mới</h2>

                        {/* Type Selection */}
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(typeConfig) as QRType[]).map((type) => {
                                const config = typeConfig[type];
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setActiveType(type)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium ${activeType === type
                                            ? `${config.bgColor} ${config.textColor}`
                                            : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Cup Form */}
                        {activeType === 'cup' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng</label>
                                    {stores.length === 0 ? (
                                        <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex flex-col gap-2 border border-yellow-200">
                                            <p className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                Chưa có cửa hàng nào.
                                            </p>
                                            <button
                                                onClick={handleSeedData}
                                                disabled={creating}
                                                className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded font-medium hover:bg-yellow-200 w-full text-center transition-colors disabled:opacity-50"
                                            >
                                                {creating ? 'Đang tạo...' : '+ Tạo 3 cửa hàng mẫu ngay'}
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={cupForm.storeId}
                                            onChange={(e) => setCupForm({ ...cupForm, storeId: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        >
                                            <option value="">Chọn cửa hàng</option>
                                            {stores.map((s) => (
                                                <option key={s.store_id} value={s.store_id}>{s.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={cupForm.quantity}
                                        onChange={(e) => setCupForm({ ...cupForm, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chất liệu</label>
                                    <select
                                        value={cupForm.material}
                                        onChange={(e) => setCupForm({ ...cupForm, material: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="pp_plastic">Nhựa PP cao cấp</option>
                                        <option value="glass">Thủy tinh</option>
                                        <option value="bamboo">Tre</option>
                                        <option value="stainless">Inox</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleCreateCups}
                                    disabled={creating}
                                    className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium disabled:opacity-50"
                                >
                                    {creating ? 'Đang tạo...' : `Tạo ${cupForm.quantity} ly`}
                                </button>
                            </div>
                        )}

                        {/* E-Bike Form */}
                        {activeType === 'ebike' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tố mã xe</label>
                                    <input
                                        type="text"
                                        value={bikeForm.prefix}
                                        onChange={(e) => setBikeForm({ ...bikeForm, prefix: e.target.value.toUpperCase() })}
                                        placeholder="VD: EB, BIKE"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạm sạc</label>
                                    <select
                                        value={bikeForm.stationId}
                                        onChange={(e) => setBikeForm({ ...bikeForm, stationId: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="">Chọn trạm</option>
                                        {stations.map((s) => (
                                            <option key={s.station_id} value={s.station_id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng xe</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={bikeForm.quantity}
                                        onChange={(e) => setBikeForm({ ...bikeForm, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateBikes}
                                    disabled={creating}
                                    className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium disabled:opacity-50"
                                >
                                    {creating ? 'Đang tạo...' : `Tạo ${bikeForm.quantity} xe điện`}
                                </button>
                            </div>
                        )}

                        {/* Station Form */}
                        {activeType === 'station' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên trạm</label>
                                    <input
                                        type="text"
                                        value={stationForm.name}
                                        onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                                        placeholder="VD: Trạm Công viên 23/9"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                    <input
                                        type="text"
                                        value={stationForm.address}
                                        onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                                        placeholder="VD: 123 Nguyễn Huệ, Q1"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí trạm (Kéo thả trên bản đồ)</label>
                                        <LocationPickerMap
                                            initialLat={stationForm.lat ? parseFloat(stationForm.lat) : 10.762622}
                                            initialLng={stationForm.lng ? parseFloat(stationForm.lng) : 106.660172}
                                            onLocationChange={(lat, lng) => setStationForm(prev => ({ ...prev, lat: lat.toString(), lng: lng.toString() }))}
                                            existingStations={stations}
                                            existingStores={stores}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số chỗ đỗ</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={stationForm.slots}
                                        onChange={(e) => setStationForm({ ...stationForm, slots: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateStation}
                                    disabled={creating}
                                    className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium disabled:opacity-50"
                                >
                                    {creating ? 'Đang tạo...' : 'Tạo trạm sạc'}
                                </button>
                            </div>
                        )}

                        {/* Bus Form */}
                        {activeType === 'bus' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã tuyến</label>
                                    <input
                                        type="text"
                                        value={busForm.routeCode}
                                        onChange={(e) => setBusForm({ ...busForm, routeCode: e.target.value.toUpperCase() })}
                                        placeholder="VD: 01, 52, 88"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên tuyến</label>
                                    <input
                                        type="text"
                                        value={busForm.routeName}
                                        onChange={(e) => setBusForm({ ...busForm, routeName: e.target.value })}
                                        placeholder="VD: Bến Thành - Chợ Lớn"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng QR</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={busForm.quantity}
                                        onChange={(e) => setBusForm({ ...busForm, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateBuses}
                                    disabled={creating}
                                    className="w-full py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 font-medium disabled:opacity-50"
                                >
                                    {creating ? 'Đang tạo...' : `Tạo ${busForm.quantity} mã QR xe bus`}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Đóng
                        </button>
                    </motion.div>
                </div>
            )}

            {/* QR Preview Modal */}
            {showQRPreview && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-sm p-6 text-center"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Mã QR</h2>
                        <p className="text-lg font-semibold text-green-600 mb-4">{showQRPreview.code}</p>
                        <div className="flex justify-center mb-4">
                            <SimpleQRCode data={showQRPreview.qrData} size={200} />
                        </div>
                        <p className="text-xs text-gray-400 mb-2 break-all font-mono bg-gray-100 p-2 rounded">
                            {showQRPreview.qrData}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">{showQRPreview.id}</p>

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => copyQRData(showQRPreview.qrData)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                <Copy className="w-4 h-4" />
                                Sao chép
                            </button>
                            <button
                                onClick={() => downloadQR(showQRPreview.qrData, showQRPreview.code)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                                <Download className="w-4 h-4" />
                                Tải về
                            </button>
                        </div>

                        <button
                            onClick={() => setShowQRPreview(null)}
                            className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Đóng
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
