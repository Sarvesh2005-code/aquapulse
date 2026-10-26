import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Droplets,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  Activity,
  ArrowUpRight,
  HelpCircle,
  Wrench,
  Flower2,
  CheckCircle,
  Info,
  Layers,
  WifiOff,
} from 'lucide-react';
import { SharedDataContext } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { formatIST, formatRelativeTime } from '../utils/timeFormat';

export function Overview() {
  const { sensorData, analysis, isOnline, lastUpdated, secondsSincePing, isLoading } =
    useOutletContext<SharedDataContext>();

  if (!sensorData || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-500">
          <Droplets className="w-8 h-8 animate-bounce text-teal-600 dark:text-teal-400" />
          <div className="absolute inset-0 rounded-3xl border-2 border-teal-500/30 animate-ping"></div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Connecting to AquaPulse ESP32...
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Retrieving real-time water telemetry and running AI dermatological classifier.
          </p>
        </div>
      </div>
    );
  }

  // WQI Score evaluation
  const score = analysis.health_score;
  let scoreColor = '#10b981'; // emerald
  let scoreBgGradient = 'from-emerald-500/10 via-teal-500/5 to-transparent';
  let scoreLabel = isOnline ? 'Excellent Quality' : 'Device Offline';
  let badgeStatus: 'safe' | 'warning' | 'danger' = isOnline ? 'safe' : 'warning';

  if (isOnline) {
    if (score < 50 || analysis.risk_level === 'High Risk' || analysis.quality_class === 'Unsafe') {
      scoreColor = '#f43f5e'; // rose
      scoreBgGradient = 'from-rose-500/10 via-amber-500/5 to-transparent';
      scoreLabel = 'Water Quality Critical';
      badgeStatus = 'danger';
    } else if (score < 75 || analysis.quality_class === 'Moderate') {
      scoreColor = '#f59e0b'; // amber
      scoreBgGradient = 'from-amber-500/10 via-yellow-500/5 to-transparent';
      scoreLabel = 'Attention Recommended';
      badgeStatus = 'warning';
    }
  } else {
    scoreColor = '#94a3b8'; // slate
    scoreBgGradient = 'from-slate-500/10 via-slate-500/5 to-transparent';
  }

  const isPotable = analysis.potability.toLowerCase().includes('safe');
  const isSkinSafe = analysis.skin_risk.toLowerCase().includes('safe');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Prominent Offline Warning Banner */}
      {!isOnline && (
        <div className="rounded-3xl bg-amber-500/10 border border-amber-500/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <WifiOff className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-amber-950 dark:text-amber-200">
                ESP32 Disconnected — Waiting for hardware telemetry
              </h4>
              <p className="text-xs sm:text-sm text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                No telemetry packet received in the last 30 seconds. Plug in or power on your ESP32 device.
                {lastUpdated && ` Last active transmission was at ${formatIST(lastUpdated)} (${formatRelativeTime(lastUpdated)}).`}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            Hardware Offline
          </span>
        </div>
      )}

      {/* Top Banner & Hero Scorecard */}
      <div
        className={`relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br ${scoreBgGradient} bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left: Overall Health & Potability Status */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={badgeStatus}
                label={scoreLabel}
                size="md"
              />
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                AI Model: {analysis.model_version || 'v1.0'}
              </span>
              {isOnline ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                  Live Telemetry Active
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Awaiting Physical Stream
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {isOnline
                  ? isPotable
                    ? 'Water Safe for Consumption'
                    : 'Filtration Required for Drinking'
                  : 'Device Offline — Awaiting Live Telemetry'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {isOnline
                  ? isSkinSafe
                    ? 'Current chemical equilibrium exhibits balanced mineral saturation, neutral pH, and minimal suspended sediment. No acute epidermal or follicle risks detected.'
                    : `Elevated risk detected: ${analysis.skin_risk}. Prolonged direct exposure may compromise the skin acid mantle and disrupt hair cuticle health.`
                  : 'Hardware stream currently paused. The metrics below represent the last audited snapshot recorded before disconnection.'}
              </p>
            </div>

            {/* Quick Status Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs text-slate-400 font-semibold block">Potability Status</span>
                <span
                  className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${
                    isOnline
                      ? isPotable
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isOnline ? analysis.potability : 'Offline / Cached'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs text-slate-400 font-semibold block">Skin & Hair Assessment</span>
                <span
                  className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${
                    isOnline
                      ? isSkinSafe
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <HeartPulse className="w-4 h-4" />
                  {isOnline ? analysis.skin_risk : 'Awaiting Telemetry'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-400 font-semibold block">Confidence Level</span>
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                  {analysis.probability ? `${(analysis.probability * 100).toFixed(1)}% ML Match` : 'Rule-Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Circular WQI Gauge Meter */}
          <div className="flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-md shrink-0 w-full sm:w-auto min-w-[240px]">
            <div className="relative flex items-center justify-center w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  strokeWidth="9"
                  fill="transparent"
                  className="stroke-slate-100 dark:stroke-slate-700"
                />
                {/* Score Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  strokeWidth="9"
                  strokeDasharray={263.89}
                  strokeDashoffset={isOnline ? 263.89 - (263.89 * score) / 100 : 263.89}
                  strokeLinecap="round"
                  stroke={scoreColor}
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {isOnline ? score : '--'}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isOnline ? 'WQI Index' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="text-center mt-3">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isOnline ? 'Water Quality Score' : 'Awaiting Connection'}
              </span>
              <p className="text-xs text-slate-400">
                {isOnline ? 'Scale: 0 (Severe) - 100 (Optimal)' : 'Connect ESP32 to compute'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Sensor Parameter Cards Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" />
              <span>Active Sensor Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isOnline
                ? 'Live hardware feeds sampled at 10-second intervals from ESP32'
                : 'Hardware telemetry paused. Reconnect ESP32 to resume live stream.'}
            </p>
          </div>
          <Link
            to="/readings"
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 group"
          >
            <span>Live Dial Gauges</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. pH Level Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                pH Balance
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isOnline
                    ? sensorData.ph >= 6.5 && sensorData.ph <= 8.5
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {isOnline
                  ? sensorData.ph < 6.5
                    ? 'Acidic'
                    : sensorData.ph > 8.5
                    ? 'Alkaline'
                    : 'Balanced'
                  : 'Offline'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {isOnline ? sensorData.ph.toFixed(2) : '--'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {isOnline ? 'pH units' : `(Last: ${sensorData.ph.toFixed(2)})`}
              </span>
            </div>

            {/* pH visual horizontal scale */}
            <div className="my-3">
              <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-emerald-400 to-indigo-600 overflow-hidden opacity-80">
                {isOnline && (
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white border border-slate-900 shadow-sm"
                    style={{ left: `${Math.min(100, Math.max(0, (sensorData.ph / 14) * 100))}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>0 (Acid)</span>
                <span className="text-emerald-600 font-bold">6.5 - 8.5 Ideal</span>
                <span>14 (Base)</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              {isOnline
                ? sensorData.ph >= 6.5 && sensorData.ph <= 8.5
                  ? 'Within ideal dermatological range. Safeguards the skin barrier layer.'
                  : sensorData.ph < 6.5
                  ? 'Acidic water may trigger skin stinging and scalp erythema.'
                  : 'Alkaline water strips natural sebum, resulting in dry tightness.'
                : 'Connect ESP32 sensor probe to monitor live acidity/alkalinity.'}
            </p>
          </div>

          {/* 2. TDS Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Dissolved Solids
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isOnline
                    ? (sensorData.tds || 0) <= 300
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : (sensorData.tds || 0) <= 500
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {isOnline ? ((sensorData.tds || 0) <= 500 ? 'Safe' : 'High Hardness') : 'Offline'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {isOnline && sensorData.tds !== null ? Math.round(sensorData.tds) : '--'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {isOnline ? 'ppm' : `(Last: ${Math.round(sensorData.tds || 0)} ppm)`}
              </span>
            </div>

            {/* TDS Progress bar */}
            <div className="my-3">
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (sensorData.tds || 0) <= 500 ? 'bg-teal-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${isOnline ? Math.min(100, ((sensorData.tds || 0) / 1000) * 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>0 ppm</span>
                <span>Max 500 ppm</span>
                <span>800+</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              {isOnline
                ? (sensorData.tds || 0) <= 300
                  ? 'Low dissolved mineral salts. Clean lathering and zero residue.'
                  : (sensorData.tds || 0) <= 500
                  ? 'Moderate mineral concentration. Acceptable for domestic washing.'
                  : 'High mineral hardness. Causes soap scum buildup on skin & hair.'
                : 'Connect TDS sensor probe to evaluate mineral hardness.'}
            </p>
          </div>

          {/* 3. Turbidity Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Turbidity / Clarity
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isOnline
                    ? (sensorData.turbidity || 0) <= 5.0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {isOnline
                  ? (sensorData.turbidity || 0) <= 1.0
                    ? 'Crystal Clear'
                    : (sensorData.turbidity || 0) <= 5.0
                    ? 'Acceptable'
                    : 'Turbid'
                  : 'Offline'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {isOnline && sensorData.turbidity !== null ? sensorData.turbidity.toFixed(2) : '--'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {isOnline ? 'NTU' : `(Last: ${sensorData.turbidity?.toFixed(1) || 0} NTU)`}
              </span>
            </div>

            {/* Turbidity Progress bar */}
            <div className="my-3">
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (sensorData.turbidity || 0) <= 5.0 ? 'bg-cyan-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${isOnline ? Math.min(100, ((sensorData.turbidity || 0) / 20) * 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>0 NTU</span>
                <span>WHO Limit: 5.0</span>
                <span>20+</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              {isOnline
                ? (sensorData.turbidity || 0) <= 5.0
                  ? 'Optical transmission is high. Minimal suspended silt or organic matter.'
                  : 'Elevated particle scatter. Sediment pre-filtration strongly advised.'
                : 'Connect turbidity sensor node to measure optical water clarity.'}
            </p>
          </div>

          {/* 4. Temperature Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Water Temperature
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isOnline
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {isOnline ? 'DS18B20 Live' : 'Offline'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {isOnline
                  ? sensorData.temperature !== null
                    ? sensorData.temperature.toFixed(1)
                    : '25.0'
                  : '--'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {isOnline
                  ? `°C / ${(((sensorData.temperature || 25.0) * 9) / 5 + 32).toFixed(1)}°F`
                  : `(Last: ${sensorData.temperature ? sensorData.temperature.toFixed(1) : '25.0'}°C)`}
              </span>
            </div>

            {/* Temp Progress bar */}
            <div className="my-3">
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-amber-500 transition-all duration-500"
                  style={{
                    width: `${isOnline ? Math.min(
                      100,
                      Math.max(0, (((sensorData.temperature || 25) - 10) / 40) * 100)
                    ) : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>10°C</span>
                <span className="text-teal-600 font-bold">20-28°C Ambient</span>
                <span>50°C</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              {isOnline
                ? sensorData.temperature !== null
                  ? 'Real-time thermal sensor online. Moderate temperature prevents lipid loss.'
                  : 'Estimated temperature baseline active. Sensor disconnected.'
                : 'Connect Dallas DS18B20 digital thermal probe to stream water temperature.'}
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Domain Health & Environmental Impact Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Skin & Scalp Health Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-200/60 dark:border-rose-800/60">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Epidermal & Scalp Impact
              </h4>
              <p className="text-xs text-slate-400">AI Random Forest Classification</p>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              isOnline
                ? isSkinSafe
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <p className="font-bold text-sm mb-1">{isOnline ? analysis.skin_risk : 'Hardware Disconnected'}</p>
            <p>
              {isOnline
                ? analysis.influencing_features && analysis.influencing_features.length > 0
                  ? analysis.influencing_features.join(' ')
                  : 'Water parameters are well-balanced for skin and hair health.'
                : 'AI diagnostic inference paused until ESP32 live stream is established.'}
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
              <span>Moisturize skin within 3 minutes after showering to lock in hydration.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
              <span>Use slightly acidic cleansers (pH 5.5) to reinforce skin barrier.</span>
            </div>
          </div>

          <Link
            to="/health"
            className="inline-flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 gap-1 pt-1"
          >
            <span>Explore Dermatological Diagnostics</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 2. Domestic Appliances & Scaling */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-500 border border-cyan-200/60 dark:border-cyan-800/60">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Household & Appliances
              </h4>
              <p className="text-xs text-slate-400">Scale formation & pipe corrosion</p>
            </div>
          </div>

          <div className="space-y-2">
            {analysis.appliance_impact && analysis.appliance_impact.length > 0 ? (
              analysis.appliance_impact.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                >
                  <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Appliance impact within normal tolerance limits.</p>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 space-y-1">
            <p>• Geyser / Water Heater: {(sensorData.tds || 0) < 300 ? 'Low risk of mineral scaling.' : 'Inspect anode rod periodically.'}</p>
            <p>• RO Membrane Life: {(sensorData.tds || 0) < 500 ? 'Normal filtration duty cycle.' : 'High backpressure on filters.'}</p>
          </div>
        </div>

        {/* 3. Botanical & Plant Suitability */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 md:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 border border-emerald-200/60 dark:border-emerald-800/60">
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Plant Irrigation Index
              </h4>
              <p className="text-xs text-slate-400">Horticultural mineral tolerance</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-2">
              Recommended Compatible Plants:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysis.plant_suitability && analysis.plant_suitability.length > 0 ? (
                analysis.plant_suitability.map((plant, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 rounded-lg font-semibold"
                  >
                    🌿 {plant}
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Unfiltered water not optimal for sensitive flora.</span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            pH between 6.0 and 7.0 is optimal for root micronutrient uptake (Iron, Zinc, Manganese).
          </p>
        </div>
      </div>
    </div>
  );
}
