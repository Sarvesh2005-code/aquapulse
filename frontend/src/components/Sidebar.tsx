import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, HeartPulse, History, Droplets, Settings, Activity } from 'lucide-react';

export function Sidebar() {
  const links = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview' },
    { to: '/readings', icon: <Activity className="w-5 h-5" />, label: 'Live Readings' },
    { to: '/trends', icon: <Droplets className="w-5 h-5" />, label: 'Water Quality' },
    { to: '/health', icon: <HeartPulse className="w-5 h-5" />, label: 'Health' },
    { to: '/history', icon: <History className="w-5 h-5" />, label: 'History' },
    { to: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg border-r border-gray-100 hidden md:flex flex-col">
      <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
        <Droplets className="h-8 w-8 text-teal-500" />
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">AquaPulse</h1>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
        AquaPulse IoT System v2.0
      </div>
    </aside>
  );
}
