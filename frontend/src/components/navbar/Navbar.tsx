import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

import NavLinks       from './NavLinks';
import SearchBar      from './SearchBar';
import CTAButtons     from './CTAButtons';
import ProfileDropdown from './ProfileDropdown';
import NotificationBell from '../NotificationBell';
import MobileMenu     from './MobileMenu';
import ThemeToggle    from '../ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher';

// ─── Logo ────────────────────────────────────────────────────────────────────
const Logo: React.FC = () => {
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
    } else {
      navigate('/');
    }
  };

  return (
    <a
      href="/"
      onClick={handleLogoClick}
      className="flex items-center gap-3 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-xl"
      aria-label="CrowdFund — go to homepage"
    >
      <motion.div
        whileHover={{ scale: 1.05, rotate: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shadow-primary-500/20 bg-white border border-[#EAEAEA] dark:border-white/10 dark:bg-white/5 group-hover:border-primary-300 dark:group-hover:border-primary-500/50 transition-colors"
      >
        <Heart className="w-6 h-6 text-primary-500" fill="currentColor" strokeWidth={0} />
      </motion.div>
      <div className="leading-none flex flex-col justify-center">
        <span className="font-display font-extrabold text-[20px] text-text tracking-tight block leading-tight">
          CrowdFund
        </span>
        <span className="hidden sm:block text-[11px] font-semibold text-primary-500 tracking-wider uppercase mt-[2px] opacity-90 group-hover:opacity-100 transition-opacity">
          Kindness Creates Change
        </span>
      </div>
    </a>
  );
};

// ─── Hamburger button ────────────────────────────────────────────────────────
const HamburgerButton: React.FC<{ isOpen: boolean; onClick: () => void }> = ({ isOpen, onClick }) => (
  <motion.button
    onClick={onClick}
    className="lg:hidden relative w-11 h-11 flex flex-col items-center justify-center gap-[6px] rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
    aria-expanded={isOpen}
    whileTap={{ scale: 0.92 }}
  >
    <motion.span
      animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="block w-5 h-0.5 bg-text rounded-full origin-center"
    />
    <motion.span
      animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.18 }}
      className="block w-5 h-0.5 bg-text rounded-full"
    />
    <motion.span
      animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="block w-5 h-0.5 bg-text rounded-full origin-center"
    />
  </motion.button>
);

// ─── Main Navbar ─────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Framer Motion scroll progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  // Compute class-based background so dark: variant works correctly.
  // We intentionally avoid inline backgroundColor in motion.animate for the
  // dark theme because inline styles always override CSS class-based variables.
  const headerBg = scrolled
    ? 'bg-white/90 dark:bg-[#111827]/90'
    : 'bg-white/60 dark:bg-[#111827]/60';

  const headerBorder = scrolled
    ? 'border-[#EAEAEA] dark:border-white/10'
    : 'border-white/50 dark:border-white/5';

  const headerShadow = scrolled
    ? '[box-shadow:0_20px_40px_-8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] dark:[box-shadow:0_20px_40px_-8px_rgba(0,0,0,0.45),0_1px_3px_rgba(0,0,0,0.3)]'
    : '[box-shadow:0_4px_16px_-4px_rgba(0,0,0,0.02)]';

  return (
    <>
      {/* Scroll Progress Bar at the very top of the window */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary-500 origin-left z-[60]"
        style={{ scaleX }}
      />

      <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pt-4 pointer-events-none">
        <motion.header
          initial={false}
          animate={{
            backdropFilter: scrolled ? 'blur(24px)' : 'blur(12px)',
            height: scrolled ? 72 : 80,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          // background & border driven by Tailwind classes (not inline style) so dark: variants work
          className={[
            'w-full max-w-[1280px] rounded-2xl border pointer-events-auto overflow-visible relative flex items-center',
            'transition-colors duration-300',
            headerBg,
            headerBorder,
            headerShadow,
          ].join(' ')}
          role="banner"
        >
          <div className="flex items-center justify-between w-full h-full px-4 lg:px-6 gap-2 lg:gap-4">
            {/* ── Left: Logo ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-start shrink-0">
              <Logo />
            </div>

            {/* ── Center: Nav links ──────────────────────────────────────── */}
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <NavLinks />
            </div>

            {/* ── Right: Actions ─────────────────────────────────────────── */}
            <div className="flex items-center justify-end shrink-0 gap-2 sm:gap-3">
              {/* Desktop/Tablet Search */}
              <div className="mr-1 lg:mr-2">
                <SearchBar />
              </div>

              {/* Authenticated state */}
              {isAuthenticated ? (
                <>
                  {/* Icon group with clear visual separator */}
                  <div className="hidden sm:flex items-center gap-2 px-3 border-r border-black/10 dark:border-white/10 mr-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <NotificationBell />
                  </div>

                  <div className="hidden sm:flex">
                    <CTAButtons />
                  </div>

                  <div className="ml-2 relative z-[100]">
                    <ProfileDropdown />
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 border-r border-black/10 dark:border-white/10 mr-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                  
                  <a
                    href="/auth"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-[14px] font-semibold text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  >
                    {t('navbar.login')}
                  </a>
                  <div className="hidden sm:flex ml-2">
                    <CTAButtons />
                  </div>
                </>
              )}

              {/* Hamburger — mobile only */}
              <div className="ml-1 lg:hidden">
                <HamburgerButton isOpen={mobileOpen} onClick={() => setMobileOpen((v) => !v)} />
              </div>
            </div>
          </div>
        </motion.header>
      </div>

      {/* Spacer to prevent content jumping under fixed bar */}
      <div className="h-[96px]" aria-hidden="true" />

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

export default Navbar;
