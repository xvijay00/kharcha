import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
}

const COLOR_CLASSES = {
  green: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
  },
  red: {
    border: 'border-l-rose-500',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
  },
  blue: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
  orange: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
  },
  purple: {
    border: 'border-l-purple-500',
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}: StatCardProps) {
  const styles = COLOR_CLASSES[color] || COLOR_CLASSES.blue;

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 ${styles.border} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 tracking-wide">{title}</span>
        <div className={`w-8 h-8 rounded-xl ${styles.iconBg} ${styles.iconText} flex items-center justify-center`}>
          {icon}
        </div>
      </div>

      <div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {(subtitle || trendValue) && (
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
            {trendValue && (
              <span className={`font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trendValue}
              </span>
            )}
            {subtitle && <span className="text-gray-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
