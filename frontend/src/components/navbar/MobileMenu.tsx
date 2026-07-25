import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Home, TrendingUp, Building2, Heart,
  LayoutDashboard, Settings, LogOut, Shield, Bookmark,
  CircleDollarSign, Sparkles, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';
import ThemeToggle from '../ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' as const } },
};

const stagger = (i: number) => ({
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { delay: i * 0.04, duration: 0.25 },
});

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainLinks = [
  { label: 'Home',         href: '/',              id: 'hero',        icon: Home },
  { label: 'How It Works', href: '/#how-it-works', id: 'how-it-works', icon: TrendingUp },
  { label: 'NGOs',         href: '/#ngos',         id: 'ngos',        icon: Building2 },
];

const NavItem: React.FC<{
  href: string; label: string; icon: React.ElementType;
  active?: boolean; onClick: () => void;
}> = ({ href, label, icon: Icon, active, onClick }) => (
  <Link
    to={href}
    onClick={onClick}
    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 min-h-[52px] ${
      active
        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
        : 'text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
      active ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-black/5 dark:bg-white/5'
    }`}>
      <Icon className={`w-5 h-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted'}`} strokeWidth={active ? 2.2 : 1.8} />
    </span>
    {label}
  </Link>
);

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const isActive = (href: string, id: string) =>
    location.pathname === '/' &&
    ((href === '/' && !location.hash) || (href !== '/' && location.hash === `#${id}`));

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstLinkRef.current?.focus(), 320);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => { onClose(); }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/');
  };

  const handleNavClick = (href: string, id: string) => {
    onClose();
    if (location.pathname !== '/') {
      navigate(href);
      return;
    }
    if (href === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
    } else {
      const el = document.getElementById(id);
      if (el) {
        const offsetPosition = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            className="fixed inset-y-0 right-0 z-[110] w-[88vw] max-w-[380px] bg-white dark:bg-[#0e1117] border-l border-[#EAEAEA] dark:border-white/10 shadow-2xl dark:shadow-black/60 lg:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] dark:border-white/10 shrink-0">
              <Link
                to="/"
                onClick={onClose}
                ref={firstLinkRef}
                className="flex items-center gap-2.5 focus:outline-none"
              >
                <div className="w-9 h-9 rounded-[14px] bg-white dark:bg-white/5 border border-[#EAEAEA] dark:border-white/10 flex items-center justify-center shadow-sm">
                  <Heart className="w-5 h-5 text-primary-500" fill="currentColor" strokeWidth={0} />
                </div>
                <span className="font-display font-extrabold text-[18px] text-text tracking-tight">CrowdFund</span>
              </Link>

              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle />
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-text-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ml-1"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto py-5 px-4 space-y-6">
              {/* User Card */}
              {isAuthenticated && user && (
                <motion.div {...stagger(0)} className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent border border-primary-100 dark:border-primary-800/30">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white text-[14px] font-bold shadow">
                        {initials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#0e1117] rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-text truncate">{user.name}</p>
                      <p className="text-[12px] text-text-muted font-medium truncate mt-0.5">{user.email}</p>
                    </div>
                    <NotificationBell />
                  </div>
                </motion.div>
              )}

              {/* Main Nav */}
              <div>
                <p className="px-1 mb-2 text-[11px] font-bold text-text-muted uppercase tracking-widest">Navigate</p>
                <div className="space-y-1">
                  {mainLinks.map((link, i) => (
                    <motion.div key={link.href} {...stagger(i + 1)}>
                      <NavItem
                        href={link.href}
                        label={link.label}
                        icon={link.icon}
                        active={isActive(link.href, link.id)}
                        onClick={() => handleNavClick(link.href, link.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Account section */}
              {isAuthenticated && (
                <motion.div {...stagger(5)}>
                  <p className="px-1 mb-2 text-[11px] font-bold text-text-muted uppercase tracking-widest">Account</p>
                  <div className="space-y-1">
                    {user?.role === 'user' && [
                      { href: '/dashboard',            label: 'Dashboard',      icon: LayoutDashboard },
                      { href: '/dashboard/campaigns',  label: 'My Campaigns',   icon: Heart },
                      { href: '/dashboard/donations',  label: 'My Donations',   icon: CircleDollarSign },
                      { href: '/dashboard/saved',      label: 'Saved',          icon: Bookmark },
                      { href: '/dashboard/settings',   label: 'Settings',       icon: Settings },
                      { href: '/help',                 label: 'Help Center',    icon: HelpCircle },
                    ].map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        onClick={onClose}
                      />
                    ))}
                    {user?.role === 'admin' && (
                      <NavItem href="/admin" label="Admin Panel" icon={Shield} onClick={onClose} />
                    )}
                  </div>
                  <div className="h-px bg-[#f0f0f0] dark:bg-white/10 my-3 mx-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl min-h-[52px] text-[15px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all focus:outline-none"
                  >
                    <span className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <LogOut className="w-5 h-5 text-red-400" strokeWidth={1.8} />
                    </span>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>

            {/* Footer CTAs */}
            <div className="px-5 py-5 border-t border-[#f0f0f0] dark:border-white/10 bg-white dark:bg-[#0e1117] shrink-0">
              {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/auth"
                    onClick={onClose}
                    className="flex items-center justify-center py-3.5 rounded-full text-[14px] font-bold text-text border border-border hover:border-primary-400 hover:text-primary-600 transition-all min-h-[52px]"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/auth?tab=register"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-full text-[14px] font-bold text-white transition-all shadow-md shadow-primary-500/25 min-h-[52px]"
                    style={{ background: 'linear-gradient(135deg, #A66A00 0%, #D89A2B 100%)' }}
                  >
                    <Sparkles className="w-4 h-4 opacity-80" />
                    Sign Up
                  </Link>
                </div>
              ) : (
                <Link
                  to={user?.role === 'admin' ? '/admin' : '/create-campaign'}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-[14px] font-bold text-white transition-all shadow-md shadow-primary-500/25 min-h-[52px]"
                  style={{ background: 'linear-gradient(135deg, #A66A00 0%, #D89A2B 100%)' }}
                >
                  <Sparkles className="w-4 h-4 opacity-80" />
                  Start Fundraiser
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
