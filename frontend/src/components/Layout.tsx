import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
}
