import React from 'react';

interface BadgeProps {
  status: string;
  type?: 'status' | 'risk' | 'role';
}

export const Badge: React.FC<BadgeProps> = ({ status, type = 'status' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  const normalized = status.toUpperCase();

  if (normalized === 'SUCCESS' || normalized === 'ACTIVE' || normalized === 'RESOLVED_FALSE_POSITIVE' || normalized === 'LOW') {
    colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (normalized === 'PENDING' || normalized === 'PROCESSING' || normalized === 'MEDIUM' || normalized === 'UNDER_REVIEW') {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (normalized === 'FAILED' || normalized === 'REVERSED' || normalized === 'FROZEN' || normalized === 'LOCKED' || normalized === 'SUSPENDED' || normalized === 'HIGH' || normalized === 'CRITICAL' || normalized === 'RESOLVED_FRAUD') {
    colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (normalized.includes('ADMIN')) {
    colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (normalized.includes('SUPPORT')) {
    colorStyles = 'bg-cyan-50 text-cyan-700 border-cyan-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
