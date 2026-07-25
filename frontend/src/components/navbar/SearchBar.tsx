import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const open = useCallback(() => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const close = useCallback(() => {
    setIsExpanded(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isExpanded) open();
        else inputRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded, open, close]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/campaigns?search=${encodeURIComponent(query.trim())}`);
      close();
    }
  };

  const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().includes('MAC');
  const shortcut = isMac ? '⌘K' : 'Ctrl K';

  return (
    <div ref={containerRef} className="relative flex items-center">
      <AnimatePresence mode="wait" initial={false}>
        {isExpanded ? (
          <motion.form
            key="search-open"
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 focus-within:border-primary-400 dark:focus-within:border-primary-500/70 focus-within:bg-white dark:focus-within:bg-white/5 rounded-full px-3.5 py-2 overflow-hidden transition-colors duration-200 shadow-sm focus-within:shadow-primary-500/10 focus-within:shadow-md"
          >
            <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns…"
              className="flex-1 bg-transparent text-[13px] text-text placeholder-text-muted outline-none min-w-0 font-medium"
              aria-label="Search campaigns"
            />
            {query ? (
              <button
                type="button"
                onClick={close}
                className="text-text-muted hover:text-text transition-colors shrink-0"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-md shrink-0 tracking-wide">
                {shortcut}
              </kbd>
            )}
          </motion.form>
        ) : (
          <motion.button
            key="search-icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={open}
            title={`Search (${shortcut})`}
            aria-label={`Open search. Shortcut: ${shortcut}`}
            className="group relative w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
          >
            <Search className="w-[18px] h-[18px]" />
            {/* Tooltip */}
            <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-lg bg-[#1a1a1a] text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50">
              Search <kbd className="ml-1 text-[10px] font-bold opacity-70">{shortcut}</kbd>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
