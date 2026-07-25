import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const primaryLinks = [
  { labelKey: 'navbar.home',         href: '/',              id: 'hero'        },
  { labelKey: 'navbar.howItWorks', href: '/#how-it-works', id: 'how-it-works' },
  { labelKey: 'navbar.ngos',         href: '/#ngos',         id: 'ngos'        },
];

interface NavLinksProps {
  onLinkClick?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ onLinkClick }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { t } = useTranslation();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: string
  ) => {
    e.preventDefault();
    if (onLinkClick) onLinkClick();

    if (location.pathname !== '/') {
      navigate(href);
      return;
    }

    if (href === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const offsetPosition =
        element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      window.history.pushState(null, '', href);
    }
  };

  const isActive = (link: (typeof primaryLinks)[number]) =>
    location.pathname === '/' &&
    ((link.href === '/' && !location.hash) ||
      (link.href !== '/' && location.hash === `#${link.id}`));

  return (
    <nav 
      className="hidden lg:flex items-center gap-1" 
      aria-label="Primary navigation"
      onMouseLeave={() => setHoveredLink(null)}
    >
      {primaryLinks.map((link) => {
        const active = isActive(link);
        return (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => handleScroll(e, link.href, link.id)}
            onMouseEnter={() => setHoveredLink(link.href)}
            className={`relative px-5 py-2.5 text-[14.5px] font-semibold tracking-tight transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-xl z-10 ${
              active 
                ? 'text-primary-600 dark:text-primary-400 font-bold' 
                : 'text-text-muted hover:text-text'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative z-10">{t(link.labelKey)}</span>

            {/* Hover Background */}
            <AnimatePresence>
              {hoveredLink === link.href && !active && (
                <motion.div
                  layoutId="nav-hover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-xl -z-10"
                />
              )}
            </AnimatePresence>

            {/* Active Indicator Underline */}
            {active && (
              <motion.div
                layoutId="nav-active"
                className="absolute bottom-0 left-4 right-4 h-[2.5px] rounded-t-full bg-primary-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </a>
        );
      })}
    </nav>
  );
};

export default NavLinks;
