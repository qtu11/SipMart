'use client';

import { useState, useEffect } from 'react';
import { Bike, Battery, MapPin, Clock, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EBikeUnlockPage() {
    const [step, setStep] = useState<'select' | 'unlock' | 'active'>('select');
    const [stations, setStations] = useState<any[]>([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [availableBikes, setAvailableBikes] = useState<any[]>([]);
    const [selectedBike, setSelectedBike] = useState('');
    const [plan, setPlan] = useState<number>(3); // 1, 3, 5, 24 hours
    const [loading, setLoading] = useState(false);
    const [rental, setRental] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStations();
    }, []);

    useEffect(() => {
        if (selectedStation) {
            loadAvailableBikes(selectedStation);
        }
    }, [selectedStation]);

    const loadStations = async () => {
        // Mock data - replace with actual API
        setStations([
            {
                id: '1',
                name: 'Trạm 1 - Trường ĐH',
                address: '123 Đường ABC',
                available_bikes: 5,
            },
            {
                id: '2',
                name: 'Trạm 2 - Công viên',
                address: '456 Đường XYZ',
                available_bikes: 3,
            },
        ]);
    };

    const loadAvailableBikes = async (stationId: string) => {
        try {
            const response = await fetch(`/api/ebike/unlock?stationId=${stationId}`);
            const data = await response.json();
            setAvailableBikes(data.bikes || []);
        } catch (error) {
            console.error('Failed to load bikes:', error);
        }
    };

    const handleUnlock = async () => {
        if (!selectedBike || !selectedStation) {
            setError('Vui lòng chọn xe');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/ebike/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bikeId: selectedBike,
                    stationId: selectedStation,
                    plannedDurationHours: plan,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.action_required === 'complete_ekyc') {
                    setError('Bạn cần hoàn thành xác thực eKYC trước khi thuê xe.');
                    setTimeout(() => {
                        window.location.href = '/ekyc';
                    }, 2000);
                    return;
                }
                throw new Error(data.error || 'Unlock failed');
            }

            setRental(data);
            setStep('active');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const pricing = {
        1: 20000,
        3: 45000,
        5: 80000,
        24: 120000,
    };

    return (
        <div className="container mx-auto max-w-2xl p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Bike className="text-green-600" />
                        Thuê Xe Đạp Điện
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Di chuyển xanh, kiếm VNES points
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 'select' && (
                        <>
                            {/* Station Selection */}
                            <div>
                                <Label>Chọn trạm xe</Label>
                                <Select value={selectedStation} onValueChange={setSelectedStation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạm gần bạn" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stations.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name} ({s.available_bikes} xe)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bike Selection */}
                            {availableBikes.length > 0 && (
                                <div>
                                    <Label>Chọn xe</Label>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {availableBikes.map((bike) => (
                                            <Card
                                                key={bike.bike_id}
                                                className={`cursor-pointer transition-all ${selectedBike === bike.bike_id
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'hover:border-gray-400'
                                                    }`}
                                                onClick={() => setSelectedBike(bike.bike_id)}
                                            >
                                                <CardContent className="pt-4 text-center">
                                                    <Bike className="w-8 h-8 mx-auto mb-2" />
                                                    <div className="font-medium">{bike.bike_id}</div>
                                                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                                        <Battery className="w-4 h-4" />
                                                        {bike.battery_level}%
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Plan Selection */}
                            <div>
                                <Label>Chọn gói thời gian</Label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {Object.entries(pricing).map(([hours, price]) => (
                                        <Button
                                            key={hours}
                                            variant={plan === Number(hours) ? 'default' : 'outline'}
                                            onClick={() => setPlan(Number(hours))}
                                            className="h-auto py-4"
                                        >
                                            <div>
                                                <div className="font-bold">{hours}h</div>
                                                <div className="text-xs">{price.toLocaleString('vi-VN')}đ</div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Unlock Button */}
                            <Button
                                onClick={handleUnlock}
                                disabled={loading || !selectedBike}
                                className="w-full h-14 text-lg"
                            >
                                {loading ? (
                                    'Đang mở khóa...'
                                ) : (
                                    <>
                                        <QrCode className="mr-2" />
                                        Mở khóa xe - {pricing[plan as keyof typeof pricing].toLocaleString('vi-VN')}đ
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {step === 'active' && rental && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🚲</div>
                                <h3 className="text-2xl font-bold text-green-600">
                                    Xe đã mở khóa!
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Chuyến đi của bạn đã bắt đầu
                                </p>
                            </div>

                            <Card className="bg-gray-50">
                                <CardContent className="pt-6 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span>Mã xe:</span>
                                        <span className="font-bold">{rental.bike_id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Gói thuê:</span>
                                        <span className="font-bold">{plan}h</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Phí:</span>
                                        <span className="font-bold">
                                            {rental.fare.toLocaleString('vi-VN')} VNĐ
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Alert>
                                <Clock className="h-4 w-4" />
                                <AlertDescription>
                                    Vui lòng trả xe tại trạm sạc để kết thúc chuyến đi
                                </AlertDescription>
                            </Alert>

                            <Button
                                onClick={() => (window.location.href = '/ebike/return')}
                                className="w-full"
                            >
                                Đi đến trang trả xe
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="pt-4 text-center">
                        <div className="text-2xl font-bold text-green-600">10 pts</div>
                        <div className="text-xs text-muted-foreground">per km</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 text-center">
                        <div className="text-2xl font-bold text-green-600">0.12 kg</div>
                        <div className="text-xs text-muted-foreground">CO₂/km</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 text-center">
                        <div className="text-2xl font-bold text-green-600">+5</div>
                        <div className="text-xs text-muted-foreground">Credit</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
