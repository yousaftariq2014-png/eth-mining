import React from 'react';
import { 
  Zap, 
  Wallet, 
  Sparkles, 
  Activity, 
  User, 
  LogOut, 
  LogIn, 
  Home,
  ShieldCheck,
  CreditCard,
  History,
  Crown,
  Bell,
  Users,
  Flame
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onOpenNotifications?: () => void;
  onOpenReferral?: () => void;
  onOpenVipStreak?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenAuth,
  onLogout,
  onOpenNotifications,
  onOpenReferral,
  onOpenVipStreak,
  unreadNotificationsCount = 0
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-1 sm:gap-4">
          
          {/* Logo & Brand */}
          <div 
            id="brand-logo-btn"
            className="flex items-center gap-1.5 sm:gap-3 cursor-pointer shrink-0 min-w-0" 
            onClick={() => setCurrentTab(user ? 'dashboard' : 'home')}
          >
            {/* Multi-color Ethereum Diamond Logo */}
            <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-amber-500/30 p-1 shrink-0">
              <svg viewBox="0 0 784.37 1277.39" className="w-4 h-4 sm:w-6 sm:h-6 filter drop-shadow">
                <polygon points="392.07,0 383.5,29.11 383.5,872.9 392.07,881.46 784.13,649.65" fill="#f59e0b" />
                <polygon points="392.07,0 0,649.65 392.07,881.46 392.07,472.02" fill="#ec4899" />
                <polygon points="392.07,949.66 386.66,956.26 386.66,1263.96 392.07,1277.39 784.37,726.55" fill="#06b6d4" />
                <polygon points="392.07,1277.39 392.07,949.66 0,726.55" fill="#8b5cf6" />
                <polygon points="392.07,881.46 784.13,649.65 392.07,472.02" fill="#10b981" />
                <polygon points="0,649.65 392.07,881.46 392.07,472.02" fill="#3b82f6" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-extrabold text-xs sm:text-lg tracking-tight text-white whitespace-nowrap">
                  ETH2.0 <span className="text-amber-400">SMART</span>
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black tracking-wider uppercase rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  DEFI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Cloud Mining & 6-Hour Smart Production
              </p>
            </div>
          </div>

          {/* Simple Navigation Links & Loyalty Shortcuts */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Packages Tab — Only shown if NOT logged in */}
            {!user && (
              <button
                onClick={() => setCurrentTab('home')}
                title="Investment Plans"
                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'home'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Investment Plans</span>
              </button>
            )}

            {/* Dashboard Tab (for logged in users) */}
            {user && (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  title="Mining Dashboard"
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                >
                  <Activity className="w-4 h-4 shrink-0 text-slate-950" />
                  <span className="hidden xs:inline whitespace-nowrap">Dashboard</span>
                </button>

                {/* Affiliate Program Header Button */}
                {onOpenReferral && (
                  <button
                    onClick={onOpenReferral}
                    title="Affiliate & Referral"
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden md:inline whitespace-nowrap">Referrals (11%)</span>
                  </button>
                )}

                {/* Daily Streak / VIP Header Button */}
                {onOpenVipStreak && (
                  <button
                    onClick={onOpenVipStreak}
                    title="Daily Check-in & VIP"
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="hidden md:inline whitespace-nowrap">VIP Club</span>
                  </button>
                )}
              </>
            )}

          </nav>

          {/* Right Action: Notifications & User Status / Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Notification Bell */}
                {onOpenNotifications && (
                  <button
                    onClick={onOpenNotifications}
                    title="System Notifications"
                    className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-mono text-white font-bold animate-pulse">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                )}

                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {user.plan || `VIP ${user.vipLevel || 1}`}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Log Out"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
