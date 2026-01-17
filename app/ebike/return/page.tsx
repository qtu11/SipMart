'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EBikeReturnPage() {
    const [activeRental, setActiveRental] = useState<any>(null);
    const [stations, setStations] = useState<any[]>([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [distance, setDistance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        loadActiveRental();
        loadStations();
    }, []);

    const loadActiveRental = async () => {
        try {
            const response = await fetch('/api/ebike/return');
            const data = await response.json();
            if (data.has_active_rental) {
                setActiveRental(data.rental);
            }
        } catch (error) {
            console.error('Failed to load rental:', error);
        }
    };

    const loadStations = async () => {
        // Mock data
        setStations([
            { id: '1', name: 'Trạm 1 - Trường ĐH' },
            { id: '2', name: 'Trạm 2 - Công viên' },
        ]);
    };

    const handleReturn = async () => {
        if (!selectedStation || distance === 0) {
            setError('Vui lòng chọn trạm và nhập khoảng cách');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/ebike/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rentalId: activeRental.rental_id,
                    stationId: selectedStation,
                    distanceKm: distance,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Return failed');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!activeRental) {
        return (
            <div className="container mx-auto max-w-2xl p-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-6xl mb-4">🚲</div>
                        <h3 className="text-xl font-semibold mb-2">
                            Bạn chưa có chuyến đi nào
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Thuê xe để bắt đầu
                        </p>
                        <Button onClick={() => (window.location.href = '/ebike/unlock')}>
                            Thuê xe ngay
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (result) {
        return (
            <div className="container mx-auto max-w-2xl p-4">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="text-center">
                            <CheckCircle className="w-20 h-20 mx-auto text-green-600 mb-4" />
                            <h3 className="text-2xl font-bold text-green-600">
                                ✅ Trả xe thành công!
                            </h3>
                        </div>

                        <Card className="bg-gray-50">
                            <CardContent className="pt-6 space-y-3">
                                <div className="flex justify-between">
                                    <span>Khoảng cách:</span>
                                    <span className="font-bold">{result.distance_km} km</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Phí thuê:</span>
                                    <span className="font-bold">
                                        {result.payment_amount.toLocaleString('vi-VN')} VNĐ
                                    </span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>CO₂ tiết kiệm:</span>
                                    <span className="font-bold">
                                        {result.co2_saved_kg.toFixed(2)} kg
                                    </span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>VNES points:</span>
                                    <span className="font-bold">+{result.vnes_points_earned}</span>
                                </div>
                                <div className="flex justify-between text-purple-600">
                                    <span>Green Credit:</span>
                                    <span className="font-bold">+5 điểm</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            onClick={() => (window.location.href = '/')}
                            className="w-full"
                        >
                            Về trang chủ
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const elapsedHours = parseFloat(activeRental.elapsed_hours || 0);

    return (
        <div className="container mx-auto max-w-2xl p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Trả Xe</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Kết thúc chuyến đi và nhận VNES points
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current Rental Info */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Mã xe:</span>
                                <span className="font-bold">{activeRental.bike_id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Thời gian đã đi:</span>
                                <span className="font-bold">{elapsedHours.toFixed(1)}h</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Pin:</span>
                                <span className="font-bold">
                                    {activeRental.bike?.battery_level}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Station Selection */}
                    <div>
                        <Label>Trạm trả xe</Label>
                        <select
                            className="w-full mt-1 p-2 border rounded-md"
                            value={selectedStation}
                            onChange={(e) => setSelectedStation(e.target.value)}
                        >
                            <option value="">Chọn trạm</option>
                            {stations.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Distance Input */}
                    <div>
                        <Label>Khoảng cách đã đi (km)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            value={distance || ''}
                            onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                            placeholder="5.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Ước tính khoảng cách bạn đã đi
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Return Button */}
                    <Button
                        onClick={handleReturn}
                        disabled={loading || !selectedStation || distance === 0}
                        className="w-full h-14 text-lg"
                    >
                        {loading ? 'Đang xử lý...' : 'Trả xe'}
                    </Button>

                    {/* Estimated Rewards */}
                    {distance > 0 && (
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-4 text-center">
                                <p className="text-sm text-muted-foreground mb-2">Dự kiến nhận:</p>
                                <div className="space-y-1">
                                    <div className="font-bold text-green-600">
                                        ~{(distance * 0.12).toFixed(2)} kg CO₂
                                    </div>
                                    <div className="font-bold text-green-600">
                                        +{Math.floor(distance * 10)} VNES points
                                    </div>
                                    <div className="font-bold text-purple-600">+5 Green Credit</div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
