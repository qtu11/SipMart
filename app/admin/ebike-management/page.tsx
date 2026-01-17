'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Bike, Plus, MapPin, QrCode, Download, Trash2,
    Battery, Settings, CheckCircle, XCircle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SimpleQRCode from '@/components/SimpleQRCode';

interface EBike {
    bike_id: string;
    bike_code: string;
    status: string;
    battery_level: number;
    current_station_id: string;
    station_name?: string;
}

interface Station {
    station_id: string;
    name: string;
    address: string;
    gps_lat: number;
    gps_lng: number;
    total_slots: number;
    available_bikes: number;
}

export default function EBikeManagementPage() {
    const [bikes, setBikes] = useState<EBike[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'bikes' | 'stations'>('bikes');

    // Add Bike Form
    const [showAddBike, setShowAddBike] = useState(false);
    const [bikeForm, setBikeForm] = useState({
        bikeCode: '',
        stationId: '',
        batteryLevel: 100
    });

    // Add Station Form
    const [showAddStation, setShowAddStation] = useState(false);
    const [stationForm, setStationForm] = useState({
        name: '',
        address: '',
        gpsLat: '',
        gpsLng: '',
        totalSlots: 10,
        solarCapacity: 0
    });

    // QR Modal
    const [qrData, setQrData] = useState<{ type: string; id: string; code: string } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ebikes');
            if (res.ok) {
                const data = await res.json();
                setBikes(data.bikes || []);
                setStations(data.stations || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddBike = async () => {
        if (!bikeForm.bikeCode || !bikeForm.stationId) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const res = await fetch('/api/admin/ebikes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_bike',
                    bikeCode: bikeForm.bikeCode,
                    stationId: bikeForm.stationId,
                    batteryLevel: bikeForm.batteryLevel
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Đã tạo xe mới!');
                setShowAddBike(false);
                setBikeForm({ bikeCode: '', stationId: '', batteryLevel: 100 });
                fetchData();
                // Show QR
                setQrData({
                    type: 'ebike',
                    id: data.bike.bike_id,
                    code: data.bike.bike_code
                });
            } else {
                toast.error(data.error || 'Lỗi tạo xe');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        }
    };

    const handleAddStation = async () => {
        if (!stationForm.name || !stationForm.address || !stationForm.gpsLat || !stationForm.gpsLng) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const res = await fetch('/api/admin/ebikes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_station',
                    name: stationForm.name,
                    address: stationForm.address,
                    gpsLat: parseFloat(stationForm.gpsLat),
                    gpsLng: parseFloat(stationForm.gpsLng),
                    totalSlots: stationForm.totalSlots,
                    solarCapacity: stationForm.solarCapacity
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Đã tạo trạm mới!');
                setShowAddStation(false);
                setStationForm({ name: '', address: '', gpsLat: '', gpsLng: '', totalSlots: 10, solarCapacity: 0 });
                fetchData();
                // Show QR
                setQrData({
                    type: 'station',
                    id: data.station.station_id,
                    code: data.station.name
                });
            } else {
                toast.error(data.error || 'Lỗi tạo trạm');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        }
    };

    const showBikeQR = (bike: EBike) => {
        setQrData({
            type: 'ebike',
            id: bike.bike_id,
            code: bike.bike_code
        });
    };

    const showStationQR = (station: Station) => {
        setQrData({
            type: 'station',
            id: station.station_id,
            code: station.name
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
                        ← Quay lại Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Xe điện & Trạm sạc</h1>
                    <p className="text-gray-500">Thêm xe, trạm và tạo mã QR</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddStation(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm Trạm
                    </button>
                    <button
                        onClick={() => setShowAddBike(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm Xe
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Bike} label="Tổng xe" value={bikes.length} color="blue" />
                <StatCard icon={MapPin} label="Tổng trạm" value={stations.length} color="green" />
                <StatCard icon={CheckCircle} label="Xe sẵn sàng" value={bikes.filter(b => b.status === 'available').length} color="emerald" />
                <StatCard icon={Battery} label="Pin yếu" value={bikes.filter(b => b.battery_level < 20).length} color="orange" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('bikes')}
                    className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'bikes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    <Bike className="w-4 h-4 inline mr-2" />
                    Xe điện ({bikes.length})
                </button>
                <button
                    onClick={() => setActiveTab('stations')}
                    className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'stations' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Trạm sạc ({stations.length})
                </button>
            </div>

            {/* Bike List */}
            {activeTab === 'bikes' && (
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mã xe</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pin</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạm</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bikes.map((bike) => (
                                <tr key={bike.bike_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{bike.bike_code}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bike.status === 'available' ? 'bg-green-100 text-green-700' :
                                            bike.status === 'in_use' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {bike.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-16 h-2 rounded-full ${bike.battery_level > 50 ? 'bg-green-200' :
                                                bike.battery_level > 20 ? 'bg-yellow-200' : 'bg-red-200'
                                                }`}>
                                                <div
                                                    className={`h-full rounded-full ${bike.battery_level > 50 ? 'bg-green-500' :
                                                        bike.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${bike.battery_level}%` }}
                                                />
                                            </div>
                                            <span className="text-sm">{bike.battery_level}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {bike.station_name || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => showBikeQR(bike)}
                                            className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            QR
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {bikes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Chưa có xe nào. Nhấn &quot;Thêm Xe&quot; để tạo mới.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Station List */}
            {activeTab === 'stations' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stations.map((station) => (
                        <div key={station.station_id} className="bg-white rounded-2xl shadow-sm border p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900">{station.name}</h3>
                                    <p className="text-sm text-gray-500">{station.address}</p>
                                </div>
                                <button
                                    onClick={() => showStationQR(station)}
                                    className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                                >
                                    <QrCode className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Xe có sẵn</span>
                                <span className="font-bold text-green-600">
                                    {station.available_bikes}/{station.total_slots}
                                </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                                GPS: {station.gps_lat?.toFixed(6)}, {station.gps_lng?.toFixed(6)}
                            </div>
                        </div>
                    ))}
                    {stations.length === 0 && (
                        <div className="col-span-3 bg-white rounded-2xl p-8 text-center text-gray-500">
                            Chưa có trạm nào. Nhấn &quot;Thêm Trạm&quot; để tạo mới.
                        </div>
                    )}
                </div>
            )}

            {/* Add Bike Modal */}
            {showAddBike && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4"
                    >
                        <h2 className="text-xl font-bold text-gray-900">Thêm xe điện mới</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã xe</label>
                                <input
                                    type="text"
                                    value={bikeForm.bikeCode}
                                    onChange={(e) => setBikeForm({ ...bikeForm, bikeCode: e.target.value })}
                                    placeholder="VD: EB-001"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạm sạc</label>
                                <select
                                    value={bikeForm.stationId}
                                    onChange={(e) => setBikeForm({ ...bikeForm, stationId: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Chọn trạm</option>
                                    {stations.map((s) => (
                                        <option key={s.station_id} value={s.station_id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mức pin (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={bikeForm.batteryLevel}
                                    onChange={(e) => setBikeForm({ ...bikeForm, batteryLevel: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowAddBike(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddBike}
                                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                Tạo xe & QR
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add Station Modal */}
            {showAddStation && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4"
                    >
                        <h2 className="text-xl font-bold text-gray-900">Thêm trạm sạc mới</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên trạm</label>
                                <input
                                    type="text"
                                    value={stationForm.name}
                                    onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                                    placeholder="VD: Trạm Công viên 23/9"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={stationForm.address}
                                    onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                                    placeholder="VD: 123 Nguyễn Huệ, Q1"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vĩ độ (Lat)</label>
                                    <input
                                        type="text"
                                        value={stationForm.gpsLat}
                                        onChange={(e) => setStationForm({ ...stationForm, gpsLat: e.target.value })}
                                        placeholder="10.762622"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ (Lng)</label>
                                    <input
                                        type="text"
                                        value={stationForm.gpsLng}
                                        onChange={(e) => setStationForm({ ...stationForm, gpsLng: e.target.value })}
                                        placeholder="106.660172"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số chỗ đỗ</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={stationForm.totalSlots}
                                        onChange={(e) => setStationForm({ ...stationForm, totalSlots: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Solar (kW)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={stationForm.solarCapacity}
                                        onChange={(e) => setStationForm({ ...stationForm, solarCapacity: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowAddStation(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddStation}
                                className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                            >
                                Tạo trạm & QR
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* QR Modal */}
            {qrData && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-sm p-6 text-center"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            QR {qrData.type === 'ebike' ? 'Xe điện' : 'Trạm sạc'}
                        </h2>
                        <p className="text-lg font-semibold text-blue-600 mb-4">{qrData.code}</p>
                        <div className="flex justify-center mb-4">
                            <SimpleQRCode
                                data={JSON.stringify({
                                    type: qrData.type,
                                    id: qrData.id,
                                    code: qrData.code
                                })}
                                size={200}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mb-4">ID: {qrData.id}</p>
                        <button
                            onClick={() => setQrData(null)}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Đóng
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: number;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    );
}
