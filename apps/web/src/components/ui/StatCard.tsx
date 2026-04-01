import { cn } from '@/lib/cn';
import { ComponentType } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'default';
  icon?: ComponentType<{ className?: string }>;
}

const iconBg = {
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
  default: 'bg-gray-100 text-gray-500',
};

const badgeBg = {
  positive: 'bg-green-50 text-green-600',
  negative: 'bg-red-50 text-red-500',
  neutral: 'bg-gray-50 text-gray-400',
};

export function StatCard({ title, value, change, changeType = 'neutral', color = 'default', icon: Icon }: StatCardProps) {
  return (
    <div className="relative rounded-xl bg-white border border-gray-100 p-5 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gray-50/80" />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gray-50/50" />

      <div className="relative">
        {/* Top row: icon + badge */}
        <div className="flex items-center justify-between mb-4">
          {Icon && (
            <div className={cn('p-2.5 rounded-xl', iconBg[color])}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          {change && (
            <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', badgeBg[changeType])}>
              {change}
              {changeType === 'positive' && <TrendingUp className="w-3 h-3" />}
              {changeType === 'negative' && <TrendingDown className="w-3 h-3" />}
            </div>
          )}
        </div>

        {/* Title + Value */}
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
