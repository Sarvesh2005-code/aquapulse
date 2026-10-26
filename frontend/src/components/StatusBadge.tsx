import React from 'react';

interface StatusBadgeProps {
  status: 'safe' | 'warning' | 'danger' | 'info' | 'neutral';
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const styles = {
    safe: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
      dotPing: 'bg-emerald-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      dot: 'bg-amber-500',
      dotPing: 'bg-amber-400',
    },
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/60',
      dot: 'bg-rose-500',
      dotPing: 'bg-rose-400',
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/60',
      dot: 'bg-sky-500',
      dotPing: 'bg-sky-400',
    },
    neutral: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
      dotPing: 'bg-slate-300',
    },
  }[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-3 py-1 text-xs font-semibold',
    lg: 'px-4 py-1.5 text-sm font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.dotPing}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`}></span>
        </span>
      )}
      <span>{label}</span>
    </span>
  );
};
