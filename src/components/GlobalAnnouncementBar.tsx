import React, { useState } from 'react';
import { 
  Megaphone, 
  X, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { GlobalAnnouncement } from '../types';

interface GlobalAnnouncementBarProps {
  announcement: GlobalAnnouncement | null;
  onDismiss?: () => void;
}

export const GlobalAnnouncementBar: React.FC<GlobalAnnouncementBarProps> = ({
  announcement,
  onDismiss
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (!announcement || !announcement.isActive || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  const getStyleByType = (type: GlobalAnnouncement['type']) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-950/90 via-[#1c1305]/95 to-amber-950/90 border-b border-amber-500/40 text-amber-200',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          accentText: 'text-amber-400'
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-950/90 via-[#041d13]/95 to-emerald-950/90 border-b border-emerald-500/40 text-emerald-200',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          accentText: 'text-emerald-400'
        };
      case 'alert':
        return {
          bg: 'bg-gradient-to-r from-rose-950/90 via-[#21090f]/95 to-rose-950/90 border-b border-rose-500/40 text-rose-200',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />,
          accentText: 'text-rose-400'
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-[#0b162c]/95 via-[#0e1d3a]/95 to-[#0b162c]/95 border-b border-cyan-500/30 text-cyan-100',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <Megaphone className="w-4 h-4 text-cyan-400 shrink-0" />,
          accentText: 'text-cyan-400'
        };
    }
  };

  const style = getStyleByType(announcement.type);

  return (
    <div 
      id="global-announcement-bar"
      className={`w-full py-2 px-3 sm:px-6 relative z-50 backdrop-blur-md shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm font-medium transition-all ${style.bg}`}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {style.icon}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono ${style.badgeBg}`}>
              {announcement.title || 'Official Announcement'}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-normal text-slate-200 truncate font-mono">
            {announcement.message}
          </p>

          {announcement.actionLabel && (
            <span className={`hidden md:inline-flex items-center gap-1 text-xs font-bold ${style.accentText} hover:underline shrink-0 font-mono`}>
              <span>{announcement.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          )}
        </div>

        <button
          onClick={handleDismiss}
          title="Dismiss Announcement"
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
