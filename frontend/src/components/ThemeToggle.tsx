import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const iconMap = {
  light: Sun,
  system: Monitor,
  dark: Moon,
} as const;

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = ['light', 'system', 'dark'] as const;

  const cycleTheme = () => {
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const Icon = iconMap[theme];

  const labels: Record<string, string> = {
    light: 'Light mode – click to switch to System',
    system: 'System mode – click to switch to Dark',
    dark: 'Dark mode – click to switch to Light',
  };

  return (
    <button
      onClick={cycleTheme}
      className="group relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      aria-label={labels[theme]}
      title={labels[theme]}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute"
        >
          <Icon
            className={`w-[18px] h-[18px] transition-colors ${
              theme === 'dark'
                ? 'text-primary-300 group-hover:text-primary-200'
                : 'text-text-muted group-hover:text-primary-600'
            }`}
            strokeWidth={1.8}
          />
        </motion.div>
      </AnimatePresence>

      {/* Tooltip */}
      <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-lg bg-[#1a1a1a] text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50 capitalize">
        {theme} theme
      </span>
    </button>
  );
};

export default ThemeToggle;
