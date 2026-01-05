'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { logger } from '@/lib/logger';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar?: string;
  greenPoints: number;
  totalCupsSaved: number;
  rank: number;
  department?: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard?top=100');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error fetching leaderboard', { error });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />;
    return <span className="text-dark-500 font-bold">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          Bảng xếp hạng
        </h1>
        <p className="text-sm text-dark-500 mt-1">Thi đua sống xanh cùng cộng đồng</p>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Top 3 Podium - Nâng cấp */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 2nd place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-2xl border-2 border-gray-200 text-center"
            >
              <div className="text-5xl mb-3">🥈</div>
              <div className="text-base font-bold text-dark-800 truncate mb-2">
                {leaderboard[1].displayName}
              </div>
              <div className="text-lg text-primary-600 font-bold">
                {leaderboard[1].greenPoints.toLocaleString('vi-VN')}
              </div>
              <div className="text-xs text-dark-400 mt-1">pts</div>
            </motion.div>

            {/* 1st place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl p-6 shadow-2xl text-center transform -translate-y-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)]" />
              <div className="relative z-10">
                <div className="text-6xl mb-3">👑</div>
                <div className="text-lg font-bold text-white truncate mb-2">
                  {leaderboard[0].displayName}
                </div>
                <div className="text-2xl text-white font-bold">
                  {leaderboard[0].greenPoints.toLocaleString('vi-VN')}
                </div>
                <div className="text-xs text-yellow-100 mt-1">pts</div>
              </div>
            </motion.div>

            {/* 3rd place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-white to-orange-50 rounded-3xl p-6 shadow-2xl border-2 border-orange-200 text-center"
            >
              <div className="text-5xl mb-3">🥉</div>
              <div className="text-base font-bold text-dark-800 truncate mb-2">
                {leaderboard[2].displayName}
              </div>
              <div className="text-lg text-primary-600 font-bold">
                {leaderboard[2].greenPoints.toLocaleString('vi-VN')}
              </div>
              <div className="text-xs text-dark-400 mt-1">pts</div>
            </motion.div>
          </div>
        )}

        {/* Rest of leaderboard - Nâng cấp */}
        <div className="space-y-3">
          {leaderboard.slice(3).map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className="bg-white rounded-2xl p-5 shadow-xl border-2 border-dark-100 hover:border-primary-300 flex items-center gap-4 transition-all"
            >
              <div className="flex-shrink-0 w-10 text-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-dark-800 truncate">
                  {entry.displayName}
                </div>
                {entry.department && (
                  <div className="text-xs text-dark-500">{entry.department}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-primary-600">
                  {entry.greenPoints} pts
                </div>
                <div className="text-xs text-dark-500">
                  {entry.totalCupsSaved} ly
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-dark-500">
            Chưa có dữ liệu xếp hạng
          </div>
        )}
      </main>
    </div>
  );
}

