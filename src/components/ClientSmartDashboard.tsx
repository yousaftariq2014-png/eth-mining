import React, { useState, useEffect } from 'react';
import {
  Zap,
  Wallet,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  X,
  Layers,
  DollarSign,
  MessageCircle,
  RefreshCw,
  CalendarDays,
  PiggyBank,
  Crown,
  Activity,
  Hourglass,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Flame,
  AlertCircle
} from 'lucide-react';
import { UserProfile, MiningPackage, DepositRequest, WithdrawalRecordItem, PackageType } from '../types';
import { DAILY_PACKAGES, FLASH_48H_PACKAGES, MINING_PACKAGES } from '../data/packagesData';
import { supabase } from '../lib/supabaseClient';

interface ClientSmartDashboardProps {
  user: UserProfile;
  packages: MiningPackage[];
  onSelectPackage: (pkg: MiningPackage) => void;
  onOpenLiveSupport?: () => void;
  pendingDeposits?: DepositRequest[];
}

interface ProcessedContract {
  deposit: DepositRequest;
  pkg: MiningPackage | null;
  activationDate: Date;
  expirationDate: Date;
  isExpired: boolean;
  timeRemainingMs: number;
  timeRemainingText: string;
  progressPercent: number;
  durationLabel: string;
  isFlash: boolean;
  estTotalYieldUsd: number;
  dailyYieldUsd: number;
  accruedYieldUsd: number;
  durationMs: number;
}

function parseTimestamp(ts?: string): Date {
  if (!ts) return new Date();
  const normalized = ts.includes(' ') && !ts.includes('T') ? ts.replace(' ', 'T') : ts;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    return new Date();
  }
  return d;
}

