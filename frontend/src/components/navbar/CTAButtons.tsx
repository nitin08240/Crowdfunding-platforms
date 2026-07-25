import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface CTAButtonsProps {
  onLinkClick?: () => void;
}

const CTAButtons: React.FC<CTAButtonsProps> = ({ onLinkClick }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const rippleKey = useRef(0);

  const handleDonateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onLinkClick) onLinkClick();
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigate('/#featured-campaigns');
    } else {
      const el = document.getElementById('featured-campaigns');
      if (el) {
        const offsetPosition = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        window.history.pushState(null, '', '/#featured-campaigns');
      }
    }
  };

  const handleRipple = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      key: ++rippleKey.current,
    });
    setTimeout(() => setRipple(null), 600);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* ── Secondary: Browse / Donate ─────────────────────────────── */}
      <motion.button
        onClick={handleDonateClick}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="hidden md:inline-flex items-center gap-1.5 justify-center px-4 py-2 rounded-full text-[13px] font-semibold text-text hover:text-primary-600 bg-transparent border border-border hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 whitespace-nowrap"
        aria-label="Browse campaigns to donate"
      >
        <TrendingUp className="w-3.5 h-3.5 opacity-70" />
        {t('navbar.donate')}
      </motion.button>

      {/* ── Primary: Start Fundraiser ───────────────────────────────── */}
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="relative"
      >
        <Link
          to={isAuthenticated ? '/create-campaign' : '/auth?tab=register'}
          onClick={(e) => { handleRipple(e); if (onLinkClick) onLinkClick(); }}
          className="relative inline-flex items-center justify-center gap-1.5 overflow-hidden px-5 py-2.5 rounded-full text-[13.5px] font-bold text-white whitespace-nowrap transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2"
          style={{
            background: 'linear-gradient(135deg, #A66A00 0%, #D89A2B 50%, #c17f11 100%)',
            boxShadow: '0 4px 20px -4px rgba(166,106,0,0.55), 0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
          aria-label="Start a fundraiser"
        >
          {/* Ripple effect */}
          <AnimatePresence>
            {ripple && (
              <motion.span
                key={ripple.key}
                initial={{ width: 0, height: 0, opacity: 0.5, x: ripple.x, y: ripple.y, translateX: '-50%', translateY: '-50%' }}
                animate={{ width: 200, height: 200, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute rounded-full bg-white/30 pointer-events-none"
                style={{ left: 0, top: 0 }}
              />
            )}
          </AnimatePresence>

          <Sparkles className="w-3.5 h-3.5 opacity-90 shrink-0" />
          <span className="relative z-10">{t('navbar.startFundraiser')}</span>
        </Link>
      </motion.div>
    </div>
  );
};

export default CTAButtons;
