'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Wallet, Trophy, MapPin, Bus, Bike, Coffee, ArrowRight, X, CheckCircle, Sparkles, Clock, Shield, Leaf } from 'lucide-react';
import { useState } from 'react';

interface FeatureDetails {
    title: string;
    icon: any;
    color: string;
    description: string;
    details: string[];
    benefits: string[];
}

const cupsFeatures: FeatureDetails[] = [
    {
        title: "Mượn Ly",
        icon: QrCode,
        color: "primary",
        description: "Bắt đầu hành trình xanh của bạn chỉ với một cái chạm",
        details: [
            "Mở ứng dụng SipSmart trên điện thoại",
            "Quét mã QR trên ly tại quán đối tác",
            "Tiền cọc 20.000đ được trừ tự động từ ví VNES",
            "Nhận thông báo xác nhận mượn ly thành công"
        ],
        benefits: ["Không cần mang tiền mặt", "Xử lý trong < 3 giây", "Theo dõi lịch sử mượn"]
    },
    {
        title: "Sử Dụng",
        icon: Coffee,
        color: "orange",
        description: "Thưởng thức đồ uống trong khi góp phần bảo vệ môi trường",
        details: [
            "Thưởng thức đồ uống yêu thích trong ly SipSmart",
            "App tự động đếm ngược thời gian mượn (24-72 giờ)",
            "Nhận thông báo nhắc nhở trước khi hết hạn",
            "Theo dõi tác động môi trường real-time"
        ],
        benefits: ["Ly chất lượng cao", "Giữ nhiệt/lạnh tốt", "An toàn thực phẩm"]
    },
    {
        title: "Trả & Hoàn Tiền",
        icon: Wallet,
        color: "green",
        description: "Trả ly dễ dàng, nhận lại tiền cọc ngay lập tức",
        details: [
            "Đến bất kỳ trạm thu hồi nào trong hệ thống",
            "Quét QR tại trạm để xác nhận trả ly",
            "Tiền cọc được hoàn về ví VNES ngay lập tức",
            "Tích lũy điểm thưởng Green Points"
        ],
        benefits: ["500+ trạm thu hồi", "Hoàn tiền trong 5 giây", "Tích điểm thưởng"]
    },
    {
        title: "Tái Sinh",
        icon: Trophy,
        color: "yellow",
        description: "Ly được làm sạch và tái sử dụng, bạn nhận phần thưởng",
        details: [
            "Ly được vệ sinh theo tiêu chuẩn công nghiệp",
            "Kiểm tra chất lượng trước khi tái sử dụng",
            "Bạn nhận Green Points cho mỗi lần trả ly",
            "Đổi điểm lấy voucher, quà tặng xanh"
        ],
        benefits: ["Giảm 100% rác nhựa", "+50 điểm/lần trả", "Voucher độc quyền"]
    }
];

const busFeatures: FeatureDetails[] = [
    {
        title: "Chạm & Đi",
        icon: QrCode,
        color: "blue",
        description: "Lên xe buýt/metro chỉ với smartphone, không cần thẻ vật lý",
        details: [
            "Mở app SipSmart, chọn 'Vận tải công cộng'",
            "Quét QR tại cổng soát vé hoặc trên xe buýt",
            "Tiền vé được trừ tự động từ ví VNES",
            "Nhận vé điện tử trực tiếp trong app"
        ],
        benefits: ["Không cần thẻ vật lý", "Thanh toán tự động", "Vé điện tử lưu trữ"]
    },
    {
        title: "Di Chuyển",
        icon: Bus,
        color: "blue",
        description: "Tự động tính toán lộ trình và áp dụng giá vé ưu đãi nhất",
        details: [
            "Hệ thống GPS tự động track hành trình",
            "Tính giá vé dựa trên quãng đường thực tế",
            "Áp dụng ưu đãi sinh viên, người cao tuổi",
            "Combo vé ngày/tháng tiết kiệm hơn"
        ],
        benefits: ["Giá chính xác theo km", "Nhiều ưu đãi", "Combo tiết kiệm"]
    },
    {
        title: "Thưởng CO2",
        icon: Trophy,
        color: "blue",
        description: "Nhận điểm thưởng xanh cho mỗi km di chuyển bằng phương tiện công cộng",
        details: [
            "Mỗi km di chuyển = 10 Green Points",
            "Bonus x2 điểm vào giờ thấp điểm",
            "Leaderboard hàng tuần với giải thưởng",
            "Chứng nhận Carbon Footprint cá nhân"
        ],
        benefits: ["10 điểm/km", "Bonus giờ thấp điểm", "Chứng nhận CO2"]
    }
];

