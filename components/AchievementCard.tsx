'use client';

import { motion } from 'framer-motion';
import { UserAchievement } from '@/lib/types';
import { Lock, CheckCircle } from 'lucide-react';

interface AchievementCardProps {
  achievement: UserAchievement;
  isUnlocked?: boolean;
}

const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-orange-600',
};

const rarityBorders = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400',
};

export default function AchievementCard({ achievement, isUnlocked = false }: AchievementCardProps) {
  const rarity = achievement.achievement?.rarity || 'common';
  const progress = achievement.progress || 0;
  const requirement = achievement.achievement?.requirement || 100;
  const percentage = Math.min((progress / requirement) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`relative p-6 rounded-2xl border-2 ${rarityBorders[rarity]} ${
        isUnlocked ? 'bg-white' : 'bg-gray-100 opacity-70'
      } shadow-lg transition-all`}
    >
      {/* Rarity Gradient Background */}
      {isUnlocked && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${rarityColors[rarity]} opacity-10 rounded-2xl`}
        />
      )}

      {/* Icon & Status */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="text-5xl">{achievement.achievement?.icon}</div>
        {isUnlocked ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <Lock className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {/* Name & Description */}
      <div className="relative">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {achievement.achievement?.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {achievement.achievement?.description}
        </p>

        {/* Rarity Badge */}
        <div className="inline-block mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${rarityColors[rarity]}`}
          >
            {rarity.toUpperCase()}
          </span>
        </div>

        {/* Progress Bar (if not unlocked) */}
        {!isUnlocked && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>
                {progress}/{requirement}
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full bg-gradient-to-r ${rarityColors[rarity]}`}
              />
            </div>
          </div>
        )}

        {/* Reward */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-green-600">
            +{achievement.achievement?.rewardPoints} Points
          </span>
          {achievement.achievement?.specialReward && (
            <span className="text-xs text-gray-500">
              + {achievement.achievement.specialReward}
            </span>
          )}
        </div>

        {/* Unlocked Date */}
        {isUnlocked && achievement.unlockedAt && (
          <div className="mt-2 text-xs text-gray-500">
            Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

