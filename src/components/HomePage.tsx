import React, { useState } from 'react';
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
  Headphones,
  Flame,
  Layers,
  Timer,
  Cpu,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Activity
} from 'lucide-react';
import { MiningPackage, UserProfile, PackageType, DepositRequest } from '../types';
import { DAILY_PACKAGES, FLASH_48H_PACKAGES } from '../data/packagesData';
import { DatacenterInfrastructure } from './DatacenterInfrastructure';
import { MiningFaqSection } from './MiningFaqSection';

interface HomePageProps {
  packages: MiningPackage[];
  user: UserProfile | null;
  deposits?: DepositRequest[];
  onOpenAuth: (mode: 'login' | 'signup', targetPkg?: MiningPackage) => void;
  onSelectPackage: (pkg: MiningPackage) => void;
  onOpenLiveSupport: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  packages,
  user,
  deposits = [],
  onOpenAuth,
  onSelectPackage,
  onOpenLiveSupport,
}) => {
  // Plan type selector: 'daily' | 'flash_48h'
  const [selectedPlanType, setSelectedPlanType] = useState<PackageType>('daily');

  const activePackageList = selectedPlanType === 'daily' ? DAILY_PACKAGES : FLASH_48H_PACKAGES;

  // Check if current user has already purchased this package (1 purchase max limit per package)
  const isPackagePurchased = (pkg: MiningPackage): boolean => {
    if (!user || !deposits || deposits.length === 0) return false;
    return deposits.some(d => 
      (d.userId === user.id || d.userName === user.name) &&
      (d.status === 'approved' || d.status === 'pending') &&
      (
        d.packageId === pkg.id || 
        d.packageName === pkg.name || 
        (d.vipLevel === pkg.vipLevel && (d.planType === pkg.planType || (!d.planType && pkg.planType === 'daily')))
      )
    );
  };

  const handlePackageClick = (pkg: MiningPackage) => {
    if (isPackagePurchased(pkg)) return;
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
            High-Yield Cloud Mining & <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              48-Hour Flash Contracts
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Choose between <strong>Continuous Daily Mining (2% – 3% floating daily profit)</strong> or <strong>48-Hour Flash Contracts (10% to 25% one-time profit after 48h)</strong>.
          </p>

          {/* Highlights Row */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">100% Guaranteed Payouts</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <Timer className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-semibold">48-Hour Flash (10% - 25%)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-semibold">Instant USDT Withdrawals</span>
            </div>
          </div>

        </div>
      </section>

      {/* Package Categories & Selection Section */}
      <section id="packages-section" className="space-y-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
            Investment Products
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Choose Your Profit Strategy
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Select your preferred model below: Continuous daily mining or 48-hour flash profit.
          </p>
        </div>

        {/* 2 Category Switcher Tabs */}
        <div className="flex justify-center">
          <div className="p-1.5 rounded-2xl bg-[#0e1628] border border-slate-800 inline-flex flex-col sm:flex-row gap-2 shadow-xl">
            
            {/* Tab 1: Daily Variable Mining */}
            <button
              onClick={() => setSelectedPlanType('daily')}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedPlanType === 'daily'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Continuous Daily Mining (2% – 3% Daily)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                selectedPlanType === 'daily' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'
              }`}>
                365 Days
              </span>
            </button>

            {/* Tab 2: 48-Hour Flash Contracts */}
            <button
              onClick={() => setSelectedPlanType('flash_48h')}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedPlanType === 'flash_48h'
                  ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white font-black shadow-lg shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>48-Hour Flash Contracts (10% – 25% Profit)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                selectedPlanType === 'flash_48h' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-300'
              }`}>
                Starts $100
              </span>
            </button>

          </div>
        </div>

        {/* Category Description Banner */}
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm ${
          selectedPlanType === 'daily'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
        }`}>
          {selectedPlanType === 'daily' ? (
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Daily Variable Mining:</strong> Mining outputs are calculated 24/7 and distributed every 6 hours with 2.0% to 3.0% floating daily yields. 100% exchangeable to USDT anytime.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                <strong>48-Hour Flash Contracts:</strong> One-time high-speed profit plans. Receive <strong>10% on $100, 12% on $500, 14% on $1,000, 20% on $5,000, and 25% on $10,000</strong> credited in lump sum after exactly 48 hours!
              </span>
            </div>
          )}
        </div>

        {/* 5 Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {activePackageList.map((pkg) => {
            const isFlash = pkg.planType === 'flash_48h';
            const isPurchased = isPackagePurchased(pkg);

            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between border ${
                  isPurchased
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-950/20 shadow-lg'
                    : isFlash
                    ? 'bg-gradient-to-b from-[#181128] via-[#100d1e] to-[#0a0714] border-rose-900/60 hover:border-rose-500/60 shadow-lg shadow-rose-950/20 hover:scale-[1.02]'
                    : 'bg-gradient-to-b from-[#10192e] via-[#0d1424] to-[#090e18] border-slate-800 hover:border-amber-500/50 shadow-xl hover:scale-[1.02]'
                }`}
              >
                {/* Top Badge */}
                {isPurchased ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md bg-emerald-500 text-slate-950 border border-emerald-300/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Node (1/1 Limit)
                    </span>
                  </div>
                ) : pkg.badge ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md ${
                      isFlash
                        ? 'bg-gradient-to-r from-rose-600 to-orange-500 text-white border border-rose-400/40'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border border-amber-300/40'
                    }`}>
                      {pkg.badge}
                    </span>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {/* Header */}
                  <div className="pt-2 text-center border-b border-slate-800/80 pb-3">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                        isPurchased ? 'bg-emerald-500/20 text-emerald-300' : isFlash ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {isPurchased ? 'Node Purchased' : isFlash ? '48H Flash' : `VIP Tier ${pkg.vipLevel}`}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1.5">{pkg.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="text-center py-1">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                      ${pkg.priceUsd.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">USDT Capital</span>
                  </div>

                  {/* Profit Rate Banner */}
                  <div className={`p-2.5 rounded-2xl text-center border ${
                    isPurchased
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isFlash 
                      ? 'bg-rose-500/10 border-rose-500/30' 
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <div className={`text-sm font-black font-mono ${isPurchased ? 'text-emerald-400' : isFlash ? 'text-rose-400' : 'text-amber-400'}`}>
                      {isFlash ? `+${pkg.profitPercent}% Fixed Profit` : pkg.profitRangeText}
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                      {isPurchased ? 'Earning Active in Dashboard' : isFlash ? `After 48 Hours: +$${pkg.oneTimeProfitUsd?.toLocaleString()}` : `Est. $${pkg.dailyReturnUsd.toFixed(2)} / day`}
                    </div>
                  </div>

                  {/* Return Summary for Flash */}
                  {isFlash && pkg.totalPayoutUsd && (
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Capital:</span>
                        <span className="text-white font-bold">${pkg.priceUsd.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>Profit (48h):</span>
                        <span className="font-bold">+${pkg.oneTimeProfitUsd?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-white font-black border-t border-slate-800 pt-1">
                        <span>Total Payout:</span>
                        <span className="text-amber-400">${pkg.totalPayoutUsd.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                    {pkg.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isPurchased ? 'text-emerald-400' : isFlash ? 'text-rose-400' : 'text-emerald-400'}`} />
                        <span className="leading-tight text-slate-300">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deposit / Start Button */}
                <div className="pt-5">
                  <button
                    disabled={isPurchased}
                    onClick={() => handlePackageClick(pkg)}
                    className={`w-full py-3 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                      isPurchased
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
                        : isFlash
                        ? 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-rose-600/25 cursor-pointer'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25 cursor-pointer'
                    }`}
                  >
                    {isPurchased ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Already Purchased (1 Max)</span>
                      </>
                    ) : (
                      <>
                        <span>{user ? 'Select Package' : 'Deposit & Activate'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </section>

      {/* How it Works / Protocol Pipeline Section */}
      <section id="how-to-start-earning-section" className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0e1629] via-[#0b101e] to-[#070b14] border border-slate-800/80 shadow-2xl overflow-hidden space-y-8">
        
        {/* Subtle background glow accents */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Automated Yield Architecture</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            How to Start Earning in 3 Simple Steps
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Begin earning institutional-grade cloud mining yields within minutes. No complex hardware configuration required.
          </p>
        </div>

        {/* 3 Interactive Step Progression Cards */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* STEP 1 */}
          <div className="group relative p-6 rounded-2xl bg-[#111a30]/80 hover:bg-[#131e38] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              
              {/* Header with Step Number & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-md shadow-amber-500/10">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-400">
                  <span className="text-slate-500 font-normal">STEP</span>
                  <span>01</span>
                </div>
              </div>

              {/* Title & Micro-badge */}
              <div className="space-y-1">
                <div className="inline-block text-[10px] font-mono font-bold uppercase text-amber-400/90">
                  USDT TRC20 / ERC20 Supported
                </div>
                <h4 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  Select Strategy & Deposit
                </h4>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                Choose between continuous daily mining or high-speed 48-hour flash contracts. Transfer USDT to your designated node address with zero platform fees.
              </p>
            </div>

            {/* Step Features Tags */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Instant Processing
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" /> Secure Protocol
              </span>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="group relative p-6 rounded-2xl bg-[#111a30]/80 hover:bg-[#131e38] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              
              {/* Header with Step Number & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-md shadow-cyan-500/10">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-cyan-400">
                  <span className="text-slate-500 font-normal">STEP</span>
                  <span>02</span>
                </div>
              </div>

              {/* Title & Micro-badge */}
              <div className="space-y-1">
                <div className="inline-block text-[10px] font-mono font-bold uppercase text-cyan-400/90">
                  Automated Stratum Sync
                </div>
                <h4 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                  Instant Mining Activation
                </h4>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                Upon ledger confirmation, enterprise GPU/ASIC clusters immediately allocate hashrate to your account. Smart contracts begin computing block rewards 24/7.
              </p>
            </div>

            {/* Step Features Tags */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Real-Time Stratum
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" /> 99.9% Uptime
              </span>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="group relative p-6 rounded-2xl bg-[#111a30]/80 hover:bg-[#131e38] border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              
              {/* Header with Step Number & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/10">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400">
                  <span className="text-slate-500 font-normal">STEP</span>
                  <span>03</span>
                </div>
              </div>

              {/* Title & Micro-badge */}
              <div className="space-y-1">
                <div className="inline-block text-[10px] font-mono font-bold uppercase text-emerald-400/90">
                  Live Liquidity & Payouts
                </div>
                <h4 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                  Daily Yields & Direct Payouts
                </h4>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                Watch real-time hash production and claim daily profits. Flash contracts unlock principal + lump sum returns automatically after 48 hours for fast USDT withdrawal.
              </p>
            </div>

            {/* Step Features Tags */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" /> ETH to USDT Swap
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-400" /> Fast Withdrawals
              </span>
            </div>
          </div>

        </div>

        {/* Enterprise Trust & Protocol Metrics Strip */}
        <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-mono font-black text-white">99.98%</div>
            <div className="text-[11px] text-slate-400 font-medium">Cluster Availability</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-mono font-black text-amber-400">6 Hours</div>
            <div className="text-[11px] text-slate-400 font-medium">Profit Settlement Epoch</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-mono font-black text-emerald-400">0% Fee</div>
            <div className="text-[11px] text-slate-400 font-medium">Protocol Swap Rate</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-mono font-black text-cyan-400">24/7</div>
            <div className="text-[11px] text-slate-400 font-medium">Automated Liquidity</div>
          </div>
        </div>

      </section>

      {/* Global Data Center Rigs & Proof-of-Reserves Section */}
      <DatacenterInfrastructure />

      {/* Frequently Asked Questions (FAQ) Section */}
      <MiningFaqSection />

      {/* Floating 24/7 Live Support CTA */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-blue-900/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Need help setting up your miner?</h4>
            <p className="text-xs text-slate-300">
              Our 24/7 live blockchain engineers are ready to assist you anytime.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLiveSupport}
          className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs transition-all shadow-lg shadow-blue-500/25 cursor-pointer shrink-0"
        >
          Chat with Support
        </button>
      </section>

    </div>
  );
};
