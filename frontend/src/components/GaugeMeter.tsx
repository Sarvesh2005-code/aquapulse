import React from 'react';

interface GaugeMeterProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  optimalMin?: number;
  optimalMax?: number;
  decimals?: number;
  size?: number;
  isOffline?: boolean;
}

export const GaugeMeter: React.FC<GaugeMeterProps> = ({
  value,
  min,
  max,
  unit,
  label,
  optimalMin,
  optimalMax,
  decimals = 1,
  size = 200,
  isOffline = false,
}) => {
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = isOffline ? 0 : Math.max(0, Math.min(1, (clampedValue - min) / (max - min || 1)));

  const startAngle = 150;
  const totalSweep = 240;
  const currentAngle = startAngle + percentage * totalSweep;

  const cx = 100;
  const cy = 105;
  const radius = 68;
  const strokeWidth = 10;

  const polarToCartesian = (angleDeg: number, r: number = radius) => {
    const rad = (angleDeg * Math.PI) / 180.0;
    return {
      x: +(cx + r * Math.cos(rad)).toFixed(2),
      y: +(cy + r * Math.sin(rad)).toFixed(2),
    };
  };

  const startPt = polarToCartesian(startAngle);
  const endPt = polarToCartesian(startAngle + totalSweep);
  const currentPt = polarToCartesian(currentAngle);

  const backgroundArc = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 1 1 ${endPt.x} ${endPt.y}`;
  const largeArcFlag = percentage > 0.75 ? 1 : 0;
  const progressArc = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${currentPt.x} ${currentPt.y}`;

  // Status & color assessment
  let statusText = 'Optimal';
  let statusBadgeClass =
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
  let strokeColor = '#10b981';
  let glowColor = 'rgba(16, 185, 129, 0.45)';

  if (isOffline) {
    statusText = 'No Signal';
    statusBadgeClass =
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    strokeColor = '#94a3b8';
    glowColor = 'rgba(148, 163, 184, 0.2)';
  } else if (optimalMin !== undefined && optimalMax !== undefined) {
    if (value >= optimalMin && value <= optimalMax) {
      statusText = 'Ideal';
      statusBadgeClass =
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      strokeColor = '#10b981';
      glowColor = 'rgba(16, 185, 129, 0.45)';
    } else {
      const dev = Math.min(Math.abs(value - optimalMin), Math.abs(value - optimalMax));
      if (dev < (optimalMax - optimalMin) * 0.35) {
        statusText = 'Warning';
        statusBadgeClass =
          'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
        strokeColor = '#f59e0b';
        glowColor = 'rgba(245, 158, 11, 0.45)';
      } else {
        statusText = 'Critical';
        statusBadgeClass =
          'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
        strokeColor = '#f43f5e';
        glowColor = 'rgba(244, 63, 94, 0.45)';
      }
    }
  }

  const gradId = `grad-${label.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const glowId = `glow-${label.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full">
      {/* SVG Radial Speedometer Arch */}
      <div className="relative w-full max-w-[200px] flex items-center justify-center">
        <svg viewBox="0 0 200 170" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor={strokeColor} />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={glowColor} />
            </filter>
          </defs>

          {/* Background Track Arch */}
          <path
            d={backgroundArc}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="stroke-slate-200 dark:stroke-slate-700 transition-colors"
          />

          {/* Active Gradient Arch */}
          {!isOffline && percentage > 0.005 && (
            <path
              d={progressArc}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeWidth + 0.5}
              strokeLinecap="round"
              filter={`url(#${glowId})`}
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Indicator Bead at Arch Tip */}
          {!isOffline && (
            <circle
              cx={currentPt.x}
              cy={currentPt.y}
              r={6}
              fill={strokeColor}
              stroke="#ffffff"
              strokeWidth={2}
              className="transition-all duration-700 ease-out drop-shadow-md"
            />
          )}

          {/* Scale Endpoint Labels */}
          <text
            x={startPt.x - 4}
            y={startPt.y + 16}
            textAnchor="middle"
            className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500 font-mono"
          >
            {min}
          </text>
          <text
            x={endPt.x + 4}
            y={endPt.y + 16}
            textAnchor="middle"
            className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500 font-mono"
          >
            {max}
          </text>
        </svg>

        {/* Digital Readout Centered Inside Arch */}
        <div className="absolute top-14 inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums font-mono">
              {isOffline ? '--' : value.toFixed(decimals)}
            </span>
            {unit && !isOffline && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{unit}</span>
            )}
          </div>
          <span
            className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusBadgeClass}`}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Label and Reference Range positioned cleanly below arch */}
      <div className="text-center pt-3 w-full">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</h4>
        {optimalMin !== undefined && optimalMax !== undefined && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Ideal: {optimalMin} - {optimalMax} {unit}
          </p>
        )}
      </div>
    </div>
  );
};
