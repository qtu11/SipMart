'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Bike, Battery, MapPin, AlertTriangle, WifiOff, Wifi,
    Lock, Unlock, RefreshCw, Zap, ThermometerSun
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface BikeData {
    bikeId: string;
    code: string;
    status: string;
    batteryLevel: number;
    location: { lat: number; lng: number };
    lastSeen: string;
    station: any;
    firmwareVersion: string;
    isOnline: boolean;
}

interface StationData {
    station_id: string;
    name: string;
    address: string;
    available_bikes: number;
    total_slots: number;
    current_energy_production_kw: number;
}

interface IoTStats {
    totalBikes: number;
    availableBikes: number;
    inUseBikes: number;
    chargingBikes: number;
    maintenanceBikes: number;
    lowBatteryBikes: number;
    offlineBikes: number;
    totalStations: number;
    totalSolarKw: number;
}

export default function IoTDashboardPage() {
    const [stats, setStats] = useState<IoTStats | null>(null);
    const [bikes, setBikes] = useState<BikeData[]>([]);
    const [stations, setStations] = useState<StationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBike, setSelectedBike] = useState<BikeData | null>(null);
    const [sendingCommand, setSendingCommand] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/iot');
            const data = await res.json();
            setStats(data.stats);
            setBikes(data.bikes || []);
            setStations(data.stations || []);
        } catch (e) {
            console.error(e);
            toast.error('Lỗi tải dữ liệu IoT');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const sendCommand = async (bikeId: string, command: string) => {
        setSendingCommand(true);
        try {
            const res = await fetch('/api/admin/iot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bikeId, command })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Đã gửi lệnh ${command}`);
            } else {
                toast.error(data.error || 'Lỗi gửi lệnh');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        } finally {
            setSendingCommand(false);
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">IoT Dashboard</h1>
                    <p className="text-gray-500">Giám sát xe đạp điện và trạm sạc</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                    <RefreshCw className="w-5 h-5" />
                    Làm mới
                </button>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <StatCard
                        icon={Bike}
                        label="Tổng xe"
                        value={stats.totalBikes}
                        color="blue"
                    />
                    <StatCard
                        icon={Wifi}
                        label="Đang online"
                        value={stats.totalBikes - stats.offlineBikes}
                        color="green"
                    />
                    <StatCard
                        icon={WifiOff}
                        label="Offline"
                        value={stats.offlineBikes}
                        color="red"
                    />
                    <StatCard
                        icon={Battery}
                        label="Pin yếu"
                        value={stats.lowBatteryBikes}
                        color="orange"
                    />
                    <StatCard
                        icon={Zap}
                        label="Solar (kW)"
                        value={stats.totalSolarKw.toFixed(1)}
                        color="yellow"
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bike List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Danh sách xe</h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {bikes.map((bike) => (
                            <div
                                key={bike.bikeId}
                                onClick={() => setSelectedBike(bike)}
                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${selectedBike?.bikeId === bike.bikeId
                                        ? 'bg-blue-50 border-2 border-blue-300'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bike.isOnline ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                        <Bike className={`w-6 h-6 ${bike.isOnline ? 'text-green-600' : 'text-red-600'}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{bike.code}</p>
                                        <p className="text-sm text-gray-500">
                                            {bike.station?.name || 'Không rõ vị trí'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Battery */}
                                    <div className="flex items-center gap-1">
                                        <Battery className={`w-4 h-4 ${bike.batteryLevel > 50 ? 'text-green-500' :
                                                bike.batteryLevel > 20 ? 'text-yellow-500' : 'text-red-500'
                                            }`} />
                                        <span className="text-sm font-medium">{bike.batteryLevel}%</span>
                                    </div>
                                    {/* Status */}
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bike.status === 'available' ? 'bg-green-100 text-green-700' :
                                            bike.status === 'in_use' ? 'bg-blue-100 text-blue-700' :
                                                bike.status === 'charging' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {bike.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {bikes.length === 0 && (
                            <p className="text-center text-gray-500 py-8">Không có xe nào</p>
                        )}
                    </div>
                </div>

                {/* Bike Detail / Commands */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Chi tiết & Điều khiển</h3>
                    {selectedBike ? (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-2xl font-bold text-gray-900">{selectedBike.code}</p>
                                <p className="text-sm text-gray-500">{selectedBike.bikeId}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-600">Pin</p>
                                    <p className="text-xl font-bold text-blue-700">{selectedBike.batteryLevel}%</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-600">Trạng thái</p>
                                    <p className="text-xl font-bold text-green-700">{selectedBike.status}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Vị trí</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {selectedBike.location.lat.toFixed(6)}, {selectedBike.location.lng.toFixed(6)}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Firmware</p>
                                <p className="text-sm font-medium text-gray-800">{selectedBike.firmwareVersion}</p>
                            </div>

                            {/* Commands */}
                            <div className="pt-4 border-t space-y-2">
                                <p className="text-sm font-medium text-gray-700">Điều khiển từ xa</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => sendCommand(selectedBike.bikeId, 'UNLOCK')}
                                        disabled={sendingCommand}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <Unlock className="w-4 h-4" />
                                        Mở khóa
                                    </button>
                                    <button
                                        onClick={() => sendCommand(selectedBike.bikeId, 'LOCK')}
                                        disabled={sendingCommand}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Khóa xe
                                    </button>
                                    <button
                                        onClick={() => sendCommand(selectedBike.bikeId, 'LOCATE')}
                                        disabled={sendingCommand}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        Định vị
                                    </button>
                                    <button
                                        onClick={() => sendCommand(selectedBike.bikeId, 'ALARM_ON')}
                                        disabled={sendingCommand}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Báo động
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            <Bike className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Chọn một xe để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stations */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Trạm sạc Solar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stations.map((station) => (
                        <div key={station.station_id} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-semibold text-gray-900">{station.name}</p>
                                <div className="flex items-center gap-1 text-yellow-600">
                                    <ThermometerSun className="w-4 h-4" />
                                    <span className="text-sm font-medium">{station.current_energy_production_kw} kW</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">{station.address}</p>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Xe có sẵn</span>
                                <span className="font-bold text-green-600">
                                    {station.available_bikes}/{station.total_slots}
                                </span>
                            </div>
                        </div>
                    ))}
                    {stations.length === 0 && (
                        <p className="col-span-3 text-center text-gray-500 py-8">Chưa có trạm nào</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: number | string;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        orange: 'bg-orange-100 text-orange-600',
        yellow: 'bg-yellow-100 text-yellow-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm border"
        >
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </motion.div>
    );
}
