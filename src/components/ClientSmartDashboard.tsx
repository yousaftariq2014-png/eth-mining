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
  Timer,
  Menu,
  CalendarDays,
  PiggyBank,
  Crown
} from 'lucide-react';
import { UserProfile, MiningPackage, DepositRequest, WithdrawalRecordItem, PackageType } from '../types';
import { DAILY_PACKAGES, FLASH_48H_PACKAGES } from '../data/packagesData';
import { supabase } from '../lib/supabaseClient'; // <-- point this at your real Supabase client

interface ClientSmartDashboardProps {
  user: UserProfile;
  packages: MiningPackage[];
  onSelectPackage: (pkg: MiningPackage) => void;
  onOpenLiveSupport?: () => void;
}

/**
 * =============================================================================
 * WHAT CHANGED FROM THE ORIGINAL VERSION (read before wiring this up)
 * =============================================================================
 * 1. REMOVED: the setInterval() ticker that made "Total Mined" / "Exchangeable ETH"
 *    grow on their own every 2 seconds. There is no real mining happening, so
 *    nothing should auto-increment. Balances now come ONLY from the database.
 *
 * 2. REMOVED: hardcoded fake wallet/withdrawable numbers (186193.16 USDT etc).
 *    These are now fetched live from Supabase and reflect real approved
 *    deposits only.
 *
 * 3. DEPOSITS: a client's deposit only counts toward their balance once
 *    status = 'approved' in the `deposits` table, AND `explorer_confirmed = true`
 *    (meaning an admin actually checked the txid on Tronscan/Etherscan — see
 *    the verification workflow we set up). Pending/rejected deposits show as
 *    pending/rejected, never as usable balance.
 *
 * 4. "Daily Return %" and the ETH->USDT "Exchange" feature are STILL FAKE —
 *    there is no real yield-generating mechanism behind them yet. I've left
 *    them visually in place but flagged with TODOs below, because turning
 *    those into something real needs a business decision from you: where does
 *    the "return" actually come from? Until that's answered, I'd strongly
 *    recommend not shipping this part live, since promising a daily % return
 *    with nothing generating it is the same fake-yield problem we just removed
 *    from the mining counter.
 *
 * 5. ADDED: a "Current Active Package" card, shown above Account Summary.
 *    Previously `currentPkg` was computed (from the client's most recent
 *    approved + explorer-confirmed deposit) but was never actually rendered
 *    anywhere — so clients never saw which package they'd purchased. This
 *    card shows the package name, VIP level, amount paid, and approval date.
 * =============================================================================
 */

