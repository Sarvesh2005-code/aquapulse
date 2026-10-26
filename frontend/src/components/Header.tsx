import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  RefreshCw,
  Bell,
  Wifi,
  WifiOff,
  Cpu,
  CheckCircle2,
  X,
  Menu,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatISTTimeOnly, formatRelativeTime } from '../utils/timeFormat';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  isOnline: boolean;
  lastUpdated: Date | null;
  secondsSincePing?: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  isOnline,
  lastUpdated,
  secondsSincePing = 999999,
  onManualRefresh,
  isRefreshing,
}) => {
  const {
    isDarkMode,
    toggleDarkMode,
    refreshInterval,
    setRefreshInterval,
    alerts,
    dismissAlert,
  } = useApp();

  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const [currentISTTime, setCurrentISTTime] = useState<string>('');
  const location = useLocation();

  // Keep a live 1-second clock in IST
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentISTTime(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return { title: 'Executive Overview', subtitle: 'Real-time Water Quality Index & Health Diagnostics' };
      case '/readings':
        return { title: 'Live Telemetry Lab', subtitle: 'High-frequency ESP32 sensor telemetry streams' };
      case '/trends':
        return { title: 'Water Quality Analytics', subtitle: 'Historical parameter trajectories & WHO benchmarks' };
      case '/health':
        return { title: 'AI Health & Dermatology', subtitle: 'Random Forest risk prediction & preventive remedies' };
      case '/history':
        return { title: 'Telemetry & Incident Logs', subtitle: 'Comprehensive multi-sensor audit trail & data export' };
      case '/settings':
        return { title: 'System & IoT Configuration', subtitle: 'Hardware calibration, threshold rules, & network parameters' };
      default:
        return { title: 'AquaPulse Monitor', subtitle: 'Intelligent Water Quality System' };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Titles */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{title}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Telemetry pill, Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live Indian Standard Time (IST) Clock */}
          <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{currentISTTime} IST</span>
          </div>

          {/* IoT ESP32 Connection Pill */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">ESP32 Live</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {secondsSincePing < 5 ? 'Just now' : `${secondsSincePing}s ago`}
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>ESP32 Disconnected</span>
                <span className="hidden lg:inline text-[10px] opacity-75">
                  ({lastUpdated ? `Last seen ${formatRelativeTime(lastUpdated)}` : 'No signal'})
                </span>
              </>
            )}
          </div>

          {/* Polling / Manual Refresh Button */}
          <div className="relative">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
              <button
                onClick={onManualRefresh}
                disabled={isRefreshing}
                className="px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                title="Fetch latest telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-500' : ''}`} />
                <span className="hidden md:inline font-medium">Sync</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />

              <button
                onClick={() => setShowRefreshMenu(prev => !prev)}
                className="flex items-center space-x-1 px-2 py-1 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 font-medium"
              >
                <span>{refreshInterval === 0 ? 'Manual' : `${refreshInterval / 1000}s`}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {showRefreshMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95">
                {[
                  { label: 'Realtime (2s)', ms: 2000 },
                  { label: 'Normal (3s)', ms: 3000 },
                  { label: 'Standard (5s)', ms: 5000 },
                  { label: 'Paused', ms: 0 },
                ].map(opt => (
                  <button
                    key={opt.ms}
                    onClick={() => {
                      setRefreshInterval(opt.ms);
                      setShowRefreshMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center justify-between ${
                      refreshInterval === opt.ms
                        ? 'text-teal-600 dark:text-teal-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {refreshInterval === opt.ms && <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications / Alerts Button */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDrawer(prev => !prev)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>

            {showAlertsDrawer && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-30 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    System Alerts & Log
                  </span>
                  <button
                    onClick={() => setShowAlertsDrawer(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No active alerts. All systems normal.</p>
                  ) : (
                    alerts.map((msg, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2"
                      >
                        <span className="text-slate-700 dark:text-slate-300 leading-snug">{msg}</span>
                        <button
                          onClick={() => dismissAlert(idx)}
                          className="text-slate-400 hover:text-rose-500 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
