import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Info, Heart, ShieldCheck, AlertCircle, BellOff } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

const typeIconMap: Record<string, React.ReactNode> = {
  donation: <Heart className="w-3.5 h-3.5 text-pink-500" />,
  campaign_approved: <ShieldCheck className="w-3.5 h-3.5 text-green-500" />,
  campaign_rejected: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
};

const typeColorMap: Record<string, string> = {
  donation: 'bg-pink-50 dark:bg-pink-900/30',
  campaign_approved: 'bg-green-50 dark:bg-green-900/30',
  campaign_rejected: 'bg-red-50 dark:bg-red-900/30',
};

const getIcon = (type: string) =>
  typeIconMap[type] ?? <Info className="w-3.5 h-3.5 text-primary-500" />;

const getColor = (type: string) =>
  typeColorMap[type] ?? 'bg-primary-50 dark:bg-primary-900/30';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="group relative w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell className="w-[18px] h-[18px]" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 flex h-[18px] w-[18px]"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-[18px] w-[18px] bg-primary-500 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.span>
        )}

        {/* Tooltip */}
        <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-lg bg-[#1a1a1a] text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50">
          Notifications
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.17, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-3 w-80 sm:w-[360px] bg-white dark:bg-[#111827] backdrop-blur-xl border border-[#EAEAEA] dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/40 z-[9999] overflow-hidden"
            role="dialog"
            aria-label="Notifications panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f0f0f0] dark:border-white/10">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-text text-[14px]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-[12px] text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f5f5f5] dark:divide-white/5">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#f5f5f5] dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <BellOff className="w-6 h-6 text-[#bbb]" />
                  </div>
                  <p className="text-[14px] font-semibold text-text">You're all caught up!</p>
                  <p className="text-[12px] text-text-muted mt-1">No notifications yet. We'll let you know when something happens.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => !n.read && markAsRead(n._id)}
                    className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${
                      !n.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${getColor(n.type)}`}>
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug ${!n.read ? 'font-semibold text-text' : 'font-medium text-text-muted'}`}>
                        {n.title}
                      </p>
                      <p className="text-[12px] text-text-muted line-clamp-2 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] text-text-muted font-medium">
                          {timeAgo(n.createdAt)}
                        </span>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
