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
  Crown
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Brand */}
          <div 
            id="brand-logo-btn"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0" 
            onClick={() => setCurrentTab(user ? 'dashboard' : 'home')}
          >
            {/* Multi-color Ethereum Diamond Logo */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-amber-500/30 p-1">
              <svg viewBox="0 0 784.37 1277.39" className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow">
                <polygon points="392.07,0 383.5,29.11 383.5,872.9 392.07,881.46 784.13,649.65" fill="#f59e0b" />
                <polygon points="392.07,0 0,649.65 392.07,881.46 392.07,472.02" fill="#ec4899" />
                <polygon points="392.07,949.66 386.66,956.26 386.66,1263.96 392.07,1277.39 784.37,726.55" fill="#06b6d4" />
                <polygon points="392.07,1277.39 392.07,949.66 0,726.55" fill="#8b5cf6" />
                <polygon points="392.07,881.46 784.13,649.65 392.07,472.02" fill="#10b981" />
                <polygon points="0,649.65 392.07,881.46 392.07,472.02" fill="#3b82f6" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                  ETH2.0 <span className="text-amber-400">SMART</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black tracking-wider uppercase rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  DEFI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Cloud Mining & 6-Hour Smart Production
              </p>
            </div>
          </div>

          {/* Simple Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            
            {/* Packages Tab */}
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'home'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>5 Packages</span>
            </button>

            {/* Dashboard Tab (for logged in users) */}
            {user && (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'dashboard'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Mining Dashboard</span>
              </button>
            )}

          </nav>

          {/* Right Action: User Status / Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {user.plan || `VIP ${user.vipLevel || 1}`}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Log Out"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1"
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
