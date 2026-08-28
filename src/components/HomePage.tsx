import React from 'react';
import { 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Coins, 
  DollarSign, 
  TrendingUp, 
  Server, 
  CheckCircle2, 
  Clock, 
  Award,
  Wallet,
  Users,
  Lock,
  Headphones
} from 'lucide-react';
import { MiningPackage, UserProfile } from '../types';

interface HomePageProps {
  packages: MiningPackage[];
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup', targetPkg?: MiningPackage) => void;
  onSelectPackage: (pkg: MiningPackage) => void;
  onOpenLiveSupport: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  packages,
  user,
  onOpenAuth,
  onSelectPackage,
  onOpenLiveSupport,
}) => {
  const handlePackageClick = (pkg: MiningPackage) => {
    if (!user) {
      onOpenAuth('signup', pkg);
    } else {
      onSelectPackage(pkg);
    }
  };

  return (
    <div id="home-landing-page" className="space-y-10 sm:space-y-14 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Hero Banner */}
      <section className="relative rounded-3xl bg-gradient-to-b from-[#111c35] via-[#0d1527] to-[#070a11] border border-amber-500/30 p-6 sm:p-12 overflow-hidden shadow-2xl">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          
          {/* Bonus Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/10 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ETH2.0 & BTC Smart Production Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Next-Gen Cloud Mining with <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              Automated 6-Hour Payouts
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Select a verified mining package below. Create an account, submit your deposit, and receive continuous PoW profits credited straight to your dashboard 4 times a day.
          </p>

          {/* Highlights Row */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">100% Hardware Uptime</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-semibold">Payouts Every 6 Hours</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-semibold">Instant USDT Withdrawals</span>
            </div>
          </div>

        </div>
      </section>

      {/* Main 5 Mining Packages Showcase (Core User Focus) */}
      <section id="packages-section" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
            Available Packages
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Choose Your Mining Package
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Click on any package to sign up, deposit USDT, and activate your live cloud mining node.
          </p>
        </div>

        {/* 5 Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              id={`package-card-${pkg.vipLevel}`}
              className={`rounded-3xl bg-[#111726] border p-5 flex flex-col justify-between relative transition-all hover:scale-[1.02] shadow-xl ${
                pkg.popular || pkg.vipLevel === 5
                  ? 'border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {pkg.badge && (
                <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 uppercase tracking-wider shadow-md">
                  {pkg.badge}
                </span>
              )}

              <div className="space-y-4">
                {/* Header: VIP level & Name */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      VIP {pkg.vipLevel}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{pkg.durationDays} Days</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">
                    {pkg.name}
                  </h3>
                </div>

                {/* Price Display */}
                <div className="p-3.5 rounded-2xl bg-[#090d16] border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Package Price</div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-white font-mono">${pkg.priceUsd}</span>
                    <span className="text-xs text-amber-400 font-bold font-mono">USDT</span>
                  </div>
                </div>

                {/* Hashrate & Returns */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Node Hashrate:</span>
                    <span className="font-bold text-amber-400">{pkg.hashrate} {pkg.hashrateUnit}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Daily Return:</span>
                    <span className="font-bold text-emerald-400">+{pkg.dailyReturnPercent}% / day</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Daily Profit:</span>
                    <span className="font-bold text-white">${pkg.dailyReturnUsd.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cycle Income:</span>
                    <span className="font-bold text-cyan-300">~{pkg.sixHourIncomeEth} ETH</span>
                  </div>
                </div>

                {/* Features bullet list */}
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
                  {pkg.features.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Purchase / Buy Package */}
              <button
                id={`btn-purchase-pkg-${pkg.vipLevel}`}
                type="button"
                onClick={() => handlePackageClick(pkg)}
                className="mt-5 w-full py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-98"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{user ? `Deposit & Activate ($${pkg.priceUsd})` : `Buy VIP ${pkg.vipLevel} Package`}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Step Purchase Process */}
      <section className="rounded-3xl bg-[#0d1424] border border-slate-800 p-6 sm:p-10 space-y-6 shadow-md">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
            Simple 3-Step Process
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white mt-1">
            How to Start Mining & Earn Daily Profits
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#111a30] border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black flex items-center justify-center">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Select Package & Sign Up</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pick one of the 5 mining packages from $100 to $2,500 and create your account in seconds.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#111a30] border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-black flex items-center justify-center">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Deposit USDT & Pending Approval</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Send USDT (TRC-20 or ERC-20) to the provided wallet address. Admin verifies your deposit.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#111a30] border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black flex items-center justify-center">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Automated Mining & Profits</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mining runs continuously. View live earnings, redeem ETH to USDT, and withdraw anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Security Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#0d1424] to-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Institutional Smart Contract Security & 24/7 Support
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Secure PoW mining clusters with transparent 6-hour cycle reward distributions.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLiveSupport}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-blue-500/20"
        >
          <Headphones className="w-4 h-4" />
          <span>Contact Live Support</span>
        </button>
      </section>

    </div>
  );
};
