import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderHeart, Users, Heart, ShieldAlert,
  ChevronRight, Menu, X, LogOut, Shield, Building2,
  BarChart3, Settings, Loader2, Banknote
} from 'lucide-react';
import AdminStats from '../components/admin/AdminStats';
import AdminCampaignsTab from '../components/admin/AdminCampaignsTab';
import AdminCampaignDetailPage from '../components/admin/AdminCampaignDetailPage';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminDonationsTab from '../components/admin/AdminDonationsTab';
import AdminAuditLogs from '../components/admin/AdminAuditLogs';
import AdminNGOsTab from '../components/admin/AdminNGOsTab';
import AdminReportsTab from '../components/admin/AdminReportsTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import AdminWithdrawalsTab from '../components/admin/AdminWithdrawalsTab';
import ThemeToggle from '../components/ThemeToggle';
import { useAdmin } from '../context/AdminContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/campaigns', label: 'Campaigns', icon: FolderHeart, end: false },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/ngos', label: 'NGOs', icon: Building2, end: false },
  { to: '/admin/donations', label: 'Donations', icon: Heart, end: false },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: Banknote, end: false },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, end: false },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert, end: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
];

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, adminLogout } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await adminLogout();
    toast.success('Admin logged out');
    navigate('/admin/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Build dynamic breadcrumb label from current path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') return ['Overview'];
    if (path === '/admin/campaigns') return ['Campaigns'];
    if (path.startsWith('/admin/campaigns/')) return ['Campaigns', 'Campaign Details'];
    if (path === '/admin/users') return ['Users'];
    if (path === '/admin/ngos') return ['NGOs'];
    if (path === '/admin/donations') return ['Donations'];
    if (path === '/admin/withdrawals') return ['Withdrawals'];
    if (path === '/admin/reports') return ['Reports'];
    if (path === '/admin/audit-logs') return ['Audit Logs'];
    if (path === '/admin/settings') return ['Settings'];
    return ['Dashboard'];
  };

  const breadcrumbs = getBreadcrumbs();

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? 'flex flex-col h-full' : 'hidden lg:flex flex-col'} w-64 shrink-0 bg-[#0a0e1a]`}>
      {/* Admin Sidebar Header */}
      <div className="p-6 border-b border-white/[0.07] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-red-900/30">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-white text-base leading-tight">Admin Portal</h2>
          <span className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">Enterprise Console</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer Logout */}
      <div className="p-4 border-t border-white/[0.07]">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-60"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col">
      {/* ── DEDICATED ADMIN TOP HEADER BAR ── */}
      <header className="h-16 border-b border-white/[0.07] bg-[#0a0e1a] sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-gray-400 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Admin Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-red-500" /> Admin
            </span>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-gray-600" />
                <span className={idx === breadcrumbs.length - 1 ? 'text-white font-bold' : 'text-gray-400'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Side: Logged-in Admin Profile Badge */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Authenticated Admin Profile Pill */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/[0.1]">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-xs text-white leading-none">{admin?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{admin?.email || 'admin@gmail.com'}</p>
            </div>
            {admin?.profileImage ? (
              <img
                src={admin.profileImage}
                alt={admin.name}
                className="w-9 h-9 rounded-xl object-cover border border-red-500/30 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md shadow-red-900/30 border border-red-500/30">
                {admin ? getInitials(admin.name) : 'SA'}
              </div>
            )}
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
              {admin?.role || 'ADMIN'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body: Sidebar + Dynamic Route Content */}
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0 border-r border-white/[0.07] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden border-r border-white/[0.07]"
                style={{ background: '#0a0e1a' }}
              >
                <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
                  <span className="font-display font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" /> Admin Portal
                  </span>
                  <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <Sidebar mobile />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-6 lg:p-8 max-w-7xl">
          <Routes>
            {/* index: matches /admin/ (no sub-segment) */}
            <Route index element={<AdminStats />} />
            {/* dashboard: matches /admin/dashboard — the login page navigates here */}
            <Route path="dashboard" element={<AdminStats />} />
            <Route path="campaigns" element={<AdminCampaignsTab />} />
            <Route path="campaigns/:campaignId" element={<AdminCampaignDetailPage />} />
            <Route path="users" element={<AdminUsersTab />} />
            <Route path="ngos" element={<AdminNGOsTab />} />
            <Route path="donations" element={<AdminDonationsTab />} />
            <Route path="withdrawals" element={<AdminWithdrawalsTab />} />
            <Route path="reports" element={<AdminReportsTab />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettingsTab />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
