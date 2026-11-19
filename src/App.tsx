import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BusinessProvider, useBusiness } from './contexts/BusinessContext';
import { ToastProvider } from './components/ui/Toast';
import { LoginPage } from './components/auth/LoginPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TransactionList } from './components/transactions/TransactionList';
import { QuickCashInOut } from './components/transactions/QuickCashInOut';
import { CategoryManager } from './components/categories/CategoryManager';
import { CashDrawerPage } from './components/cash-drawer/CashDrawerPage';
import { KhataPage } from './components/khata/KhataPage';
import { InventoryPage } from './components/inventory/InventoryPage';
import { PosPage } from './components/pos/PosPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { Loader2 } from 'lucide-react';

function LoadingScreen({ message = 'Loading Kharcha...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-xs font-semibold text-gray-500 tracking-wide">{message}</p>
      </div>
    </div>
  );
}

// ProtectedRoute: enforces user authentication
function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Checking authentication..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// BusinessGuard: ensures user has configured at least one business
function BusinessGuard() {
  const { businesses, loading } = useBusiness();
  if (loading) return <LoadingScreen message="Loading business workspace..." />;
  if (businesses.length === 0) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

// RootRedirect: smart routing based on auth and business status
function RootRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { businesses, loading: bizLoading } = useBusiness();

  if (authLoading || (user && bizLoading)) {
    return <LoadingScreen message="Starting Kharcha..." />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (businesses.length === 0) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BusinessProvider>
          <ToastProvider>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                {/* Onboarding doesn't require existing business */}
                <Route path="/onboarding" element={<OnboardingWizard />} />

                {/* Routes requiring active business membership */}
                <Route element={<BusinessGuard />}>
                  <Route element={<AppShell />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/transactions" element={<TransactionList />} />
                    <Route path="/transactions/new" element={<QuickCashInOut />} />
                    <Route path="/khata" element={<KhataPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/pos" element={<PosPage />} />
                    <Route path="/cash-drawer" element={<CashDrawerPage />} />
                    <Route path="/categories" element={<CategoryManager />} />
                    <Route path="/reports" element={<ReportsPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Root index and fallback */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
