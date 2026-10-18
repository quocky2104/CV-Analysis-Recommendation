import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100 or 0 to max
  max?: number;
  label?: string;
  showValue?: boolean;
  valueSuffix?: string;
  barColor?: 'primary' | 'success' | 'warning' | 'danger';
}

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  valueSuffix = '%',
  barColor = 'primary',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const colorVariants = {
    primary: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-rose-600',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs font-bold text-slate-800">
          {label && <span>{label}</span>}
          {showValue && (
            <span className="text-slate-700 font-mono font-bold">
              {value}
              {valueSuffix}
            </span>
          )}
        </div>
      )}
      <div
        className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('h-full transition-all duration-500 rounded-full', colorVariants[barColor])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
