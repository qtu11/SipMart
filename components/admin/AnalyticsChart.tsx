'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'line';
  showTrend?: boolean;
  trendValue?: number;
}

export default function AnalyticsChart({
  title,
  data,
  type = 'bar',
  showTrend = false,
  trendValue,
}: AnalyticsChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {showTrend && trendValue !== undefined && (
          <div className="flex items-center gap-2">
            {trendValue >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${trendValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trendValue).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {type === 'bar' && (
        <div className="space-y-4">
          {data.map((point, index) => (
            <motion.div
              key={point.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{point.label}</span>
                <span className="font-semibold">{point.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(point.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full rounded-full ${point.color || 'bg-primary-600'}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

