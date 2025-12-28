'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Leaf } from 'lucide-react';

interface VirtualTree {
  level: number;
  growth: number;
  health: 'healthy' | 'wilting' | 'dead';
  totalWaterings: number;
}

export default function TreePage() {
  const [tree, setTree] = useState<VirtualTree | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock userId
  const userId = 'user123';

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const res = await fetch(`/api/tree?userId=${userId}`);
      const data = await res.json();
      setTree(data);
    } catch (error) {
      console.error('Error fetching tree:', error);
      // Fallback mock data
      setTree({
        level: 1,
        growth: 0,
        health: 'healthy',
        totalWaterings: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !tree) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  const getTreeEmoji = (level: number, health: string) => {
    if (health === 'dead') return '💀';
    if (health === 'wilting') return '🍂';
    
    const emojis = ['🌱', '🌿', '🌳', '🌲', '🌴', '🌳', '🌲', '🌳', '🌲', '🌍'];
    return emojis[Math.min(level - 1, emojis.length - 1)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="bg-white shadow-soft px-4 py-4">
        <h1 className="text-xl font-semibold text-dark-800">Cây xanh của bạn</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Tree Display */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-soft text-center"
        >
          <div className="text-8xl mb-4">
            {getTreeEmoji(tree.level, tree.health)}
          </div>
          <div className="text-2xl font-bold text-dark-800 mb-2">
            Level {tree.level}
          </div>
          <div className="text-sm text-dark-500 mb-4">
            {tree.health === 'healthy' && 'Khỏe mạnh'}
            {tree.health === 'wilting' && 'Đang héo'}
            {tree.health === 'dead' && 'Đã chết'}
          </div>

          {/* Growth Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-dark-500 mb-2">
              <span>Tiến độ</span>
              <span>{tree.growth}%</span>
            </div>
            <div className="w-full bg-dark-100 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tree.growth}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  tree.health === 'healthy'
                    ? 'bg-gradient-to-r from-primary-400 to-primary-600'
                    : tree.health === 'wilting'
                    ? 'bg-orange-400'
                    : 'bg-red-400'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-dark-500">
            <Droplet className="w-4 h-4 text-primary-500" />
            <span>Đã tưới {tree.totalWaterings} lần</span>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-primary-400 to-primary-600 text-white rounded-2xl p-5 shadow-medium"
        >
          <div className="flex items-start gap-3">
            <Leaf className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <div className="font-semibold mb-2">Cách chăm sóc cây</div>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Trả ly đúng hạn để tưới cây (+10% growth)</li>
                <li>• Trả quá hạn chỉ tưới được ít (+5% growth)</li>
                <li>• Không tưới 7 ngày → cây héo</li>
                <li>• Không tưới 14 ngày → cây chết</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

