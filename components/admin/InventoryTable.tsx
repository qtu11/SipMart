'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Download } from 'lucide-react';
import CupCard from '@/components/CupCard';

interface Cup {
  cupId: string;
  material: 'pp_plastic' | 'bamboo_fiber';
  status: 'available' | 'in_use' | 'cleaning' | 'lost';
  totalUses: number;
  createdAt: Date;
  lastCleanedAt?: Date;
}

interface InventoryTableProps {
  cups: Cup[];
  onRefresh?: () => void;
}

export default function InventoryTable({ cups, onRefresh }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');

  const filteredCups = cups.filter((cup) => {
    const matchesSearch = cup.cupId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cup.status === statusFilter;
    const matchesMaterial = materialFilter === 'all' || cup.material === materialFilter;
    return matchesSearch && matchesStatus && matchesMaterial;
  });

  const stats = {
    total: cups.length,
    available: cups.filter((c) => c.status === 'available').length,
    inUse: cups.filter((c) => c.status === 'in_use').length,
    cleaning: cups.filter((c) => c.status === 'cleaning').length,
    lost: cups.filter((c) => c.status === 'lost').length,
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold">Quản lý Kho</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
          <Download className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-600">Tổng</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          <p className="text-xs text-gray-600">Có sẵn</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.inUse}</p>
          <p className="text-xs text-gray-600">Đang dùng</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.cleaning}</p>
          <p className="text-xs text-gray-600">Vệ sinh</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
          <p className="text-xs text-gray-600">Mất</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã ly..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="available">Có sẵn</option>
          <option value="in_use">Đang dùng</option>
          <option value="cleaning">Vệ sinh</option>
          <option value="lost">Mất</option>
        </select>
        <select
          value={materialFilter}
          onChange={(e) => setMaterialFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Tất cả chất liệu</option>
          <option value="pp_plastic">Nhựa PP</option>
          <option value="bamboo_fiber">Sợi Tre</option>
        </select>
      </div>

      {/* Cups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCups.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Không tìm thấy ly nào
          </div>
        ) : (
          filteredCups.map((cup) => (
            <CupCard key={cup.cupId} {...cup} />
          ))
        )}
      </div>
    </div>
  );
}


