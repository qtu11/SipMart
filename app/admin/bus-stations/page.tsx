'use client';

import React, { useState } from 'react';
import { Bus, MapPin, Plus, Construction } from 'lucide-react';
import Link from 'next/link';

export default function BusStationsPage() {
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
                        ← Quay lại Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Trạm Bus</h1>
                    <p className="text-gray-500">Mạng lưới xe buýt xanh & trạm chờ</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 opacity-50 cursor-not-allowed"
                >
                    <Plus className="w-5 h-5" />
                    Thêm Tuyến
                </button>
            </div>

            {/* Content Placeholder */}
            <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bus className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tính năng đang phát triển</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Hệ thống quản lý trạm xe buýt và lộ trình tuyến đang được xây dựng. Vui lòng quay lại sau.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-5 h-5 text-gray-700" />
                            <h3 className="font-semibold">Bản đồ tuyến</h3>
                        </div>
                        <p className="text-sm text-gray-500">Xem lộ trình và vị trí xe buýt theo thời gian thực.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            <Construction className="w-5 h-5 text-gray-700" />
                            <h3 className="font-semibold">Bảo trì</h3>
                        </div>
                        <p className="text-sm text-gray-500">Quản lý lịch bảo dưỡng và sự cố kỹ thuật.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            <Bus className="w-5 h-5 text-gray-700" />
                            <h3 className="font-semibold">Đội xe</h3>
                        </div>
                        <p className="text-sm text-gray-500">Quản lý danh sách xe buýt và tài xế.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
