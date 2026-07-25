import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useAdmin, AdminProvider } from './context/AdminContext';
import { NotificationProvider } from './context/NotificationContext';
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import CreateCampaignPage from './pages/CreateCampaignPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAuthPage from './pages/AdminAuthPage';
import NGOPartnersPage from './pages/NGOPartnersPage';
import NGOProfilePage from './pages/NGOProfilePage';
import NGORegistrationPage from './pages/NGORegistrationPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen pt-24 flex justify-center items-start">
      <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Admin route uses cookie-based authentication via AdminContext
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdminAuthenticated, isAdminLoading } = useAdmin();

  if (isAdminLoading) return (
    <div className="min-h-screen pt-24 flex justify-center items-start">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdminAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AdminProvider>
        <NotificationProvider>
          <Routes>
            {/* Public & User Pages — wrapped in PublicLayout (renders Public Navbar) */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/:slug" element={<CampaignDetailPage />} />
              <Route path="/ngo-partners" element={<NGOPartnersPage />} />
              <Route path="/ngos/:id" element={<NGOProfilePage />} />

              {/* User Protected — any authenticated user */}
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/create-campaign" element={
                <ProtectedRoute>
                  <CreateCampaignPage />
                </ProtectedRoute>
              } />
              <Route path="/register-ngo" element={
                <ProtectedRoute>
                  <NGORegistrationPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Admin Pages — completely isolated from Public Layout & Public Navbar */}
            <Route path="/admin/login" element={<AdminAuthPage />} />
            <Route path="/admin/*" element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } />

            {/* Redirects */}
            <Route path="/donor-dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(139,92,246,0.3)' },
              duration: 4000,
            }}
          />
        </NotificationProvider>
      </AdminProvider>
    </BrowserRouter>
  );
};

export default App;
