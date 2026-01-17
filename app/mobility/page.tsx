'use client';

import { useState, useEffect } from 'react';
import { QrCode, Zap, TrendingUp, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GreenMobilityPage() {
    const [tripType, setTripType] = useState<'bus' | 'metro'>('bus');
    const [partners, setPartners] = useState<any[]>([]);
    const [selectedPartner, setSelectedPartner] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const [routeInfo, setRouteInfo] = useState({
        from: '',
        to: '',
        distance_km: 0,
    });

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        // Mock data - replace with actual API
        setPartners([
            { id: '1', name: 'Bus điện số 109', type: 'bus' },
            { id: '2', name: 'Tàu Metro Line 1', type: 'metro' },
        ]);
    };

    const handleScan = async () => {
        if (!selectedPartner || !routeInfo.from || !routeInfo.to || routeInfo.distance_km === 0) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const fare = tripType === 'bus' ? 7000 : 15000;

            const response = await fetch('/api/mobility/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId: selectedPartner,
                    tripType,
                    fare,
                    routeInfo,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment failed');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Zap className="text-green-600" />
                        Green Mobility - Di chuyển xanh
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Đi bus điện/tàu cao tốc, kiếm VNES points và giảm CO₂
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Trip Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant={tripType === 'bus' ? 'default' : 'outline'}
                            onClick={() => setTripType('bus')}
                            className="h-20"
                        >
                            <div className="text-center">
                                <div className="text-4xl mb-2">🚌</div>
                                <div className="text-sm">Bus điện</div>
                                <div className="text-xs text-muted-foreground">7,000đ</div>
                            </div>
                        </Button>
                        <Button
                            variant={tripType === 'metro' ? 'default' : 'outline'}
                            onClick={() => setTripType('metro')}
                            className="h-20"
                        >
                            <div className="text-center">
                                <div className="text-4xl mb-2">🚄</div>
                                <div className="text-sm">Tàu cao tốc</div>
                                <div className="text-xs text-muted-foreground">15,000đ</div>
                            </div>
                        </Button>
                    </div>

                    {/* Partner Selection */}
                    <div>
                        <Label>Tuyến đường</Label>
                        <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn tuyến đường" />
                            </SelectTrigger>
                            <SelectContent>
                                {partners
                                    .filter((p) => p.type === tripType)
                                    .map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Route Info */}
                    <div className="space-y-3">
                        <div>
                            <Label>Điểm đi</Label>
                            <Input
                                value={routeInfo.from}
                                onChange={(e) =>
                                    setRouteInfo({ ...routeInfo, from: e.target.value })
                                }
                                placeholder="Bến xe Miền Đông"
                            />
                        </div>
                        <div>
                            <Label>Điểm đến</Label>
                            <Input
                                value={routeInfo.to}
                                onChange={(e) =>
                                    setRouteInfo({ ...routeInfo, to: e.target.value })
                                }
                                placeholder="Sân bay Tân Sơn Nhất"
                            />
                        </div>
                        <div>
                            <Label>Khoảng cách (km)</Label>
                            <Input
                                type="number"
                                value={routeInfo.distance_km || ''}
                                onChange={(e) =>
                                    setRouteInfo({
                                        ...routeInfo,
                                        distance_km: parseFloat(e.target.value) || 0,
                                    })
                                }
                                placeholder="12.5"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Scan Button */}
                    <Button
                        onClick={handleScan}
                        disabled={loading}
                        className="w-full h-14 text-lg"
                    >
                        {loading ? (
                            'Đang xử lý...'
                        ) : (
                            <>
                                <QrCode className="mr-2" />
                                Quét QR để thanh toán
                            </>
                        )}
                    </Button>

                    {/* Result */}
                    {result && (
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6 space-y-3">
                                <div className="text-center">
                                    <div className="text-5xl mb-2">✅</div>
                                    <h3 className="text-xl font-bold text-green-700">
                                        Thanh toán thành công!
                                    </h3>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Giá vé:</span>
                                        <span className="font-semibold">
                                            {result.fare.toLocaleString('vi-VN')} VNĐ
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Số dư mới:</span>
                                        <span className="font-semibold">
                                            {result.new_balance.toLocaleString('vi-VN')} VNĐ
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-green-700">
                                        <span>CO₂ tiết kiệm:</span>
                                        <span className="font-bold">
                                            {result.co2_saved_kg.toFixed(2)} kg
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-green-700">
                                        <span>VNES points:</span>
                                        <span className="font-bold">
                                            +{result.vnes_points_earned} điểm
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-center text-green-600 font-medium">
                                    {result.message}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold">10 pts/km</div>
                        <div className="text-xs text-muted-foreground">VNES Points</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Zap className="w-8 h-8 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold">0.12 kg/km</div>
                        <div className="text-xs text-muted-foreground">CO₂ giảm thiểu</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