const bikeFeatures: FeatureDetails[] = [
    {
        title: "Tìm Xe",
        icon: MapPin,
        color: "teal",
        description: "Định vị trạm xe đạp điện gần nhất và mở khóa chỉ với QR",
        details: [
            "Bản đồ hiển thị tất cả trạm xe gần bạn",
            "Xem số xe còn trống và tình trạng pin",
            "Đặt giữ xe trước 15 phút miễn phí",
            "Quét QR mở khóa xe trong 3 giây"
        ],
        benefits: ["200+ trạm xe", "Đặt trước miễn phí", "Mở khóa tức thì"]
    },
    {
        title: "Lái Xanh",
        icon: Bike,
        color: "teal",
        description: "Tận hưởng chuyến đi với xe điện chất lượng cao, giá cả phải chăng",
        details: [
            "Xe đạp điện cao cấp, pin đầy chạy 40km",
            "Giá thuê chỉ từ 20.000đ/giờ",
            "Bảo hiểm tai nạn miễn phí",
            "Hotline hỗ trợ 24/7 nếu gặp sự cố"
        ],
        benefits: ["Xe cao cấp", "Chỉ từ 20k/giờ", "Bảo hiểm miễn phí"]
    },
    {
        title: "Trả Xe",
        icon: MapPin,
        color: "teal",
        description: "Trả xe tại bất kỳ trạm GPS nào để hoàn thành chuyến đi",
        details: [
            "Trả xe tại bất kỳ trạm nào trong hệ thống",
            "Kết thúc chuyến bằng cách khóa xe",
            "Tiền thuê được tính chính xác từng phút",
            "Nhận Green Points + đánh giá trải nghiệm"
        ],
        benefits: ["Trả linh hoạt", "Tính phí chính xác", "Tích điểm thưởng"]
    }
];

