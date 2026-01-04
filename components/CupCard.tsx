'use client';

import { motion } from 'framer-motion';
import { Coffee, Calendar, TrendingUp, CheckCircle } from 'lucide-react';

interface CupCardProps {
  cupId: string;
  material: 'pp_plastic' | 'bamboo_fiber';
  status: 'available' | 'in_use' | 'cleaning' | 'lost';
  totalUses?: number;
  createdAt?: Date;
  lastCleanedAt?: Date;
  onClick?: () => void;
}

export default function CupCard({
  cupId,
  material,
  status,
  totalUses = 0,
  createdAt,
  lastCleanedAt,
  onClick,
}: CupCardProps) {
  const materialNames = {
    pp_plastic: 'Nhựa PP',
    bamboo_fiber: 'Sợi Tre',
  };

  const statusColors = {
    available: 'bg-green-100 text-green-800 border-green-300',
    in_use: 'bg-blue-100 text-blue-800 border-blue-300',
    cleaning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    lost: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusLabels = {
    available: 'Có sẵn',
    in_use: 'Đang sử dụng',
    cleaning: 'Đang vệ sinh',
    lost: 'Đã mất',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white rounded-lg border-2 ${statusColors[status]} p-4 cursor-pointer transition-all shadow-sm hover:shadow-md`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5" />
          <span className="font-mono font-semibold text-lg">{cupId}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Chất liệu:</span>
          <span>{materialNames[material]}</span>
        </div>

        {totalUses > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Số lần sử dụng: {totalUses}</span>
          </div>
        )}

        {createdAt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Tạo: {new Date(createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        )}

        {lastCleanedAt && status === 'available' && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Vệ sinh: {new Date(lastCleanedAt).toLocaleDateString('vi-VN')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}





