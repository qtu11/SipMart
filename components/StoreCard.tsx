'use client';

import { motion } from 'framer-motion';
import { MapPin, Package, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

interface StoreCardProps {
  storeId: string;
  name: string;
  address: string;
  gpsLocation: { lat: number; lng: number };
  cupInventory: {
    available: number;
    inUse: number;
    cleaning: number;
    total: number;
  };
  partnerStatus?: 'active' | 'inactive' | 'pending';
  distance?: number;
  onClick?: () => void;
}

export default function StoreCard({
  storeId,
  name,
  address,
  cupInventory,
  partnerStatus = 'active',
  distance,
  onClick,
}: StoreCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  const statusLabels = {
    active: 'Hoạt động',
    inactive: 'Tạm ngưng',
    pending: 'Chờ duyệt',
  };

  const utilizationRate =
    cupInventory.total > 0
      ? ((cupInventory.inUse / cupInventory.total) * 100).toFixed(1)
      : '0';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-lg border-2 border-gray-200 p-5 cursor-pointer transition-all shadow-sm hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{address}</span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[partnerStatus]}`}>
          {statusLabels[partnerStatus]}
        </span>
      </div>

      {distance !== undefined && (
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
          <Clock className="w-4 h-4" />
          <span>Cách {distance.toFixed(1)} km</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Có sẵn</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{cupInventory.available}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Đang dùng</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{cupInventory.inUse}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Tổng: {cupInventory.total} ly</span>
        <span className="text-gray-500">Sử dụng: {utilizationRate}%</span>
      </div>
    </motion.div>
  );
}