export default function FeatureShowcase() {
    const [activeTab, setActiveTab] = useState<'cups' | 'mobility'>('cups');
    const [selectedFeature, setSelectedFeature] = useState<FeatureDetails | null>(null);

    const getCurrentFeatures = () => {
        if (activeTab === 'cups') return cupsFeatures;
        return [];
    };

    return (
        <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 text-primary-600 font-bold uppercase tracking-wider text-sm bg-primary-50 px-4 py-2 rounded-full"
                    >
                        <Sparkles className="w-4 h-4" />
                        Hệ sinh thái All-in-One
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark-900 mt-4"
                    >
                        Quy trình vận hành thông minh
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg lg:text-xl text-dark-600 mt-4 leading-relaxed"
                    >
                        SipSmart kết nối mọi hoạt động sống xanh của bạn trong một nền tảng duy nhất.
                        <span className="text-primary-600 font-semibold"> Nhấn vào từng bước để xem chi tiết.</span>
                    </motion.p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-12 lg:mb-16">
                    <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 inline-flex">
                        <button
                            onClick={() => setActiveTab('cups')}
                            className={`px-6 lg:px-10 py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-base transition-all flex items-center gap-2 ${activeTab === 'cups'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                                : 'text-dark-500 hover:text-dark-900 hover:bg-gray-50'
                                }`}
                        >
                            <Coffee className="w-5 h-5" />
                            SipSmart Cups
                        </button>
                        <button
                            onClick={() => setActiveTab('mobility')}
                            className={`px-6 lg:px-10 py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-base transition-all flex items-center gap-2 ${activeTab === 'mobility'
                                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                                : 'text-dark-500 hover:text-dark-900 hover:bg-gray-50'
                                }`}
                        >
                            <Bike className="w-5 h-5" />
                            Green Mobility
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'cups' && (
                            <motion.div
                                key="cups"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                {/* Desktop: Horizontal timeline */}
                                <div className="hidden lg:block">
                                    <div className="relative">
                                        {/* Connection line */}
                                        <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-orange-200 via-green-200 to-yellow-200 rounded-full" />

                                        <div className="grid grid-cols-4 gap-6">
                                            {cupsFeatures.map((feature, index) => (
                                                <FeatureCardDesktop
                                                    key={feature.title}
                                                    feature={feature}
                                                    index={index}
                                                    onClick={() => setSelectedFeature(feature)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile: 2-column grid */}
                                <div className="lg:hidden grid grid-cols-2 gap-4">
                                    {cupsFeatures.map((feature, index) => (
                                        <FeatureCardMobile
                                            key={feature.title}
                                            feature={feature}
                                            index={index}
                                            onClick={() => setSelectedFeature(feature)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'mobility' && (
                            <motion.div
                                key="mobility"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-12"
                            >
                                {/* Bus Section */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 lg:p-8 border border-blue-100/50 shadow-sm">
                                    <h3 className="text-xl lg:text-2xl font-bold text-blue-900 mb-8 flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                            <Bus className="w-6 h-6 text-white" />
                                        </div>
                                        Vận tải hành khách (Bus/Metro)
                                    </h3>

                                    {/* Desktop */}
                                    <div className="hidden lg:grid grid-cols-3 gap-6">
                                        {busFeatures.map((feature, index) => (
                                            <FeatureCardDesktop
                                                key={feature.title}
                                                feature={feature}
                                                index={index}
                                                onClick={() => setSelectedFeature(feature)}
                                                variant="blue"
                                            />
                                        ))}
                                    </div>

                                    {/* Mobile */}
                                    <div className="lg:hidden grid grid-cols-2 gap-4">
                                        {busFeatures.map((feature, index) => (
                                            <FeatureCardMobile
                                                key={feature.title}
                                                feature={feature}
                                                index={index}
                                                onClick={() => setSelectedFeature(feature)}
                                                className={index === 2 ? 'col-span-2' : ''}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Bike Section */}
                                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-6 lg:p-8 border border-teal-100/50 shadow-sm">
                                    <h3 className="text-xl lg:text-2xl font-bold text-teal-900 mb-8 flex items-center gap-3">
                                        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                                            <Bike className="w-6 h-6 text-white" />
                                        </div>
                                        Xe đạp điện (e-Bike Sharing)
                                    </h3>

                                    {/* Desktop */}
                                    <div className="hidden lg:grid grid-cols-3 gap-6">
                                        {bikeFeatures.map((feature, index) => (
                                            <FeatureCardDesktop
                                                key={feature.title}
                                                feature={feature}
                                                index={index}
                                                onClick={() => setSelectedFeature(feature)}
                                                variant="teal"
                                            />
                                        ))}
                                    </div>

                                    {/* Mobile */}
                                    <div className="lg:hidden grid grid-cols-2 gap-4">
                                        {bikeFeatures.map((feature, index) => (
                                            <FeatureCardMobile
                                                key={feature.title}
                                                feature={feature}
                                                index={index}
                                                onClick={() => setSelectedFeature(feature)}
                                                className={index === 2 ? 'col-span-2' : ''}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedFeature && (
                    <FeatureDetailModal
                        feature={selectedFeature}
                        onClose={() => setSelectedFeature(null)}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}

// Desktop Feature Card - Premium design
function FeatureCardDesktop({ feature, index, onClick, variant = 'default' }: {
    feature: FeatureDetails;
    index: number;
    onClick: () => void;
    variant?: 'default' | 'blue' | 'teal';
}) {
    const colorMap = {
        primary: { bg: 'bg-primary-500', light: 'bg-primary-100', text: 'text-primary-600', ring: 'ring-primary-500' },
        orange: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-500' },
        green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600', ring: 'ring-green-500' },
        yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-600', ring: 'ring-yellow-500' },
        blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-500' },
        teal: { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-600', ring: 'ring-teal-500' },
    };

    const colors = colorMap[feature.color as keyof typeof colorMap] || colorMap.primary;
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={onClick}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer group border border-gray-100 relative"
        >
            {/* Step number badge - now inside card */}
            <div className={`absolute top-4 right-4 w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform`}>
                {(index + 1).toString().padStart(2, '0')}
            </div>

            {/* Hover overlay */}
            <div className={`absolute inset-0 ${colors.light} opacity-0 group-hover:opacity-30 transition-opacity rounded-2xl`} />

            <div className="relative z-10">
                {/* Icon */}
                <div className={`w-16 h-16 ${colors.light} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 ${colors.text}`} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-dark-900 mb-3">{feature.title}</h3>

                {/* Description */}
                <p className="text-dark-500 text-sm leading-relaxed line-clamp-2 mb-4">
                    {feature.description}
                </p>

                {/* View more indicator */}
                <div className={`flex items-center gap-2 ${colors.text} font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Xem chi tiết
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </motion.div>
    );
}

// Mobile Feature Card - Compact
function FeatureCardMobile({ feature, index, onClick, className = '' }: {
    feature: FeatureDetails;
    index: number;
    onClick: () => void;
    className?: string;
}) {
    const colorMap = {
        primary: { bg: 'bg-primary-500', light: 'bg-primary-100', text: 'text-primary-600' },
        orange: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' },
        green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
        yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-600' },
        blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
        teal: { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-600' },
    };

    const colors = colorMap[feature.color as keyof typeof colorMap] || colorMap.primary;
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer ${className}`}
        >
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 ${colors.light} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${colors.text}`}>{(index + 1).toString().padStart(2, '0')}</span>
                        <h3 className="font-bold text-dark-900 text-sm truncate">{feature.title}</h3>
                    </div>
                    <p className="text-dark-500 text-xs mt-1 line-clamp-2">{feature.description}</p>
                </div>
            </div>
        </motion.div>
    );
}

// Feature Detail Modal
function FeatureDetailModal({ feature, onClose }: { feature: FeatureDetails; onClose: () => void }) {
    const colorMap = {
        primary: { bg: 'bg-primary-500', light: 'bg-primary-50', text: 'text-primary-600', gradient: 'from-primary-500 to-primary-600' },
        orange: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', gradient: 'from-orange-500 to-orange-600' },
        green: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', gradient: 'from-green-500 to-green-600' },
        yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-600', gradient: 'from-yellow-500 to-yellow-600' },
        blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
        teal: { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600', gradient: 'from-teal-500 to-teal-600' },
    };

    const colors = colorMap[feature.color as keyof typeof colorMap] || colorMap.primary;
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${colors.gradient} p-6 rounded-t-3xl relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{feature.title}</h2>
                            <p className="text-white/80 text-sm mt-1">{feature.description}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Steps */}
                    <div>
                        <h3 className="font-bold text-dark-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-dark-400" />
                            Các bước thực hiện
                        </h3>
                        <div className="space-y-3">
                            {feature.details.map((detail, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className={`w-6 h-6 ${colors.bg} rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}>
                                        {idx + 1}
                                    </div>
                                    <p className="text-dark-600 text-sm leading-relaxed">{detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className={`${colors.light} rounded-2xl p-4`}>
                        <h3 className="font-bold text-dark-900 mb-3 flex items-center gap-2">
                            <Leaf className={`w-5 h-5 ${colors.text}`} />
                            Lợi ích
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {feature.benefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <CheckCircle className={`w-4 h-4 ${colors.text}`} />
                                    <span className="text-dark-700 text-sm font-medium">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
