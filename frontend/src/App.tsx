import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Customer Pages
import { DashboardPage } from './pages/customer/DashboardPage';
import { AccountsPage } from './pages/customer/AccountsPage';
import { SendMoneyPage } from './pages/customer/SendMoneyPage';
import { BeneficiariesPage } from './pages/customer/BeneficiariesPage';
import { TransactionHistoryPage } from './pages/customer/TransactionHistoryPage';
import { ScheduledPaymentsPage } from './pages/customer/ScheduledPaymentsPage';
import { SpendingAnalyticsPage } from './pages/customer/SpendingAnalyticsPage';
import { NotificationsPage } from './pages/customer/NotificationsPage';
import { ProfileSettingsPage } from './pages/customer/ProfileSettingsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAccountsPage } from './pages/admin/AdminAccountsPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';
import { AdminFraudAlertsPage } from './pages/admin/AdminFraudAlertsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Authenticating VaultPay session...
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isSupport, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Verifying administrative authority...
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin && !isSupport) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer Banking Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/send-money" element={<SendMoneyPage />} />
              <Route path="/beneficiaries" element={<BeneficiariesPage />} />
              <Route path="/transactions" element={<TransactionHistoryPage />} />
              <Route path="/scheduled-payments" element={<ScheduledPaymentsPage />} />
              <Route path="/analytics" element={<SpendingAnalyticsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfileSettingsPage />} />
            </Route>

            {/* Backoffice Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="accounts" element={<AdminAccountsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="fraud-alerts" element={<AdminFraudAlertsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
