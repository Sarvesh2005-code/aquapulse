import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Droplets,
  HeartPulse,
  History,
  Settings,
  X,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isOnline,
}) => {
  const links = [
    {
      to: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Overview',
      badge: 'Live',
    },
    {
      to: '/readings',
      icon: <Activity className="w-5 h-5" />,
      label: 'Live Telemetry',
      badge: null,
    },
    {
      to: '/trends',
      icon: <Droplets className="w-5 h-5" />,
      label: 'Water Quality',
      badge: null,
    },
    {
      to: '/health',
      icon: <HeartPulse className="w-5 h-5" />,
      label: 'Health & AI Risk',
      badge: 'ML',
    },
    {
      to: '/history',
      icon: <History className="w-5 h-5" />,
      label: 'Telemetry Logs',
      badge: null,
    },
    {
      to: '/settings',
      icon: <Settings className="w-5 h-5" />,
      label: 'System Settings',
      badge: null,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-md shadow-teal-500/20 text-white">
            <Droplets className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900"></span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Aqua<span className="text-teal-500">Pulse</span>
              </span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 rounded-md">
                IoT
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wide">
              Water & Dermatological AI
            </p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `group relative flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 shadow-sm border border-teal-200/70 dark:border-teal-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center space-x-3">
                  <span
                    className={`transition-colors ${
                      isActive
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                    }`}
                  >
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-teal-600 text-white dark:bg-teal-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Hardware & System Footer Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-teal-500" />
              <span>ESP32 Node</span>
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isOnline
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
              <span>AI Classifier</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              Random Forest v1.0
            </span>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-1">
            IoT Final Year Capstone • 2026
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="fixed left-0 top-0 h-screen w-64 hidden md:block z-30 shadow-lg shadow-slate-900/5">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-50 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
