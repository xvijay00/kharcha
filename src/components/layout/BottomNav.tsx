import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Plus,
  Package,
  Receipt,
} from 'lucide-react';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {/* 1. Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1">Home</span>
            </>
          )}
        </NavLink>

        {/* 2. Khata / Credit Ledger */}
        <NavLink
          to="/khata"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Users className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1">Khata</span>
            </>
          )}
        </NavLink>

        {/* 3. Center Raised FAB (+) Quick Cash In / Out */}
        <div className="flex-1 flex justify-center -mt-6">
          <NavLink
            to="/transactions/new"
            className="w-13 h-13 sm:w-14 sm:h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
            title="Add Cash In / Out"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </NavLink>
        </div>

        {/* 4. Inventory */}
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Package className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1">Stock</span>
            </>
          )}
        </NavLink>

        {/* 5. POS Register */}
        <NavLink
          to="/pos"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Receipt className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1">Billing</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
