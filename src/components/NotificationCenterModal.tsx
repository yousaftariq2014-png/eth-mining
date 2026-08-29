import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  Users, 
  Crown, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Award
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification
}) => {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'mining' | 'referral' | 'vip'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getCategoryIcon = (cat: AppNotification['category']) => {
    switch (cat) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'mining':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'referral':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'vip':
        return <Crown className="w-4 h-4 text-amber-300" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0d1424] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17233f] via-[#111a30] to-[#0c1220] p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-500 text-white font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">System Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {unreadCount} UNREAD
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Real-time deposit confirmations, mining yield logs, and payout alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Action Strip */}
        <div className="bg-[#10182b] px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['all', 'deposit', 'withdrawal', 'mining', 'referral', 'vip'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                  filter === cat
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto bg-[#0a0f1d]">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
              <p>No notifications in this category yet.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onSelectNotification && onSelectNotification(n)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  n.isRead
                    ? 'bg-[#11192c] border-slate-800/80 hover:border-slate-700'
                    : 'bg-[#15213b] border-amber-500/30 hover:border-amber-500/50 shadow-md shadow-amber-500/5'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getCategoryIcon(n.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-bold truncate ${n.isRead ? 'text-slate-200' : 'text-white'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {n.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {n.message}
                    </p>

                    {n.txHash && (
                      <div className="mt-2 text-[10px] font-mono text-amber-400/80 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800 truncate">
                        TX: {n.txHash}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#11192c] px-6 py-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-mono">
            Encrypted Push Alert Stream Active
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
