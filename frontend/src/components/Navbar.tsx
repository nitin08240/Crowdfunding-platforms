import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LayoutDashboard, LogOut, Menu, Plus, Search, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Explore Campaigns', href: '/campaigns' },
  { label: 'NGO Partners', href: '/ngo-partners' },
  { label: 'Success Stories', href: '/success-stories' },
  { label: 'Impact', href: '/impact' },
  { label: 'About', href: '/about' },
];

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href || (href !== '/' && location.pathname.startsWith(href));

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'bg-white/90 border-[#EAEAEA] shadow-lg shadow-black/5 backdrop-blur-xl' : 'bg-white/70 border-white/70 backdrop-blur-xl'}`}>
      <div className="container-app">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#A66A00] flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl text-[#121212]">CrowdFund</span>
              <p className="hidden sm:block text-[11px] font-semibold text-[#A66A00] -mt-1">Kindness Creates Change</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isActive(link.href) ? 'bg-primary-50 text-primary-700' : 'text-[#555555] hover:text-primary-700 hover:bg-primary-50'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/campaigns" className="hidden xl:inline-flex btn-ghost text-sm">
              <Search className="w-4 h-4" /> Search
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/create-campaign" className="hidden md:inline-flex btn-primary text-sm py-2.5 px-4">
                  <Plus className="w-4 h-4" /> Start Campaign
                </Link>
                <Link to="/campaigns" className="hidden xl:inline-flex btn-secondary text-sm py-2.5 px-4">
                  Donate Now
                </Link>
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="w-10 h-10 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold border border-primary-200"
                    aria-label="Open account menu"
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </button>
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        className="absolute right-0 top-full mt-3 w-60 rounded-[20px] bg-white border border-[#EAEAEA] shadow-2xl overflow-hidden"
                        onMouseLeave={() => setShowUserMenu(false)}
                      >
                        <div className="px-4 py-3 border-b border-[#EAEAEA]">
                          <p className="text-sm font-bold text-[#121212]">{user?.name}</p>
                          <p className="text-xs text-[#555555] truncate">{user?.email}</p>
                        </div>
                        <div className="p-2">
                          {user?.role === 'user' && (
                            <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#555555] hover:bg-primary-50 hover:text-primary-700">
                              <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                          )}
                          {user?.role === 'admin' && (
                            <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#555555] hover:bg-primary-50 hover:text-primary-700">
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 mt-1">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link to="/auth" className="hidden md:inline-flex btn-ghost text-sm">Login</Link>
                <Link to="/auth?tab=register" className="hidden md:inline-flex btn-secondary text-sm py-2.5 px-4">Register</Link>
                <Link to="/create-campaign" className="hidden xl:inline-flex btn-primary text-sm py-2.5 px-4">Start Campaign</Link>
                <Link to="/campaigns" className="hidden xl:inline-flex btn-secondary text-sm py-2.5 px-4">Donate Now</Link>
              </>
            )}

            <button onClick={() => setIsOpen((v) => !v)} className="lg:hidden btn-ghost p-2" aria-label="Toggle menu">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-[#EAEAEA] py-4"
            >
              <div className="grid gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className="px-4 py-3 rounded-xl text-sm font-semibold text-[#555555] hover:bg-primary-50 hover:text-primary-700">
                    {link.label}
                  </Link>
                ))}
                <div className="grid grid-cols-2 gap-3 px-4 pt-3">
                  <Link to="/campaigns" onClick={() => setIsOpen(false)} className="btn-secondary text-sm py-2.5">Donate Now</Link>
                  <Link to={isAuthenticated ? '/create-campaign' : '/auth?tab=register'} onClick={() => setIsOpen(false)} className="btn-primary text-sm py-2.5">Start Campaign</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
