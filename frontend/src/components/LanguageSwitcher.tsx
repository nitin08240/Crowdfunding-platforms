import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi',   nativeLabel: 'हिन्दी',  flag: '🇮🇳' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === i18n.resolvedLanguage) ?? languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${currentLang.label}. Click to change.`}
      >
        <Globe className="w-4 h-4 text-text-muted shrink-0" />
        <span className="text-[13px] font-semibold text-text hidden xl:block">
          {currentLang.nativeLabel}
        </span>
        <span className="text-[12px] font-bold text-text hidden lg:block xl:hidden">
          {currentLang.code.toUpperCase()}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-text-muted hidden sm:block"
        >
          <ChevronDown className="w-3 h-3" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] w-44 bg-white dark:bg-[#111827] border border-[#EAEAEA] dark:border-white/10 rounded-2xl p-1.5 shadow-2xl dark:shadow-black/40 z-[9999]"
            role="listbox"
            aria-label="Select language"
          >
            {languages.map((lang) => {
              const isSelected = currentLang.code === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg leading-none">{lang.flag}</span>
                  <span className="flex-1 text-left">
                    <p className="text-[13px] font-semibold leading-tight">{lang.nativeLabel}</p>
                    <p className="text-[10px] opacity-60 mt-0.5">{lang.label}</p>
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