export const ClientSmartDashboard: React.FC<ClientSmartDashboardProps> = ({
  user,
  packages,
  onSelectPackage,
  onOpenLiveSupport,
}) => {
  const [activeNav, setActiveNav] = useState<'financial' | 'reward' | 'assets'>('assets');
  const [actionTab, setActionTab] = useState<'recharge' | 'exchange' | 'withdraw'>('exchange');
  const [showWithdrawalRecordView, setShowWithdrawalRecordView] = useState<boolean>(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'All' | 'Pending' | 'Withdrawal successfully' | 'Failed'>('All');
  const [dashCategory, setDashCategory] = useState<PackageType>('daily');
  const [showSideMenu, setShowSideMenu] = useState<boolean>(false);

  // Real data from Supabase — starts empty/loading, never fake-seeded
  const [loading, setLoading] = useState(true);
  const [approvedDeposits, setApprovedDeposits] = useState<DepositRequest[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecordItem[]>([]);

  const [withdrawInputUsdt, setWithdrawInputUsdt] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

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

      if (depErr) console.error('Failed to load deposits:', depErr);
      if (wErr) console.error('Failed to load withdrawals:', wErr);

      const allDeposits = deposits || [];
      // Only deposits an admin has actually verified against the blockchain count as real
      setApprovedDeposits(allDeposits.filter(d => d.status === 'approved' && d.explorer_confirmed));
      setPendingDeposits(allDeposits.filter(d => d.status === 'pending'));
      setWithdrawalRecords((withdrawals || []) as WithdrawalRecordItem[]);
      setLoading(false);
    }

    loadRealData();
    return () => { isMounted = false; };
  }, [user.id]);

  // Real wallet balance = sum of verified approved deposits, minus completed/pending withdrawals.
  // No mining, no auto-growth — only actual money that came in and went out.
  const totalDeposited = approvedDeposits.reduce((sum, d) => sum + Number(d.amountUsd ?? (d as any).amount_usd ?? 0), 0);
  const totalWithdrawn = withdrawalRecords
    .filter(w => w.status !== 'Failed')
    .reduce((sum, w) => sum + Math.abs(Number(w.amount ?? 0)), 0);
  const walletBalanceUsdt = Math.max(0, totalDeposited - totalWithdrawn);
  const withdrawableUsdt = walletBalanceUsdt; // adjust here if you introduce lock-up periods etc.

  // Client's currently active package = their most recent verified approved deposit
  const activeDeposit = approvedDeposits[0] ?? null;
  const currentVipLevel = activeDeposit?.vipLevel ?? 0;
  const currentPkg = packages.find(p => p.vipLevel === currentVipLevel) ?? null;

  const handleWithdraw = async () => {
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

    // Real insert — admin still has to manually process/send this withdrawal
    // and mark it approved once actually paid out on-chain.
    const { error } = await supabase.from('withdrawals').insert({
      id: `w-${Date.now()}`,
      user_id: user.id,
      currency: 'USDT',
      type: withdrawAddress.length === 42 ? 'USDT-ERC20' : 'USDT-TRC20',
      amount: -amountToWithdraw,
      status: 'Pending',
      time: new Date().toISOString(),
    });

    if (error) {
      showToast('Failed to submit withdrawal. Please try again.', 'info');
      console.error(error);
      return;
    }

    showToast(`Withdrawal of $${amountToWithdraw.toFixed(2)} USDT submitted! Status: Pending admin review`, 'success');
    setWithdrawInputUsdt('');
    setTimeout(() => {
      setShowSideMenu(false);
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

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-[820px] bg-[#0c121e] text-white flex items-center justify-center rounded-3xl border border-slate-800">
        <span className="text-slate-400 text-sm">Loading your account…</span>
      </div>
    );
  }

  /* =========================================================================
     VIEW: Withdrawal record
     ========================================================================= */
  if (showWithdrawalRecordView) {
    return (
      <div id="withdrawal-record-view" className="max-w-md mx-auto min-h-[750px] bg-[#0c121e] text-white flex flex-col justify-between rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <button onClick={() => setShowWithdrawalRecordView(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white font-sans">Withdrawal record</h2>
            <div className="w-5" />
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-medium">
            {(['All', 'Pending', 'Withdrawal successfully', 'Failed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setWithdrawalFilter(tab)}
                className={`pb-1.5 transition-colors cursor-pointer text-center ${
                  withdrawalFilter === tab ? 'text-[#f77f00] font-bold border-b-2 border-[#f77f00]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'Withdrawal successfully' ? 'Withdrawal succ...' : tab}
              </button>
            ))}
          </div>

          <div className="space-y-3 font-mono text-xs max-h-[540px] overflow-y-auto pr-1">
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No withdrawal records found.</div>
            ) : (
              filteredWithdrawals.map((rec) => (
                <div key={rec.id} className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-1.5">
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
                      rec.status === 'Pending' ? 'text-amber-400' : rec.status === 'Withdrawal successfully' ? 'text-emerald-400' : 'text-rose-400'
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

        <div className="bg-[#080c16] border-t border-slate-800 p-3 flex items-center justify-around text-xs font-semibold">
          <button onClick={() => { setShowWithdrawalRecordView(false); setActiveNav('financial'); }} className="text-slate-400 hover:text-white">Financial</button>
          <button onClick={() => { setShowWithdrawalRecordView(false); setActiveNav('reward'); }} className="text-slate-400 hover:text-white">Reward</button>
          <button onClick={() => setShowWithdrawalRecordView(false)} className="text-[#f77f00] font-bold">Assets</button>
        </div>
      </div>
    );
  }

  /* =========================================================================
     MAIN VIEW
     ========================================================================= */
  const displayedCategoryPackages = dashCategory === 'daily' ? DAILY_PACKAGES : FLASH_48H_PACKAGES;
  const userPendingDeposit = pendingDeposits[0];

  return (
    <div id="client-smart-dashboard-view" className="max-w-md mx-auto min-h-[820px] bg-[#0c121e] text-white flex flex-col rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative pb-16">

      {notification && (
        <div className="absolute top-3 left-4 right-4 z-50 p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      <div className="p-4 bg-gradient-to-b from-[#0e1628] to-[#0a101f] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-black tracking-wide text-amber-400 font-sans truncate">Account Dashboard</span>
        </div>
        <button onClick={() => setShowSideMenu(true)} title="More options" className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-amber-400 cursor-pointer">
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">

        {userPendingDeposit && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                <strong>Deposit ${userPendingDeposit.amountUsd ?? (userPendingDeposit as any).amount_usd} USDT</strong> is awaiting admin verification.
              </span>
            </div>
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase">Pending</span>
          </div>
        )}

        {!activeDeposit && approvedDeposits.length === 0 && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            No verified deposits yet. Once a deposit is submitted and confirmed by admin, your account details will appear here.
          </div>
        )}

        {/* Current Active Package — shows the client's own purchased package
            (name, VIP level, amount paid, approval date), sourced from their
            most recent approved + explorer-confirmed deposit. */}
        {activeDeposit && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#0f172a] to-[#0f172a] border border-amber-500/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Crown className="w-4 h-4" />
                <span>Current Active Package</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-white">
                  {activeDeposit.packageName ?? (activeDeposit as any).package_name}
                </div>
                <div className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">
                  VIP {activeDeposit.vipLevel}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Amount Paid</div>
                <div className="text-sm font-black text-white font-mono">
                  ${Number(activeDeposit.amountUsd ?? (activeDeposit as any).amount_usd ?? 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500">Network</span>
                <div className="text-slate-300">{activeDeposit.network}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Activated</span>
                <div className="text-slate-300">
                  {activeDeposit.approvedAt ?? (activeDeposit as any).approved_at ?? '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <PiggyBank className="w-4 h-4 text-amber-400" />
            <span>Account Summary</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total Deposited</span>
              <div className="text-sm font-black text-white mt-0.5">${totalDeposited.toLocaleString()}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet Balance</span>
              <div className="text-sm font-black text-white mt-0.5 truncate">${walletBalanceUsdt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Withdrawable</span>
              <div className="text-sm font-black text-white mt-0.5 truncate">${withdrawableUsdt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        {/* TODO(business decision): "Packages" below still advertise a daily %
            return with no real mechanism generating it. Don't launch this
            section until you've defined what actually produces that return. */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-400" />Packages We Offer</span>
            <div className="flex items-center gap-1 bg-[#10182c] p-0.5 rounded-xl border border-slate-800">
              <button type="button" onClick={() => setDashCategory('daily')} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${dashCategory === 'daily' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Daily</button>
              <button type="button" onClick={() => setDashCategory('flash_48h')} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${dashCategory === 'flash_48h' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}>48H Flash</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayedCategoryPackages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => onSelectPackage(pkg)}
                className="p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between bg-[#10182c] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-black text-amber-400">VIP {pkg.vipLevel}</span>
                </div>
                <div className="text-xs font-black font-mono mt-1 text-white">${pkg.priceUsd.toLocaleString()}</div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">{pkg.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onOpenLiveSupport}
        className="fixed sm:absolute bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 cursor-pointer"
        title="Live Customer Service"
      >
        <MessageCircle className="w-6 h-6 fill-white text-white" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 bg-[#080c16] border-t border-slate-800 p-2 flex flex-col items-center">
        <div className="flex items-center justify-around w-full text-xs font-semibold">
          <button onClick={() => setActiveNav('financial')} className={`flex-1 py-1.5 text-center cursor-pointer ${activeNav === 'financial' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}>Financial</button>
          <button onClick={() => setActiveNav('reward')} className={`flex-1 py-1.5 text-center cursor-pointer ${activeNav === 'reward' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}>Reward</button>
          <button onClick={() => setActiveNav('assets')} className={`flex-1 py-1.5 text-center cursor-pointer ${activeNav === 'assets' ? 'text-[#f77f00] font-bold' : 'text-slate-500 hover:text-slate-300'}`}>Assets</button>
        </div>
        <div className="w-28 h-1 bg-white/70 rounded-full mt-1.5" />
      </div>

      {showSideMenu && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSideMenu(false)} />
          <div className="relative w-[85%] max-w-sm h-full bg-[#0c121e] border-l border-slate-800 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 p-4 bg-[#0e1628]/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-black text-white">Wallet</h2>
              <button onClick={() => setShowSideMenu(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setActionTab('recharge'); }} className={`py-2 px-3 rounded-full text-xs font-bold text-center cursor-pointer border ${actionTab === 'recharge' ? 'bg-[#f77f00] text-white border-transparent' : 'bg-white text-slate-800 border-slate-200'}`}>Recharge</button>
                <button onClick={() => setActionTab('withdraw')} className={`py-2 px-3 rounded-full text-xs font-bold text-center cursor-pointer border ${actionTab === 'withdraw' ? 'bg-[#f77f00] text-white border-transparent' : 'bg-white text-slate-800 border-slate-200'}`}>Withdraw</button>
              </div>

              {actionTab === 'withdraw' && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#0f172a] border border-slate-800">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-rose-400 text-sm">▎</span><span>USDT Withdrawal</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-mono">Destination Address (USDT-TRC20 / ERC20):</label>
                    <input type="text" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} className="w-full bg-[#080c16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Amount:</span><span>Available: ${withdrawableUsdt.toFixed(2)} USDT</span>
                    </div>
                    <input type="number" value={withdrawInputUsdt} onChange={(e) => setWithdrawInputUsdt(e.target.value)} className="w-full bg-[#080c16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 font-bold" />
                  </div>
                  <button onClick={handleWithdraw} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20">Submit Withdrawal Request</button>
                  <button onClick={() => { setShowSideMenu(false); setShowWithdrawalRecordView(true); }} className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer">View Withdrawal History</button>
                </div>
              )}

              {actionTab === 'recharge' && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#0f172a] border border-slate-800 text-center">
                  <div className="text-xs font-bold text-white">Recharge / Deposit</div>
                  <p className="text-[11px] text-slate-400">Pick a package below to deposit. Your balance updates only after admin verifies your transaction on-chain.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
