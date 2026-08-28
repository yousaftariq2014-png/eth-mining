import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Coins, 
  ArrowLeft, 
  ArrowLeftRight, 
  Wallet, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronRight, 
  X, 
  AlertCircle, 
  Flame, 
  Share2, 
  Users, 
  Layers, 
  DollarSign, 
  Award,
  QrCode,
  MessageCircle,
  Headphones,
  RefreshCw,
  ExternalLink,
  Plus,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, MiningPackage, DepositRequest, EarningRecordItem, WithdrawalRecordItem, PackageType } from '../types';
import { INITIAL_EARNINGS_RECORDS, INITIAL_WITHDRAWAL_RECORDS, DAILY_PACKAGES, FLASH_48H_PACKAGES } from '../data/packagesData';

interface ClientSmartDashboardProps {
  user: UserProfile;
  packages: MiningPackage[];
  onSelectPackage: (pkg: MiningPackage) => void;
  onOpenLiveSupport?: () => void;
  pendingDeposits: DepositRequest[];
}

export const ClientSmartDashboard: React.FC<ClientSmartDashboardProps> = ({
  user,
  packages,
  onSelectPackage,
  onOpenLiveSupport,
  pendingDeposits,
}) => {
  // Main Navigation: 'financial' | 'reward' | 'assets'
  const [activeNav, setActiveNav] = useState<'financial' | 'reward' | 'assets'>('assets');

  // Inner tab for Assets: 'recharge' | 'exchange' | 'withdraw'
  const [actionTab, setActionTab] = useState<'recharge' | 'exchange' | 'withdraw'>('exchange');

  // Full Screen Overlays (matching Screenshot 2 & 3)
  const [showEarningsDetailsView, setShowEarningsDetailsView] = useState<boolean>(false);
  const [showWithdrawalRecordView, setShowWithdrawalRecordView] = useState<boolean>(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'All' | 'Pending' | 'Withdrawal successfully' | 'Failed'>('All');

  // Dashboard Package Category Switcher: 'daily' | 'flash_48h'
  const [dashCategory, setDashCategory] = useState<PackageType>('daily');

  // Active VIP Level and Package
  const activeApprovedDeposit = pendingDeposits.find(d => d.userId === user.id && d.status === 'approved');
  const userPendingDeposit = pendingDeposits.find(d => d.userId === user.id && d.status === 'pending');
  
  const currentVipLevel = activeApprovedDeposit ? activeApprovedDeposit.vipLevel : (user.vipLevel || 2);
  const currentPkg = packages.find(p => p.vipLevel === currentVipLevel) || packages[1];

  // Dynamic balances & live mining states
  const [exchangeInputEth, setExchangeInputEth] = useState<string>('2.03171117');
  const [totalOutputEth, setTotalOutputEth] = useState<number>(35.21059644);
  const [exchangeableEth, setExchangeableEth] = useState<number>(4.22305878);
  const [walletBalanceUsdt, setWalletBalanceUsdt] = useState<number>(186193.1680);
  const [withdrawableUsdt, setWithdrawableUsdt] = useState<number>(12471.02);

  // Forms
  const [withdrawInputUsdt, setWithdrawInputUsdt] = useState<string>('12471.02');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');

  // Notification Toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Prices (matching screenshots)
  const ethPriceUsd = 2956.75;
  const btcPriceUsd = 87923.61;
  const btcEthRatio = "29.74";
  const btcUsdcPrice = 87892.02;
  const ethUsdcPrice = 2956.38;

  // Earnings details and withdrawal records
  const [earningsData, setEarningsData] = useState<EarningRecordItem[]>(INITIAL_EARNINGS_RECORDS);
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecordItem[]>(INITIAL_WITHDRAWAL_RECORDS);

  // Live real-time mining output ticker (mining runs continuously)
  useEffect(() => {
    const timer = setInterval(() => {
      const perTickIncrement = (currentPkg.sixHourIncomeEth / 7200) * 1.5; // continuous micro-growth
      setTotalOutputEth(prev => Number((prev + perTickIncrement).toFixed(8)));
      setExchangeableEth(prev => Number((prev + perTickIncrement).toFixed(8)));
    }, 2000);
    return () => clearInterval(timer);
  }, [currentPkg]);

  // Convert ETH to USDT
  const handleExchange = () => {
    const amountToExchange = parseFloat(exchangeInputEth);
    if (isNaN(amountToExchange) || amountToExchange <= 0) {
      showToast('Please enter a valid ETH amount', 'info');
      return;
    }
    if (amountToExchange > exchangeableEth) {
      showToast('Insufficient exchangeable ETH balance', 'info');
      return;
    }

    const usdtGained = amountToExchange * ethPriceUsd;
    setExchangeableEth(prev => Math.max(0, Number((prev - amountToExchange).toFixed(8))));
    setWalletBalanceUsdt(prev => Number((prev + usdtGained).toFixed(4)));
    setWithdrawableUsdt(prev => Number((prev + usdtGained).toFixed(2)));

    // Add to earnings history
    const now = new Date();
    const formattedDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    setEarningsData(prev => [
      {
        id: `e-${Date.now()}`,
        time: formattedDate,
        incomeEth: `${amountToExchange.toFixed(6)} ETH`,
        accountBalance: (walletBalanceUsdt + usdtGained).toFixed(4)
      },
      ...prev
    ]);

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    showToast(`Successfully exchanged ${amountToExchange} ETH to +$${usdtGained.toFixed(2)} USDT!`, 'success');
  };

  // Withdraw USDT
  const handleWithdraw = () => {
    const amountToWithdraw = parseFloat(withdrawInputUsdt);
    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
      showToast('Please enter a valid withdrawal amount', 'info');
      return;
    }
    if (amountToWithdraw > withdrawableUsdt) {
      showToast('Withdrawal amount exceeds available balance', 'info');
      return;
    }
    if (!withdrawAddress.trim()) {
      showToast('Please enter destination USDT address', 'info');
      return;
    }

    const now = new Date();
    const formattedTime = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newRecord: WithdrawalRecordItem = {
      id: `w-${Date.now()}`,
      currency: 'USDT-ERCWithdrawal',
      type: 'USDT-ERC',
      amount: -amountToWithdraw,
      status: 'Pending',
      time: formattedTime,
    };

    setWithdrawalRecords(prev => [newRecord, ...prev]);
    setWithdrawableUsdt(prev => Number((prev - amountToWithdraw).toFixed(2)));
    setWalletBalanceUsdt(prev => Number((prev - amountToWithdraw).toFixed(4)));

    showToast(`Withdrawal of $${amountToWithdraw.toFixed(2)} USDT submitted! Status: Pending review`, 'success');
    setTimeout(() => {
      setShowWithdrawalRecordView(true);
    }, 600);
  };

  const showToast = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredWithdrawals = withdrawalRecords.filter(r => {
    if (withdrawalFilter === 'All') return true;
    return r.status === withdrawalFilter;
  });

  /* =========================================================================
     VIEW A: SCREENSHOT 2 - "Earnings details" Full Page
     ========================================================================= */
  if (showEarningsDetailsView) {
    return (
      <div id="earnings-details-view" className="max-w-md mx-auto min-h-[750px] bg-[#0c121e] text-white flex flex-col justify-between rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-150">
        
        <div className="p-4 space-y-4">
          {/* Header with Back Arrow & Title */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <button
              onClick={() => setShowEarningsDetailsView(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white font-sans">Earnings details</h2>
            <div className="w-5" />
          </div>

          {/* List of 6-hour cycle earnings records */}
          <div className="space-y-3 font-mono text-xs max-h-[580px] overflow-y-auto pr-1">
            {earningsData.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Time</span>
                  <span className="text-slate-200">{item.time}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Income</span>
                  <span className="text-emerald-400 font-bold">{item.incomeEth}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Account balance</span>
                  <span className="text-white font-bold">{item.accountBalance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-[#080c16] border-t border-slate-800 p-3 flex items-center justify-around text-xs font-semibold">
          <button onClick={() => { setShowEarningsDetailsView(false); setActiveNav('financial'); }} className="text-slate-400 hover:text-white">Financial</button>
          <button onClick={() => { setShowEarningsDetailsView(false); setActiveNav('reward'); }} className="text-slate-400 hover:text-white">Reward</button>
          <button onClick={() => setShowEarningsDetailsView(false)} className="text-[#f77f00] font-bold">Assets</button>
        </div>
      </div>
    );
  }

  /* =========================================================================
     VIEW B: SCREENSHOT 3 - "Withdrawal record" Full Page
     ========================================================================= */
  if (showWithdrawalRecordView) {
    return (
      <div id="withdrawal-record-view" className="max-w-md mx-auto min-h-[750px] bg-[#0c121e] text-white flex flex-col justify-between rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-150">
        
        <div className="p-4 space-y-4">
          {/* Header with Back Arrow */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <button
              onClick={() => setShowWithdrawalRecordView(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white font-sans">Withdrawal record</h2>
            <div className="w-5" />
          </div>

          {/* 4 Status Tabs: All | Pending | Withdrawal successfully | Failed */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-medium">
            {(['All', 'Pending', 'Withdrawal successfully', 'Failed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setWithdrawalFilter(tab)}
                className={`pb-1.5 transition-colors cursor-pointer text-center ${
                  withdrawalFilter === tab
                    ? 'text-[#f77f00] font-bold border-b-2 border-[#f77f00]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'Withdrawal successfully' ? 'Withdrawal succ...' : tab}
              </button>
            ))}
          </div>

          {/* Withdrawal Records List */}
          <div className="space-y-3 font-mono text-xs max-h-[540px] overflow-y-auto pr-1">
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No withdrawal records found.
              </div>
            ) : (
              filteredWithdrawals.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Currency</span>
                    <span className="text-white font-bold">{rec.currency}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Type</span>
                    <span className="text-slate-300">{rec.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-rose-400 font-bold">{rec.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status</span>
                    <span className={`font-bold ${
                      rec.status === 'Pending' 
                        ? 'text-amber-400' 
                        : rec.status === 'Withdrawal successfully' 
                        ? 'text-emerald-400' 
                        : 'text-rose-400'
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Time</span>
                    <span className="text-slate-400">{rec.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-[#080c16] border-t border-slate-800 p-3 flex items-center justify-around text-xs font-semibold">
          <button onClick={() => { setShowWithdrawalRecordView(false); setActiveNav('financial'); }} className="text-slate-400 hover:text-white">Financial</button>
          <button onClick={() => { setShowWithdrawalRecordView(false); setActiveNav('reward'); }} className="text-slate-400 hover:text-white">Reward</button>
          <button onClick={() => setShowWithdrawalRecordView(false)} className="text-[#f77f00] font-bold">Assets</button>
        </div>
      </div>
    );
  }

  /* =========================================================================
     VIEW C: SCREENSHOT 1 - Main "Assets" Smart Production Dashboard
     ========================================================================= */
  const displayedCategoryPackages = dashCategory === 'daily' ? DAILY_PACKAGES : FLASH_48H_PACKAGES;

  return (
    <div id="client-smart-dashboard-view" className="max-w-md mx-auto min-h-[820px] bg-[#0c121e] text-white flex flex-col justify-between rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative pb-16">
      
      {/* Toast */}
      {notification && (
        <div className="absolute top-3 left-4 right-4 z-50 p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header (Matching Screenshot 1) */}
      <div className="p-4 bg-gradient-to-b from-[#0e1628] to-[#0a101f] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Prism Ethereum Logo */}
          <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 784.37 1277.39" className="w-5 h-5">
              <polygon points="392.07,0 383.5,29.11 383.5,872.9 392.07,881.46 784.13,649.65" fill="#f59e0b" />
              <polygon points="392.07,0 0,649.65 392.07,881.46 392.07,472.02" fill="#ec4899" />
              <polygon points="392.07,949.66 386.66,956.26 386.66,1263.96 392.07,1277.39 784.37,726.55" fill="#06b6d4" />
              <polygon points="392.07,1277.39 392.07,949.66 0,726.55" fill="#8b5cf6" />
            </svg>
          </div>
          <span className="text-xs font-black tracking-wide text-amber-400 font-sans">
            ETH2.0 Smart production
          </span>
        </div>

        {/* English Pill */}
        <div className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
          English
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Pending Deposit Notice if any */}
        {userPendingDeposit && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Clock className="w-4 h-4 animate-spin shrink-0" style={{ animationDuration: '4s' }} />
              <span>
                <strong>Deposit ${userPendingDeposit.amountUsd} USDT</strong> is being reviewed by Blockchain Admin.
              </span>
            </div>
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase">
              Pending
            </span>
          </div>
        )}

        {/* Live Active Mining Node Card */}
        <div className="rounded-2xl bg-gradient-to-r from-[#111c35] via-[#0d162b] to-[#111c35] border border-amber-500/40 p-4 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-white">Active Mining Node</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                VIP {currentVipLevel}
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              +{currentPkg.dailyReturnPercent}% / day
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400">Total Mined:</span>
              <div className="text-xs font-black text-amber-400 truncate mt-0.5">
                {totalOutputEth.toFixed(6)} ETH
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400">Exchangeable:</span>
              <div className="text-xs font-black text-emerald-400 truncate mt-0.5">
                {exchangeableEth.toFixed(6)} ETH
              </div>
            </div>
          </div>
        </div>

        {/* Package Upgrade & Selection Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Choose / Upgrade Investment Package</span>
            
            {/* Category Toggle: Daily vs 48H Flash */}
            <div className="flex items-center gap-1 bg-[#10182c] p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDashCategory('daily')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  dashCategory === 'daily' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily 2%-3%
              </button>
              <button
                type="button"
                onClick={() => setDashCategory('flash_48h')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  dashCategory === 'flash_48h' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                48H Flash
              </button>
            </div>
          </div>

          {/* Grid of Packages in the selected category */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayedCategoryPackages.map((pkg) => {
              const isCurrent = pkg.vipLevel === currentVipLevel && (pkg.planType === activeApprovedDeposit?.planType || (!activeApprovedDeposit && pkg.planType === 'daily'));
              const isFlash = pkg.planType === 'flash_48h';
              return (
                <button
                  key={pkg.id}
                  onClick={() => onSelectPackage(pkg)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-500'
                      : isFlash
                      ? 'bg-[#151128] border-rose-950/60 text-slate-300 hover:border-rose-700/60'
                      : 'bg-[#10182c] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-black ${isFlash ? 'text-rose-400' : 'text-amber-400'}`}>
                      {isFlash ? '48H FLASH' : `VIP ${pkg.vipLevel}`}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400">
                      {isFlash ? `+${pkg.profitPercent}% (48h)` : pkg.profitRangeText || `+${pkg.dailyReturnPercent}%`}
                    </span>
                  </div>
                  <div className="text-xs font-black font-mono mt-1 text-white">${pkg.priceUsd.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{pkg.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ▸ Pair price Card (Exact match to Screenshot 1) */}
        <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 p-3.5 space-y-2 text-xs font-mono">
          <div className="text-slate-400 font-bold flex items-center gap-1">
            <span>▸</span>
            <span>Pair price</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">BTC/ETH</span>
              <span className="font-bold text-white">{btcEthRatio}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">BTC/USDT</span>
              <span className="font-bold text-white">{btcPriceUsd.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ETH/USDT</span>
              <span className="font-bold text-white">{ethPriceUsd.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">BTC/USDC</span>
              <span className="font-bold text-white">{btcUsdcPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ETH/USDC</span>
              <span className="font-bold text-white">{ethUsdcPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 3 Action Buttons: Recharge | Exchange (Active) | Withdraw */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              setActionTab('recharge');
              onSelectPackage(currentPkg);
            }}
            className={`py-2 px-3 rounded-full text-xs font-bold text-center transition-all cursor-pointer border ${
              actionTab === 'recharge'
                ? 'bg-[#f77f00] text-white border-transparent'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            Recharge
          </button>

          <button
            onClick={() => setActionTab('exchange')}
            className={`py-2 px-3 rounded-full text-xs font-bold text-center transition-all cursor-pointer border ${
              actionTab === 'exchange'
                ? 'bg-[#f77f00] text-white border-transparent'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            Exchange
          </button>

          <button
            onClick={() => setActionTab('withdraw')}
            className={`py-2 px-3 rounded-full text-xs font-bold text-center transition-all cursor-pointer border ${
              actionTab === 'withdraw'
                ? 'bg-[#f77f00] text-white border-transparent'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* ▎Exchange Card (Matching Screenshot 1) */}
        {actionTab === 'exchange' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="text-emerald-400 text-sm">▎</span>
              <span>Exchange</span>
            </div>

            {/* Inner Dark Swap Box with Rounded White Outline */}
            <div className="rounded-2xl bg-[#090d16] border-2 border-slate-300 p-4 space-y-4 shadow-inner">
              
              {/* Swap Row: ETH on Left | Swap Icon Center | USDT on Right */}
              <div className="flex items-center justify-between gap-2">
                
                {/* Left: ETH Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={exchangeInputEth}
                    onChange={(e) => setExchangeInputEth(e.target.value)}
                    className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none border-b border-slate-700 pb-1"
                  />
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Available: {exchangeableEth.toFixed(4)} ETH</div>
                </div>

                {/* Center: Green Swap Arrow */}
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  ⇄
                </div>

                {/* Right: Calculated USDT */}
                <div className="flex-1 text-right">
                  <div className="text-sm font-mono font-bold text-white border-b border-slate-700 pb-1">
                    {(parseFloat(exchangeInputEth || '0') * ethPriceUsd).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Rate: 1 ETH = ${ethPriceUsd}</div>
                </div>
              </div>

              {/* Bottom Row: Redeem All (Left) & USDT Green Badge (Right) */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setExchangeInputEth(exchangeableEth.toFixed(8))}
                  className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer underline"
                >
                  Redeem all
                </button>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  <span>₮</span>
                  <span>USDT</span>
                </div>
              </div>

            </div>

            {/* Primary Action Button: Exchange (Dark Blue) */}
            <button
              onClick={handleExchange}
              className="w-full py-3.5 rounded-2xl bg-[#0c1c38] hover:bg-[#11274f] text-white font-black text-xs sm:text-sm border border-slate-700 shadow-md cursor-pointer transition-all active:scale-98"
            >
              Exchange
            </button>

            {/* Secondary Action Button: Record (Dark Blue) -> Opens Screenshot 3 / 2 */}
            <button
              onClick={() => setShowWithdrawalRecordView(true)}
              className="w-full py-3.5 rounded-2xl bg-[#0c1c38] hover:bg-[#11274f] text-white font-black text-xs sm:text-sm border border-slate-700 shadow-md cursor-pointer transition-all"
            >
              Record
            </button>

            {/* VIP Tier Badge (Centered) */}
            <div className="flex items-center justify-center pt-1">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 text-xs font-black font-mono">
                VIP {currentVipLevel}
              </span>
            </div>

            {/* Quick Link to Earnings Details */}
            <div className="text-center pt-1">
              <button
                onClick={() => setShowEarningsDetailsView(true)}
                className="text-xs text-slate-400 hover:text-amber-400 underline cursor-pointer"
              >
                View 6-Hour Cycle Earnings Details &rarr;
              </button>
            </div>

          </div>
        )}

        {/* Withdraw Tab View */}
        {actionTab === 'withdraw' && (
          <div className="space-y-3 p-4 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="text-rose-400 text-sm">▎</span>
              <span>USDT Withdrawal</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-mono">Destination Address (USDT-TRC20 / ERC20):</label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="w-full bg-[#080c16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Amount:</span>
                <span>Available: ${withdrawableUsdt.toFixed(2)} USDT</span>
              </div>
              <input
                type="number"
                value={withdrawInputUsdt}
                onChange={(e) => setWithdrawInputUsdt(e.target.value)}
                className="w-full bg-[#080c16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <button
              onClick={handleWithdraw}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
            >
              Submit Withdrawal Request
            </button>

            <button
              onClick={() => setShowWithdrawalRecordView(true)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
            >
              View Withdrawal History
            </button>
          </div>
        )}

      </div>

      {/* Floating Live Support Bubble (Bottom-Right) */}
      <button
        onClick={onOpenLiveSupport}
        className="fixed sm:absolute bottom-16 right-4 z-40 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 cursor-pointer transition-transform hover:scale-110 active:scale-95"
        title="Live Customer Service"
      >
        <MessageCircle className="w-6 h-6 fill-white text-white" />
      </button>

      {/* Bottom Navigation (Matching Screenshot 1) */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#080c16] border-t border-slate-800 p-2 flex flex-col items-center">
        <div className="flex items-center justify-around w-full text-xs font-semibold">
          
          <button
            onClick={() => setActiveNav('financial')}
            className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
              activeNav === 'financial' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Financial
          </button>

          <button
            onClick={() => setActiveNav('reward')}
            className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
              activeNav === 'reward' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Reward
          </button>

          <button
            onClick={() => setActiveNav('assets')}
            className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
              activeNav === 'assets' ? 'text-[#f77f00] font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Assets
          </button>

        </div>

        {/* Small Bottom Horizontal Indicator Line (Matching screenshot) */}
        <div className="w-28 h-1 bg-white/70 rounded-full mt-1.5" />
      </div>

    </div>
  );
};
