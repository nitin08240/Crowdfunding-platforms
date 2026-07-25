import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderHeart, PlusCircle, Heart, User, Settings,
  ChevronRight, Menu, X, LogOut, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OverviewTab from '../components/dashboard/OverviewTab';
import MyCampaignsTab from '../components/dashboard/MyCampaignsTab';
import DonationsTab from '../components/dashboard/DonationsTab';
import ProfileTab from '../components/dashboard/ProfileTab';
import SettingsTab from '../components/dashboard/SettingsTab';
import WithdrawalsTab from '../components/dashboard/WithdrawalsTab';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/campaigns', label: 'My Campaigns', icon: FolderHeart, end: false },
  { to: '/dashboard/withdrawals', label: 'Withdrawals', icon: Wallet, end: false },
  { to: '/dashboard/donate', label: 'Donations Made', icon: Heart, end: false },
  { to: '/dashboard/profile', label: 'Profile', icon: User, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
];

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? 'flex flex-col h-full' : 'hidden lg:flex flex-col'} w-64 shrink-0`}>
      {/* User info */}
      <div className="p-6 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
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
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-violet-500" />}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-4 border-t border-white/[0.07] mt-4">
          <button
            onClick={() => { navigate('/create-campaign'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white btn-primary"
          >
            <PlusCircle className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/[0.07]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen pt-16 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0 border-r border-white/[0.07] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
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
                <span className="font-display font-bold text-white">Dashboard</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] sticky top-16 z-20" style={{ background: '#080c14' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          <span className="font-display font-semibold text-white">Dashboard</span>
        </div>

        <div className="p-6 lg:p-8 max-w-6xl">
          <Routes>
            <Route index element={<OverviewTab />} />
            <Route path="campaigns" element={<MyCampaignsTab />} />
            <Route path="withdrawals" element={<WithdrawalsTab />} />
            <Route path="donate" element={<DonationsTab />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="settings" element={<SettingsTab />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
