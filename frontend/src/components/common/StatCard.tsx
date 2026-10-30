import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-200 border ${
        highlight
          ? 'bg-gradient-to-br from-slate-900 to-navy-800 text-white border-slate-700 shadow-xl'
          : 'bg-white text-slate-800 border-slate-200/80 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-slate-300' : 'text-slate-500'}`}>
          {title}
        </p>
        {icon && (
          <div className={`p-2.5 rounded-xl ${highlight ? 'bg-white/10 text-white' : 'bg-slate-50 text-brand-600'}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        {trend && (
          <span
            className={`text-xs font-semibold flex items-center ${
              trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className={`mt-1.5 text-xs ${highlight ? 'text-slate-300' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
