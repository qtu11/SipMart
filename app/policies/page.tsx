'use client';

import { ArrowLeft, ScrollText, ShieldAlert, CreditCard, Clock } from 'lucide-react';
import Link from 'next/link';

export default function PoliciesPage() {
    return (
        <div className="min-h-screen bg-white text-dark-900">
            <header className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group text-dark-600 hover:text-primary-600">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Trang chủ</span>
                    </Link>
                    <h1 className="text-lg font-bold">Chính sách Hoạt động</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="prose prose-lg max-w-none text-dark-700">
                    <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 mb-12 flex gap-4 items-start">
                        <ShieldAlert className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-bold text-primary-800 m-0 mb-2">Nguyên tắc cốt lõi</h3>
                            <p className="m-0 text-sm text-primary-700">
                                SipSmart cam kết vận hành minh bạch, bảo vệ quyền lợi người dùng và đối tác, đồng thời tuân thủ nghiêm ngặt các quy định về bảo vệ môi trường và ESG.
                            </p>
                        </div>
                    </div>

                    <section className="mb-12">
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-dark-900 border-b border-gray-100 pb-4 mb-6">
                            <ScrollText className="w-6 h-6 text-teal-500" />
                            1. Chính sách Ly tái sử dụng (SipSmart Cups)
                        </h2>

                        <h3 className="font-bold text-dark-900 mt-6">1.1. Quy định Tiền cọc (Deposit)</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Người dùng phải đặt cọc <strong>20.000 VNĐ/ly</strong> cho mỗi lần mượn.</li>
                            <li>Tiền cọc được giữ trong <strong>Quỹ Ký quỹ (Escrow)</strong> và không được sử dụng cho mục đích vận hành của công ty.</li>
                            <li>Tiền cọc sẽ được hoàn lại <strong>100%</strong> ngay lập tức khi người dùng trả ly thành công.</li>
                        </ul>

                        <h3 className="font-bold text-dark-900 mt-6">1.2. Thời gian sử dụng & Phạt</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Thời gian sử dụng tối đa cho mỗi lượt mượn là <strong>24 giờ</strong>.</li>
                            <li>Nếu quá 24 giờ chưa trả ly: Hệ thống sẽ tự động trừ 20.000 VNĐ tiền cọc và coi như ly đã được bán cho người dùng.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-dark-900 border-b border-gray-100 pb-4 mb-6">
                            <Clock className="w-6 h-6 text-blue-500" />
                            2. Chính sách Xe đạp điện (e-Bike Sharing)
                        </h2>

                        <h3 className="font-bold text-dark-900 mt-6">2.1. Yêu cầu định danh (eKYC)</h3>
                        <p>Để đảm bảo an toàn tài sản, người dùng BẮT BUỘC phải hoàn thành xác thực danh tính (CCCD + Khuôn mặt) trước khi thuê xe.</p>

                        <h3 className="font-bold text-dark-900 mt-6">2.2. Biểu phí thuê xe</h3>
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 not-prose">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex justify-between border-b border-gray-200 pb-2"><span>1 Giờ</span> <strong>20.000 VNĐ</strong></div>
                                <div className="flex justify-between border-b border-gray-200 pb-2"><span>3 Giờ</span> <strong>45.000 VNĐ</strong></div>
                                <div className="flex justify-between border-b border-gray-200 pb-2"><span>5 Giờ</span> <strong>80.000 VNĐ</strong></div>
                                <div className="flex justify-between pb-2"><span>24 Giờ</span> <strong>120.000 VNĐ</strong></div>
                            </div>
                        </div>

                        <h3 className="font-bold text-dark-900 mt-6">2.3. Quy định Trả xe</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Xe phải được trả tại <strong>đúng trạm sạc</strong> có trên bản đồ SipSmart.</li>
                            <li>Hệ thống GPS sẽ xác nhận vị trí. Nếu cố tình bỏ xe sai vị trí, người dùng sẽ bị phạt thêm <strong>50.000 VNĐ/lần</strong> và có thể bị khóa tài khoản vĩnh viễn.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-dark-900 border-b border-gray-100 pb-4 mb-6">
                            <CreditCard className="w-6 h-6 text-purple-500" />
                            3. Đối tác & Doanh thu
                        </h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>SipSmart áp dụng mô hình <strong>Split Payment</strong>.</li>
                            <li><strong>99.9%</strong> doanh thu vé (Bus/Metro/Thuê xe) được chuyển trực tiếp cho đối tác cung cấp dịch vụ.</li>
                            <li>SipSmart chỉ thu phí nền tảng <strong>0.1%</strong> để bảo trì hệ thống.</li>
                        </ul>
                    </section>

                    <div className="text-center mt-12 pt-8 border-t border-gray-200">
                        <p className="text-sm text-gray-500">Cập nhật lần cuối: 15/05/2026</p>
                        <p className="font-medium text-dark-900 mt-2">Đội ngũ pháp chế SipSmart</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
