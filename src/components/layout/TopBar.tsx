import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBusiness } from '../../hooks/useBusiness';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getInitials } from '../../lib/utils';
import {
  ChevronDown,
  Store,
  Plus,
  LogOut,
  Check,
  Grid,
  Calculator,
  PieChart,
  Tags,
  ArrowLeftRight,
} from 'lucide-react';

export function TopBar() {
  const navigate = useNavigate();
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness();
  const { user, signOut } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const shopMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shopMenuRef.current && !shopMenuRef.current.contains(e.target as Node)) {
        setShopMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userDisplayName =
    user?.user_metadata?.full_name || user?.email || 'User';
  const initials = getInitials(userDisplayName);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 shadow-sm z-30 px-4">
      <div className="max-w-lg mx-auto h-full flex items-center justify-between">
        {/* Left: Multi-Shop Switcher */}
        <div className="relative" ref={shopMenuRef}>
          <button
            onClick={() => setShopMenuOpen(!shopMenuOpen)}
            className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all text-left"
          >
            {/* Online Status Dot */}
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
              title={isOnline ? 'Online' : 'Offline mode'}
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-gray-900 max-w-[150px] truncate leading-tight">
                {currentBusiness?.name || 'My Business'}
              </span>
              <span className="text-[10px] text-gray-400 capitalize leading-none">
                {currentBusiness?.business_type?.replace('_', ' ') || 'Shop'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-0.5" />
          </button>

          {/* Shop Switcher Dropdown */}
          {shopMenuOpen && (
            <div className="absolute top-12 left-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 border-b border-gray-100 mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Switch Shop / Branch
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                {businesses.map((biz) => {
                  const isCurrent = biz.id === currentBusiness?.id;
                  return (
                    <button
                      key={biz.id}
                      onClick={() => {
                        setCurrentBusiness(biz.id);
                        setShopMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        isCurrent ? 'bg-blue-50/70 font-semibold text-blue-700' : 'text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Store className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="truncate">
                          <p className="text-xs truncate">{biz.name}</p>
                          <p className="text-[10px] text-gray-400 capitalize">
                            {biz.business_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 mt-1 border-t border-gray-100 px-2">
                <button
                  onClick={() => {
                    setShopMenuOpen(false);
                    navigate('/onboarding');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create New Business</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Tools + User Menu */}
        <div className="flex items-center gap-2">
          {/* Quick Tools Menu */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all active:scale-95"
              title="More Modules"
            >
              <Grid className="w-4 h-4" />
            </button>

            {toolsMenuOpen && (
              <div className="absolute top-12 right-0 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <Link
                  to="/transactions"
                  onClick={() => setToolsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                  <span>Day-Book Entries</span>
                </Link>

                <Link
                  to="/cash-drawer"
                  onClick={() => setToolsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <span>Cash Drawer (Galla)</span>
                </Link>

                <Link
                  to="/reports"
                  onClick={() => setToolsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <span>Reports & P&L</span>
                </Link>

                <Link
                  to="/categories"
                  onClick={() => setToolsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Tags className="w-4 h-4 text-purple-600" />
                  <span>Category Manager</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all"
              title={userDisplayName}
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute top-12 right-0 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-gray-100">
                  <p className="font-semibold text-xs text-gray-900 truncate">{userDisplayName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await signOut();
                    navigate('/login');
                  }}
                  className="w-full px-3.5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
