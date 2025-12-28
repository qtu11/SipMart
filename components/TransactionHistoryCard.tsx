'use client';

import { motion } from 'framer-motion';
import { TransactionHistory } from '@/lib/types';
import { CheckCircle, Clock, AlertCircle, ArrowRight, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TransactionHistoryCardProps {
  transaction: TransactionHistory;
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50',
    label: 'Completed',
  },
  ongoing: {
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    label: 'Ongoing',
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    label: 'Overdue',
  },
};

export default function TransactionHistoryCard({ transaction }: TransactionHistoryCardProps) {
  const status = transaction.isOverdue ? 'overdue' : transaction.status;
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
  const Icon = config.icon;

  const borrowTime = new Date(transaction.borrowTime);
  const returnTime = transaction.returnTime ? new Date(transaction.returnTime) : null;

  const duration = returnTime
    ? Math.round((returnTime.getTime() - borrowTime.getTime()) / (1000 * 60 * 60)) // hours
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-5 rounded-xl border ${config.bg} border-gray-200 shadow-sm hover:shadow-md transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">#{transaction.cupId}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color} font-semibold`}>
                {config.label}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(borrowTime, { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Points Earned */}
        {transaction.greenPointsEarned && transaction.greenPointsEarned > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              +{transaction.greenPointsEarned}
            </div>
            <div className="text-xs text-gray-500">Green Points</div>
          </div>
        )}
      </div>

      {/* Stores */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-700">{transaction.borrowStoreName}</span>
        </div>
        {transaction.returnStoreName && (
          <>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="font-medium text-gray-700">{transaction.returnStoreName}</span>
            </div>
          </>
        )}
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500">Borrowed</div>
          <div className="font-semibold text-gray-900">
            {borrowTime.toLocaleString()}
          </div>
        </div>
        {returnTime && (
          <div>
            <div className="text-gray-500">Returned</div>
            <div className="font-semibold text-gray-900">
              {returnTime.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Duration & Financial */}
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
        {duration !== null && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {duration < 1 ? '< 1 hour' : `${duration}h ${duration > 24 ? `(${Math.floor(duration / 24)} days)` : ''}`}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          {transaction.isOverdue && transaction.penaltyAmount && (
            <div className="text-red-600 font-semibold">
              -₫{transaction.penaltyAmount.toLocaleString()} penalty
            </div>
          )}
          {transaction.refundAmount && (
            <div className="text-green-600 font-semibold">
              +₫{transaction.refundAmount.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Material Badge */}
      <div className="mt-3">
        <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
          {transaction.cupMaterial === 'pp_plastic' ? 'PP Plastic' : 'Bamboo Fiber'}
        </span>
      </div>
    </motion.div>
  );
}

