import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Sticky Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-16 pb-24">
        {/* Offline Banner when disconnected */}
        <div className="mb-3">
          <OfflineBanner />
        </div>
        <Outlet />
      </main>

      {/* Mobile-first Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
