'use client';

import { useState, useEffect } from 'react';
import { Leaf, TrendingUp, Droplets, Zap, Trees } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PersonalESGDashboard() {
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/esg/personal?period=${period}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to load ESG data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-center py-12">Loading...</div>
            </div>
        );
    }

    const esg = data?.personal_esg;

    return (
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">🌍 Tác Động Môi Trường</h1>
                    <p className="text-sm text-muted-foreground">
                        Đóng góp của bạn vào hành tinh xanh
                    </p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hôm nay</SelectItem>
                        <SelectItem value="week">7 ngày</SelectItem>
                        <SelectItem value="month">30 ngày</SelectItem>
                        <SelectItem value="all">Tất cả</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* CO2 Saved */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-green-600" />
                            CO₂ Tiết Kiệm
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">
                            {esg?.co2_saved_kg} kg
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            So với xe máy xăng
                        </p>
                    </CardContent>
                </Card>

                {/* Plastic Reduced */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            Nhựa Giảm Thiểu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">
                            {esg?.plastic_reduced_kg} kg
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ly nhựa 1 lần
                        </p>
                    </CardContent>
                </Card>

                {/* Water Saved */}
                <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-cyan-600" />
                            Nước Tiết Kiệm
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-cyan-700">
                            {esg?.water_saved_liters} lít
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Quy trình sản xuất
                        </p>
                    </CardContent>
                </Card>

                {/* Energy Saved */}
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            Điện Tiết Kiệm
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-700">
                            {esg?.energy_saved_kwh} kWh
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Năng lượng sản xuất
                        </p>
                    </CardContent>
                </Card>

                {/* Trees Equivalent */}
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Trees className="w-4 h-4 text-emerald-600" />
                            Cây Xanh
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-700">
                            {esg?.trees_equivalent} cây
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tương đương/năm
                        </p>
                    </CardContent>
                </Card>

                {/* VNES Points */}
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            VNES Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-700">
                            {esg?.total_vnes_points}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Điểm tích lũy
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Chi Tiết Hoạt Động</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-2">
                                <span className="text-2xl">🚌</span>
                                <span>Chuyến bus/tàu</span>
                            </span>
                            <span className="font-bold">{data?.breakdown.green_mobility_trips}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-2">
                                <span className="text-2xl">🚲</span>
                                <span>Thuê xe đạp điện</span>
                            </span>
                            <span className="font-bold">{data?.breakdown.ebike_rentals}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="flex items-center gap-2">
                                <span className="text-2xl">🥤</span>
                                <span>Ly đã cứu</span>
                            </span>
                            <span className="font-bold">{data?.breakdown.cups_saved}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Motivational Message */}
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardContent className="pt-6 text-center">
                    <div className="text-5xl mb-3">🌍</div>
                    <h3 className="text-2xl font-bold mb-2">
                        Tuyệt vời! Bạn đã đóng góp {esg?.co2_saved_kg}kg CO₂
                    </h3>
                    <p className="text-green-100">
                        Tiếp tục giữ vững phong trào xanh để bảo vệ hành tinh!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