function getContractDurationMs(dep: DepositRequest, matchedPkg: MiningPackage | null): { durationMs: number; durationLabel: string; isFlash: boolean } {
  const isFlash = 
    dep.planType === 'flash_48h' ||
    matchedPkg?.planType === 'flash_48h' ||
    matchedPkg?.durationHours === 48 ||
    (dep.packageName && dep.packageName.toLowerCase().includes('48h')) ||
    (dep.packageName && dep.packageName.toLowerCase().includes('flash'));

  if (isFlash) {
    return {
      durationMs: 48 * 60 * 60 * 1000,
      durationLabel: '48 Hours Flash Contract',
      isFlash: true
    };
  }

  const days = matchedPkg?.durationDays || 365;
  return {
    durationMs: days * 24 * 60 * 60 * 1000,
    durationLabel: `${days} Days Daily Variable Mining`,
    isFlash: false
  };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00h 00m 00s (Expired)';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

function formatDateTimeDisplay(date: Date): string {
  try {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return date.toISOString();
  }
}

export const ClientSmartDashboard: React.FC<ClientSmartDashboardProps> = ({
  user,
  packages,
  onSelectPackage,
  onOpenLiveSupport,
  pendingDeposits: externalPendingDeposits
}) => {
  const [actionTab, setActionTab] = useState<'withdraw' | 'recharge' | 'history'>('withdraw');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState<boolean>(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'All' | 'Pending' | 'Withdrawal successfully' | 'Failed'>('All');
  const [dashCategory, setDashCategory] = useState<PackageType>('daily');

  // Real data from Supabase + localStorage
  const [loading, setLoading] = useState(true);
  const [approvedDeposits, setApprovedDeposits] = useState<DepositRequest[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecordItem[]>([]);

  const [withdrawInputUsdt, setWithdrawInputUsdt] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);

  // Live timer state that ticks every second for real-time countdown & automatic expiration
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch this client's real deposits + withdrawals from Supabase on load
  useEffect(() => {
    let isMounted = true;

    async function loadRealData() {
      setLoading(true);

      const { data: deposits, error: depErr } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: withdrawals, error: wErr } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('inserted_at', { ascending: false });

      if (!isMounted) return;

      if (depErr) console.warn('Failed to load deposits from Supabase:', depErr.message);
      if (wErr) console.warn('Failed to load withdrawals from Supabase:', wErr.message);

      let allDeposits = deposits || [];

      // Fallback/merge with local storage deposits if available
      if (allDeposits.length === 0) {
        try {
          const saved = localStorage.getItem('hashforge_deposits');
          if (saved) {
            const parsed = JSON.parse(saved);
            allDeposits = parsed.filter((d: any) => d.userId === user.id || d.userName === user.name);
          }
        } catch {}
      }

      // Merge any externally passed pendingDeposits
      if (externalPendingDeposits && externalPendingDeposits.length > 0) {
        const userExternal = externalPendingDeposits.filter(d => d.userId === user.id || d.userName === user.name);
        for (const ext of userExternal) {
          if (!allDeposits.some((d: any) => d.id === ext.id)) {
            allDeposits.push(ext);
          }
        }
      }

      setApprovedDeposits(allDeposits.filter(d => d.status === 'approved' && (d.explorer_confirmed ?? true)));
      setPendingDeposits(allDeposits.filter(d => d.status === 'pending'));
      setWithdrawalRecords((withdrawals || []) as WithdrawalRecordItem[]);
      setLoading(false);
    }

    loadRealData();
    return () => { isMounted = false; };
  }, [user.id, user.name, externalPendingDeposits]);

  // Process all approved deposits with real-time countdown, accrual and expiration calculations
  const processedContracts: ProcessedContract[] = approvedDeposits.map(dep => {
    const matchedPkg = packages.find(p => p.id === dep.packageId) 
      || packages.find(p => p.name.toLowerCase() === (dep.packageName || '').toLowerCase())
      || packages.find(p => p.vipLevel === dep.vipLevel && p.priceUsd === Number(dep.amountUsd))
      || MINING_PACKAGES.find(p => p.vipLevel === dep.vipLevel)
      || null;

    const { durationMs, durationLabel, isFlash } = getContractDurationMs(dep, matchedPkg);
    const rawActivation = dep.approvedAt || (dep as any).approved_at || dep.createdAt || (dep as any).created_at;
    const activationDate = parseTimestamp(rawActivation);
    const expirationDate = new Date(activationDate.getTime() + durationMs);
    
    const timeRemainingMs = Math.max(0, expirationDate.getTime() - currentTime.getTime());
    const isExpired = timeRemainingMs <= 0;
    const timeRemainingText = formatCountdown(timeRemainingMs);

    const totalElapsedMs = Math.max(0, currentTime.getTime() - activationDate.getTime());
    const progressPercent = Math.min(100, Math.max(0, (totalElapsedMs / durationMs) * 100));

    const amountUsd = Number(dep.amountUsd ?? (dep as any).amount_usd ?? 0);
    const estTotalYieldUsd = isFlash 
      ? (matchedPkg?.totalPayoutUsd || (amountUsd * (1 + (matchedPkg?.profitPercent || 10) / 100)))
      : (matchedPkg?.dailyReturnUsd ? matchedPkg.dailyReturnUsd * (matchedPkg.durationDays || 365) : amountUsd * 2.5);

    const dailyYieldUsd = isFlash
      ? (matchedPkg?.dailyReturnUsd || (amountUsd * 0.05))
      : (matchedPkg?.dailyReturnUsd || (amountUsd * (matchedPkg?.dailyReturnPercent || 2.5) / 100));

    // Yield accrual rule:
    // - For 48h Flash packages: When expired, total payout (Principal + 10% profit) is unlocked. While running, only the accrued portion of profit is produced.
    // - For Daily 365d packages: Daily return is unlocked progressively based on elapsed days.
    let accruedYieldUsd = 0;
    if (isFlash) {
      if (isExpired) {
        // Expired 48h node unlocks total return (principal + full profit)
        accruedYieldUsd = estTotalYieldUsd;
      } else {
        // Running 48h node produces daily mining profit (5% per 24h)
        const elapsedDays = totalElapsedMs / (24 * 60 * 60 * 1000);
        const flashProfitOnly = estTotalYieldUsd - amountUsd;
        accruedYieldUsd = Math.min(flashProfitOnly, (flashProfitOnly / 2) * elapsedDays);
      }
    } else {
      // Daily mining: produces daily yield continuously
      const elapsedDays = Math.min(matchedPkg?.durationDays || 365, totalElapsedMs / (24 * 60 * 60 * 1000));
      accruedYieldUsd = dailyYieldUsd * elapsedDays;
      if (isExpired) {
        // Upon 365d expiration, full cycle return is completely unlocked
        accruedYieldUsd = estTotalYieldUsd;
      }
    }

    return {
      deposit: dep,
      pkg: matchedPkg,
      activationDate,
      expirationDate,
      isExpired,
      timeRemainingMs,
      timeRemainingText,
      progressPercent,
      durationLabel,
      isFlash,
      estTotalYieldUsd,
      dailyYieldUsd,
      accruedYieldUsd,
      durationMs
    };
  });

  const activeContracts = processedContracts.filter(c => !c.isExpired);
  const expiredContracts = processedContracts.filter(c => c.isExpired);

  // REAL FINANCIAL VALUES:
  // 1. Total Active Capital = principal in running mining nodes
  const totalActiveCapital = activeContracts.reduce((sum, c) => sum + Number(c.deposit.amountUsd ?? (c.deposit as any).amount_usd ?? 0), 0);
  
  // 2. Total Earned Mined Profit (Daily returns produced + Expired 48h Total Returns)
  const totalEarnedProfits = processedContracts.reduce((sum, c) => sum + c.accruedYieldUsd, 0);

  // 3. Today's Daily Mining Production (sum of daily yields from active contracts)
  const todayDailyReturnUsd = activeContracts.reduce((sum, c) => sum + c.dailyYieldUsd, 0);

  // 4. Settled from Expired Contracts (Principal + Profit)
  const totalSettledFromExpired = expiredContracts.reduce((sum, c) => sum + c.estTotalYieldUsd, 0);

  // 5. Total Withdrawn by user
  const totalWithdrawn = withdrawalRecords
    .filter(w => w.status !== 'Failed')
    .reduce((sum, w) => sum + Math.abs(Number(w.amount)), 0);

  // 6. Withdrawable Balance = Earned Profit + Expired Node Return - Total Withdrawn
  const withdrawableUsdt = Math.max(0, totalEarnedProfits - totalWithdrawn);
  const walletBalanceUsdt = withdrawableUsdt;

  const handleCopyTxid = (txid: string, id: string) => {
    navigator.clipboard.writeText(txid);
    setCopiedTxid(id);
    setTimeout(() => setCopiedTxid(null), 2000);
  };

  const handleWithdraw = async () => {
    const amountToWithdraw = parseFloat(withdrawInputUsdt);
    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
      showToast('Please enter a valid withdrawal amount', 'info');
      return;
    }
    if (amountToWithdraw > withdrawableUsdt) {
      showToast(`Withdrawal amount exceeds your withdrawable profit balance ($${withdrawableUsdt.toFixed(2)} USDT)`, 'info');
      return;
    }
    if (!withdrawAddress.trim()) {
      showToast('Please enter destination USDT address', 'info');
      return;
    }

    const newRecord: WithdrawalRecordItem = {
      id: `w-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      currency: 'USDT',
      type: withdrawAddress.length === 42 ? 'USDT-ERC20' : 'USDT-TRC20',
      amount: -amountToWithdraw,
      walletAddress: withdrawAddress.trim(),
      status: 'Pending',
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    // Real Supabase insert
    const { error } = await supabase.from('withdrawals').insert({
      id: newRecord.id,
      user_id: user.id,
      user_name: user.name,
      currency: newRecord.currency,
      type: newRecord.type,
      amount: newRecord.amount,
      wallet_address: newRecord.walletAddress,
      status: newRecord.status,
      time: newRecord.time,
    });

    if (error) {
      console.warn('Supabase withdrawal warning:', error.message);
    }

    setWithdrawalRecords(prev => [newRecord, ...prev]);
    showToast(`Withdrawal of $${amountToWithdraw.toFixed(2)} USDT submitted! Status: Pending admin review`, 'success');
    setWithdrawInputUsdt('');
    setActionTab('history');
  };

  const showToast = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredWithdrawals = withdrawalRecords.filter(r => {
    if (withdrawalFilter === 'All') return true;
    return r.status === withdrawalFilter;
  });

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <span className="text-slate-400 text-sm font-mono flex items-center gap-2.5 bg-[#0e1628] px-6 py-4 rounded-2xl border border-slate-800 shadow-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          Loading Live Mining Dashboard…
        </span>
      </div>
    );
  }

  const displayedCategoryPackages = dashCategory === 'daily' ? DAILY_PACKAGES : FLASH_48H_PACKAGES;
  const userPendingDeposit = pendingDeposits[0];

  return (
    <div id="client-smart-dashboard-full" className="w-full space-y-6">

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow-2xl flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* =========================================================================
          TOP STATS & WELCOME HERO BANNER (FULL WIDTH RESPONSIVE)
          ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0c1424] via-[#0f1b33] to-[#0c1424] border border-slate-800/90 p-5 sm:p-6 lg:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          
          {/* User Welcome & Status */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Client Mining Dashboard
              </h1>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                {user.plan || `VIP ${user.vipLevel || 1}`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
              <span>Account: <strong className="text-slate-200">{user.name}</strong> ({user.email})</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Node Production
              </span>
            </p>
          </div>

          {/* Quick Metrics Bar — Showing Real Daily Returns and Withdrawable Profit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Withdrawable Profit
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-1">
                ${withdrawableUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Daily Return Rate
              </span>
              <div className="text-base sm:text-lg font-black text-amber-400 font-mono mt-1">
                ${todayDailyReturnUsd.toFixed(2)} <span className="text-xs font-normal text-slate-400">/day</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-cyan-400" /> Active Nodes
              </span>
              <div className="text-base sm:text-lg font-black text-cyan-400 font-mono mt-1">
                {activeContracts.length} <span className="text-xs font-normal text-slate-400">(${totalActiveCapital})</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Settled Contracts
              </span>
              <div className="text-base sm:text-lg font-black text-slate-300 font-mono mt-1">
                {expiredContracts.length} <span className="text-xs font-normal text-slate-400">(${totalSettledFromExpired.toFixed(0)})</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Pending Deposit Notification Banner */}
      {userPendingDeposit && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl shadow-amber-500/5">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-300">
            <Clock className="w-5 h-5 shrink-0 animate-pulse text-amber-400" />
            <div>
              <strong>Deposit of ${userPendingDeposit.amountUsd ?? (userPendingDeposit as any).amount_usd} USDT</strong> ({userPendingDeposit.packageName}) is awaiting on-chain verification by the administrator.
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase self-start sm:self-auto border border-amber-500/30">
            Pending Admin Review
          </span>
        </div>
      )}

      {/* =========================================================================
          MAIN RESPONSIVE 2-COLUMN GRID (LEFT: ACTIVE PACKAGES, RIGHT: SUMMARY & WALLET)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIVE PURCHASED PACKAGES (LG:COL-SPAN-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black text-white">
                Active Purchased Packages ({activeContracts.length})
              </h2>
            </div>
            {activeContracts.length > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Hashing
              </span>
            )}
          </div>

          {/* If No Active Contracts */}
          {activeContracts.length === 0 && (
            <div className="p-8 rounded-3xl bg-[#0b101c] border border-slate-800/80 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Active Mining Package Running</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Activate a mining contract from the packages below to initiate automated stratum computing power and daily USDT returns.
                </p>
              </div>
              <button
                onClick={() => onSelectPackage(packages[0] || DAILY_PACKAGES[0])}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Browse & Activate Packages
              </button>
            </div>
          )}

          {/* List of Active Contracts with Full Information & Live Countdown */}
          {activeContracts.map((contract) => {
            const dep = contract.deposit;
            const pkg = contract.pkg;
            const amountPaid = Number(dep.amountUsd ?? (dep as any).amount_usd ?? 0);
            const packageName = dep.packageName ?? (dep as any).package_name ?? pkg?.name ?? `VIP ${dep.vipLevel} Package`;

            return (
              <div 
                key={dep.id} 
                className="rounded-3xl bg-gradient-to-br from-[#0e1628] via-[#0b101e] to-[#0c1424] border border-amber-500/35 p-5 sm:p-6 space-y-5 shadow-2xl shadow-amber-500/5 relative overflow-hidden"
              >
                {/* Decorative Amber Glow */}
                <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg sm:text-xl font-black text-white">
                        {packageName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                        VIP {dep.vipLevel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>{contract.durationLabel}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-slate-950/60 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono uppercase">Principal Invested</div>
                    <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                      ${amountPaid.toLocaleString()} USDT
                    </div>
                  </div>
                </div>

                {/* REAL-TIME EXPIRATION COUNTDOWN TIMER BANNER */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-3 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-amber-300 font-bold flex items-center gap-2 font-mono text-xs sm:text-sm">
                      <Hourglass className="w-4 h-4 text-amber-400 animate-spin" />
                      Time Left to Expire:
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm sm:text-base bg-amber-500/15 px-3 py-1 rounded-xl border border-amber-500/30 text-center">
                      {contract.timeRemainingText}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${contract.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>{contract.progressPercent.toFixed(1)}% Cycle Completed</span>
                      <span>{(100 - contract.progressPercent).toFixed(1)}% Duration Remaining</span>
                    </div>
                  </div>
                </div>

                {/* TIMESTAMPS: ACTIVATED & EXPIRES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#080d18] border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Activated On (Approved):</span>
                      <span className="text-slate-200 font-bold">{formatDateTimeDisplay(contract.activationDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:justify-end">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Expires On (Maturation):</span>
                      <span className="text-slate-200 font-bold">{formatDateTimeDisplay(contract.expirationDate)}</span>
                    </div>
                  </div>
                </div>

                {/* DETAILED SPECIFICATIONS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Hashrate</span>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">
                      {pkg?.hashrate ? `${pkg.hashrate} ${pkg.hashrateUnit}` : 'Stratum Pro'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Return Rate</span>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">
                      {contract.isFlash ? '10% in 48 Hours' : (pkg?.profitRangeText || `${pkg?.dailyReturnPercent || 2.5}% Daily`)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Daily Yield</span>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">
                      ${contract.dailyYieldUsd.toFixed(2)} USDT
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Total Maturation Return</span>
                    <div className="text-xs font-bold text-amber-300 mt-0.5 truncate">
                      ${contract.estTotalYieldUsd.toFixed(2)} USDT
                    </div>
                  </div>
                </div>

                {/* Transaction TXID */}
                {dep.senderTxid && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 block">Deposit Transaction Hash (TXID):</span>
                      <span className="text-slate-300 truncate block text-[11px]">{dep.senderTxid}</span>
                    </div>
                    <button
                      onClick={() => handleCopyTxid(dep.senderTxid, `tx-${dep.id}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white shrink-0 cursor-pointer flex items-center gap-1.5 text-xs transition-colors"
                      title="Copy TXID"
                    >
                      {copiedTxid === `tx-${dep.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTxid === `tx-${dep.id}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* RIGHT COLUMN: ACCOUNT SUMMARY & WALLET OPERATIONS & EXPIRED CONTRACTS (LG:COL-SPAN-5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* ACCOUNT SUMMARY CARD — DISPLAYING ACCURATE MINING RETURN / EXPIRATION PROFITS */}
          <div className="rounded-3xl bg-[#0b101c] border border-slate-800/90 p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-black text-white">Account Summary</h2>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono">
                <span className="text-emerald-400 font-bold">{activeContracts.length} Active</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400 font-bold">{expiredContracts.length} Expired</span>
              </div>
            </div>

            {/* Financial Overview Tiles: Real Daily Mined Profit + Available Withdrawable */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Daily Mining Yield</span>
                <div className="text-base sm:text-lg font-black text-amber-400 mt-1">
                  ${todayDailyReturnUsd.toFixed(2)} <span className="text-xs font-normal text-slate-400">/day</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Active Mining Capital</span>
                <div className="text-base sm:text-lg font-black text-cyan-400 mt-1 truncate">
                  ${totalActiveCapital.toLocaleString()} USDT
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Available Withdrawable Profit</span>
                  <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
                    ${withdrawableUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    (Mined returns + 48h expired payouts available to withdraw)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActionTab('withdraw')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      actionTab === 'withdraw' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Withdraw
                  </button>
                  <button
                    onClick={() => setActionTab('history')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      actionTab === 'history' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    History
                  </button>
                </div>
              </div>
            </div>

            {/* WITHDRAWAL FORM */}
            {actionTab === 'withdraw' && (
              <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    <span>Instant USDT Profit Withdrawal</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Max: ${withdrawableUsdt.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-mono">Destination Address (USDT TRC20 / ERC20):</label>
                  <input
                    type="text"
                    placeholder="e.g. TQn9Y2... or 0x742d..."
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-mono">Amount to Withdraw (USDT):</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={withdrawInputUsdt}
                      onChange={(e) => setWithdrawInputUsdt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setWithdrawInputUsdt(withdrawableUsdt.toString())}
                      className="absolute right-2 top-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Submit Withdrawal for Admin Approval
                </button>
              </div>
            )}

            {/* WITHDRAWAL HISTORY */}
            {actionTab === 'history' && (
              <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Your Withdrawal History ({withdrawalRecords.length})</span>
                  <button
                    onClick={() => setActionTab('withdraw')}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    + New Withdrawal
                  </button>
                </div>

                {withdrawalRecords.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500 font-mono">No withdrawal requests submitted yet.</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {withdrawalRecords.map((w) => (
                      <div key={w.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-rose-400 font-bold">{w.amount} USDT</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            w.status === 'Withdrawal successfully'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : w.status === 'Failed'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {w.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate max-w-[150px]">{w.walletAddress || w.type}</span>
                          <span>{w.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EXPIRED & COMPLETED CONTRACTS SECTION */}
          {expiredContracts.length > 0 && (
            <div className="rounded-3xl bg-[#0b101c] border border-slate-800/90 p-5 sm:p-6 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Expired / Completed Contracts ({expiredContracts.length})
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Full Yield Settled & Withdrawable
                </span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {expiredContracts.map((expContract) => {
                  const dep = expContract.deposit;
                  const pkg = expContract.pkg;
                  const packageName = dep.packageName ?? (dep as any).package_name ?? pkg?.name ?? `VIP ${dep.vipLevel} Package`;
                  const amount = Number(dep.amountUsd ?? (dep as any).amount_usd ?? 0);

                  return (
                    <div 
                      key={dep.id} 
                      className="p-3 rounded-2xl bg-[#080d18] border border-slate-800 text-xs font-mono space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{packageName}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700 font-mono">
                            VIP {dep.vipLevel}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Cycle Completed (${expContract.estTotalYieldUsd.toFixed(2)} USDT)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                        <div>
                          <span>Invested: </span>
                          <strong className="text-white">${amount.toLocaleString()} USDT</strong>
                        </div>
                        <div className="text-right">
                          <span>Settled to Wallet: </span>
                          <strong className="text-emerald-400">${expContract.estTotalYieldUsd.toFixed(2)} USDT</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                        <span>Activated: {formatDateTimeDisplay(expContract.activationDate).split(',')[0]}</span>
                        <span>Matured: {formatDateTimeDisplay(expContract.expirationDate).split(',')[0]}</span>
                      </div>

                      {pkg && (
                        <button
                          onClick={() => onSelectPackage(pkg)}
                          className="w-full mt-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Renew / Re-purchase Package</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* =========================================================================
          BOTTOM SECTION: PACKAGES OFFERING & UPGRADES (FULL WIDTH GRID)
          ========================================================================= */}
      <div className="rounded-3xl bg-[#0b101c] border border-slate-800/90 p-5 sm:p-6 lg:p-7 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Available Mining Packages & Upgrades
              </h2>
              <p className="text-xs text-slate-400">
                Choose a plan to deploy cloud mining nodes or upgrade your existing capacity
              </p>
            </div>
          </div>

          {/* Plan Category Switcher */}
          <div className="flex items-center gap-1 bg-[#10182c] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDashCategory('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashCategory === 'daily' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Mining (VIP 1 - 5)
            </button>
            <button
              type="button"
              onClick={() => setDashCategory('flash_48h')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashCategory === 'flash_48h' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              48H Flash Node
            </button>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {displayedCategoryPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#090d18] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 font-mono">VIP {pkg.vipLevel}</span>
                {pkg.planType === 'flash_48h' ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">48H Flash</span>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">365 Days</span>
                )}
              </div>

              <div>
                <div className="text-lg font-black text-white font-mono">${pkg.priceUsd.toLocaleString()} <span className="text-xs text-slate-400 font-normal">USDT</span></div>
                <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{pkg.name}</div>
                <div className="text-[11px] text-emerald-400 font-mono font-bold mt-1">
                  {pkg.profitRangeText || `${pkg.dailyReturnPercent}% Daily`}
                </div>
              </div>

              <button
                onClick={() => onSelectPackage(pkg)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Deposit & Start</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Live Support button */}
      <button
        onClick={onOpenLiveSupport}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 cursor-pointer transition-transform hover:scale-105"
        title="Live Customer Service"
      >
        <MessageCircle className="w-7 h-7 fill-white text-white" />
      </button>

    </div>
  );
};
