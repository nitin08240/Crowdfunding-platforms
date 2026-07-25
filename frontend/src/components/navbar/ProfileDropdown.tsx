import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Heart, Settings, LogOut, Shield, ChevronDown,
  Bookmark, CircleDollarSign, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const dropdownVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.97, transformOrigin: 'top right' },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.14, ease: 'easeIn' as const } },
};

type MenuItem = { href: string; label: string; icon: React.ElementType; desc?: string };

const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const firstName = user?.name?.split(' ')[0] ?? 'Account';

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 220);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  const isAdmin = user?.role === 'admin';

  const menuItems: MenuItem[] = isAdmin
    ? [{ href: '/admin', label: 'Admin Panel', icon: Shield, desc: 'Manage platform' }]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/campaigns', label: 'My Campaigns', icon: Heart },
        { href: '/dashboard/donations', label: 'My Donations', icon: CircleDollarSign },
        { href: '/dashboard/saved', label: 'Saved Campaigns', icon: Bookmark },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
        { href: '/help', label: 'Help Center', icon: HelpCircle },
      ];

  return (
    <div
      className="relative z-[100]"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Trigger ────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`group flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
          isOpen
            ? 'border-primary-200 dark:border-primary-500/30 bg-primary-50/50 dark:bg-primary-900/20'
            : 'border-border hover:border-primary-200 dark:hover:border-primary-500/30 hover:bg-black/5 dark:hover:bg-white/10'
        }`}
        aria-label="Open account menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-surface shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white text-[12px] font-bold shadow-sm shadow-primary-500/20 transition-transform duration-200 group-hover:scale-105">
              {initials}
            </div>
          )}
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-surface rounded-full" />
        </div>

        {/* Name — visible on xl+ */}
        <div className="hidden xl:block text-left leading-tight">
          <p className="text-[13px] font-bold text-text max-w-[96px] truncate">{firstName}</p>
          <p className="text-[10px] font-semibold text-text-muted capitalize">{user?.role}</p>
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="hidden xl:block text-text-muted"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      {/* ── Dropdown Panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            className="absolute right-0 top-[calc(100%+10px)] w-72 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl dark:shadow-black/40 border border-[#EAEAEA] dark:border-white/10 z-[9999] overflow-hidden"
            role="menu"
            aria-label="User account menu"
          >
            {/* User info header */}
            <div className="px-4 py-4 bg-gradient-to-br from-primary-50/60 to-transparent dark:from-primary-900/20 border-b border-[#f0f0f0] dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900/50 shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white text-[15px] font-bold shadow-lg shadow-primary-500/20">
                      {initials}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#111827] rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-text truncate">{user?.name}</p>
                  <p className="text-[12px] font-medium text-text-muted truncate mt-0.5">{user?.email}</p>
                  <span className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                      : 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-red-500' : 'bg-green-500'}`} />
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-text hover:bg-primary-50/60 dark:hover:bg-white/5 transition-all duration-150 group/item focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                  >
                    <span className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 group-hover/item:bg-primary-100/60 dark:group-hover/item:bg-primary-900/30 flex items-center justify-center transition-colors shrink-0">
                      <Icon className="w-[16px] h-[16px] text-text-muted group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors" strokeWidth={1.8} />
                    </span>
                    <span>
                      <p className="text-[13.5px] font-semibold text-text leading-tight">{item.label}</p>
                      {item.desc && <p className="text-[11px] text-text-muted mt-0.5">{item.desc}</p>}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Divider + Logout */}
            <div className="px-1.5 pb-1.5">
              <div className="h-px bg-[#f0f0f0] dark:bg-white/10 mx-2 my-1" />
              <button
                onClick={handleLogout}
                role="menuitem"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150 group/logout focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              >
                <span className="w-8 h-8 rounded-xl bg-red-50/60 dark:bg-red-900/20 group-hover/logout:bg-red-100 dark:group-hover/logout:bg-red-900/30 flex items-center justify-center transition-colors shrink-0">
                  <LogOut className="w-[16px] h-[16px] text-red-400 group-hover/logout:text-red-600 dark:group-hover/logout:text-red-400 transition-colors" strokeWidth={1.8} />
                </span>
                <p className="text-[13.5px] font-semibold leading-tight">Log Out</p>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
