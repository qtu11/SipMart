'use client';

import { motion } from 'framer-motion';
import { Reward } from '@/lib/types';
import { Gift, Star, Heart, Award } from 'lucide-react';
import Image from 'next/image';

interface RewardCardProps {
  reward: Reward;
  onClaim?: (rewardId: string) => void;
  userPoints?: number;
}

const categoryIcons = {
  voucher: Gift,
  merchandise: Star,
  privilege: Award,
  charity: Heart,
};

const categoryColors = {
  voucher: 'bg-blue-500',
  merchandise: 'bg-purple-500',
  privilege: 'bg-yellow-500',
  charity: 'bg-green-500',
};

export default function RewardCard({ reward, onClaim, userPoints = 0 }: RewardCardProps) {
  const Icon = categoryIcons[reward.category];
  const canAfford = userPoints >= reward.pointsCost;
  const isOutOfStock = reward.stock <= 0;
  const isExpired = reward.validUntil && new Date(reward.validUntil) < new Date();

  const handleClaim = () => {
    if (canAfford && !isOutOfStock && !isExpired && onClaim) {
      onClaim(reward.rewardId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 transition-all"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {reward.image ? (
          <Image
            src={reward.image}
            alt={reward.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-20 h-20 text-gray-400" />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <div className={`${categoryColors[reward.category]} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {reward.category.toUpperCase()}
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">OUT OF STOCK</span>
          </div>
        )}

        {/* Expired Overlay */}
        {isExpired && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">EXPIRED</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{reward.name}</h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {reward.description}
        </p>

        {/* Stock */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500">
            {reward.stock > 0 ? `${reward.stock} left` : 'Out of stock'}
          </span>
          {reward.validUntil && (
            <span className="text-xs text-gray-500">
              Valid until {new Date(reward.validUntil).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Points Cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-green-600">
              {reward.pointsCost.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">points</span>
          </div>
        </div>

        {/* Claim Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClaim}
          disabled={!canAfford || isOutOfStock || isExpired}
          className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all ${
            canAfford && !isOutOfStock && !isExpired
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {!canAfford && !isOutOfStock && !isExpired
            ? `Need ${(reward.pointsCost - userPoints).toLocaleString()} more points`
            : isOutOfStock
            ? 'Out of Stock'
            : isExpired
            ? 'Expired'
            : 'Claim Reward'}
        </motion.button>
      </div>
    </motion.div>
  );
}

