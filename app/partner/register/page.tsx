'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, MapPin, Phone, Mail, Check, Upload } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPartnerPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        storeName: '',
        ownerName: '',
        businessType: '',
        address: '',
        phone: '',
        email: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/partner/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Đăng ký thất bại');
            }

            toast.success(data.message || 'Đăng ký thành công!');

            // Redirect based on response or logic
            setTimeout(() => router.push('/partner/dashboard'), 1500);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
            <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <Link href="/map" className="p-2 hover:bg-primary-50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-dark-600" />
                    </Link>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        Đăng ký Đối tác
                    </h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 shadow-xl border border-primary-100"
                >
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Store className="w-10 h-10 text-primary-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-dark-800 mb-2">Đăng ký Đối tác</h2>
                        <p className="text-dark-500">
                            Tham gia mạng lưới SipSmart để thu hút khách hàng xanh và bảo vệ môi trường
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">Tên cửa hàng</label>
                            <div className="relative">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input
                                    type="text"
                                    name="storeName"
                                    required
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: Cafe Xanh"
                                    className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">Người đại diện</label>
                            <input
                                type="text"
                                name="ownerName"
                                required
                                value={formData.ownerName}
                                onChange={handleChange}
                                placeholder="Họ và tên của bạn"
                                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">Loại kinh doanh</label>
                            <div className="relative">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <select
                                    name="businessType"
                                    required
                                    value={formData.businessType}
                                    onChange={handleChange as any}
                                    className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none bg-white"
                                >
                                    <option value="" disabled>Chọn mô hình kinh doanh</option>
                                    <option value="cafe">Quán Cafe</option>
                                    <option value="store">Cửa hàng tiện lợi (Bách hóa xanh, ...)</option>
                                    <option value="supermarket">Siêu thị / TTTM (Vincom, Go!, ...)</option>
                                    <option value="electronic">Điện máy (Điện máy xanh, ...)</option>
                                    <option value="transport_bus">Vận tải - Xe Bus</option>
                                    <option value="transport_ev">Vận tải - Xe điện (Taxi, Tram)</option>
                                    <option value="office">Tòa nhà văn phòng</option>
                                    <option value="school">Trường học / Campus</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">Địa chỉ</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input
                                    type="text"
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Địa chỉ cửa hàng..."
                                    className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">Số điện thoại</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="09..."
                                        className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="email@..."
                                        className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">Giới thiệu ngắn</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Một chút về quán của bạn..."
                                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                'Đang gửi...'
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Gửi Đăng Ký
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}
