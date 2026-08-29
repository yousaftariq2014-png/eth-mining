import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Search,
  Filter,
  Zap,
  RefreshCw,
  LogOut,
  Layers,
  ChevronRight,
  Sparkles,
  Wallet,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Cpu,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Flame,
  FileSpreadsheet,
  Activity,
  UserCheck
} from 'lucide-react';
import { UserProfile, DepositRequest, MiningPackage, WithdrawalRecordItem } from '../types';
import { 
  supabase, 
  fetchSupabaseUsers, 
  fetchSupabaseDeposits,
  fetchSupabaseWithdrawals,
  purgeAllTestData 
} from '../lib/supabaseClient';
import { 
  calculateCustomerAggregation, 
  AggregatedCustomerData 
} from '../utils/adminCustomerMetrics';
import { CustomerDetailModal } from './CustomerDetailModal';

export const MASTER_ADMIN_EMAIL = 'yousaftariq2014@gmail.com';

interface AdminPortalProps {
  onBackToClientApp: () => void;
  deposits: DepositRequest[];
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string) => void;
  registeredUsers: UserProfile[];
  packages: MiningPackage[];
  withdrawalRecords: WithdrawalRecordItem[];
  onApproveWithdrawal?: (withdrawalId: string) => void;
  onRejectWithdrawal?: (withdrawalId: string) => void;
  onPurgeAllData?: () => void;
  onDeleteClient?: (userId: string, email: string) => void;
  onRefreshData?: () => Promise<void> | void;
  onUpdateUser?: (user: UserProfile) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onBackToClientApp,
  deposits,
  onApproveDeposit,
  onRejectDeposit,
  registeredUsers,
  packages,
  withdrawalRecords,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onPurgeAllData,
  onDeleteClient,
  onRefreshData,
  onUpdateUser,
}) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      const activeAdmin = sessionStorage.getItem('hashforge_admin_auth');
      return activeAdmin === MASTER_ADMIN_EMAIL.toLowerCase();
    } catch {
      return false;
    }
  });
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'clients' | 'deposits' | 'withdrawals'>('clients');
  const [clientFilter, setClientFilter] = useState<'all' | 'active_miners' | 'pending_deposits' | 'pending_withdrawals' | 'inactive'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'failed'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Selected customer for 360° Inspector Modal
  const [inspectedCustomer, setInspectedCustomer] = useState<AggregatedCustomerData | null>(null);

  // Purge Confirmation Modal
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgeSuccessMsg, setPurgeSuccessMsg] = useState<string>('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Perform full system reset
  const handleExecutePurge = async () => {
    setIsPurging(true);
    try {
      await purgeAllTestData();
      if (onPurgeAllData) {
        onPurgeAllData();
      }
      setPurgeSuccessMsg('All test data, clients, deposits, and packages have been wiped. System is at clean zero state.');
      setTimeout(() => {
        setShowPurgeConfirm(false);
        setPurgeSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      alert('Error during reset: ' + (err?.message || 'Failed'));
    } finally {
      setIsPurging(false);
    }
  };

  // Check admin session on mount
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
          setIsAdminLoggedIn(true);
          sessionStorage.setItem('hashforge_admin_auth', MASTER_ADMIN_EMAIL.toLowerCase());
        }
      } catch (err) {
        console.warn('Session check fallback:', err);
      }
      setCheckingSession(false);
    }
    checkExistingSession();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    const normalizedEmail = adminEmail.trim().toLowerCase();

    // STRICT MASTER ADMIN LOCK - No original email exposed
    if (normalizedEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
      setLoginError('Access Denied: Invalid administrator credentials or unauthorized account.');
      setIsSubmittingLogin(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: adminPassword,
      });

      if (!error && data.user && data.user.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('hashforge_admin_auth', MASTER_ADMIN_EMAIL.toLowerCase());
        setIsSubmittingLogin(false);
        return;
      }

      setLoginError('Access Denied: Invalid administrator password or credentials.');
    } catch (err: any) {
      setLoginError('Access Denied: Invalid administrator credentials.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    sessionStorage.removeItem('hashforge_admin_auth');
    setIsAdminLoggedIn(false);
  };

  // Synchronize and aggregate customer data with real-time financial accuracy
  const aggregatedCustomers = useMemo(() => {
    return calculateCustomerAggregation(
      registeredUsers,
      deposits,
      withdrawalRecords,
      packages
    );
  }, [registeredUsers, deposits, withdrawalRecords, packages]);

  // Keep inspected customer synchronized if open
  useEffect(() => {
    if (inspectedCustomer) {
      const updated = aggregatedCustomers.find(c => c.user.id === inspectedCustomer.user.id || c.user.email === inspectedCustomer.user.email);
      if (updated) {
        setInspectedCustomer(updated);
      }
    }
  }, [aggregatedCustomers]);

  // Global Platform Metrics
  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const approvedDeposits = deposits.filter((d) => d.status === 'approved');
  const totalDepositVolume = approvedDeposits.reduce((acc, curr) => acc + Number(curr.amountUsd || 0), 0);
  const pendingDepositVolume = pendingDeposits.reduce((acc, curr) => acc + Number(curr.amountUsd || 0), 0);

  const pendingWithdrawals = withdrawalRecords.filter(w => w.status === 'Pending');
  const approvedWithdrawals = withdrawalRecords.filter(w => w.status === 'Withdrawal successfully');
  const totalWithdrawnVolume = approvedWithdrawals.reduce((acc, curr) => acc + Math.abs(Number(curr.amount || 0)), 0);
  const pendingWithdrawalVolume = pendingWithdrawals.reduce((acc, curr) => acc + Math.abs(Number(curr.amount || 0)), 0);

  const totalPlatformHashrate = aggregatedCustomers.reduce((acc, c) => acc + c.totalHashrate, 0);
  const activeMinersCount = aggregatedCustomers.filter(c => c.activeContracts.length > 0).length;

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return aggregatedCustomers.filter(c => {
      // Filter tab
      if (clientFilter === 'active_miners' && c.activeContracts.length === 0) return false;
      if (clientFilter === 'pending_deposits' && c.pendingDeposits.length === 0) return false;
      if (clientFilter === 'pending_withdrawals' && c.pendingWithdrawals.length === 0) return false;
      if (clientFilter === 'inactive' && c.activeContracts.length > 0) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.user.name?.toLowerCase().includes(q) ||
        c.user.email?.toLowerCase().includes(q) ||
        c.user.id?.toLowerCase().includes(q) ||
        c.primaryWalletAddress.toLowerCase().includes(q) ||
        c.lastDepositTxid.toLowerCase().includes(q) ||
        c.user.plan?.toLowerCase().includes(q)
      );
    });
  }, [aggregatedCustomers, clientFilter, searchQuery]);

  // Filtered Deposits
  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      const matchesFilter = depositFilter === 'all' ? true : d.status === depositFilter;
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.userName?.toLowerCase().includes(q) ||
        d.packageName?.toLowerCase().includes(q) ||
        d.senderTxid?.toLowerCase().includes(q) ||
        d.depositAddress?.toLowerCase().includes(q) ||
        d.network?.toLowerCase().includes(q)
      );
    });
  }, [deposits, depositFilter, searchQuery]);

  // Filtered Withdrawals
  const filteredWithdrawals = useMemo(() => {
    return withdrawalRecords.filter((w) => {
      const matchesFilter = 
        withdrawalFilter === 'all' ? true :
        withdrawalFilter === 'pending' ? w.status === 'Pending' :
        withdrawalFilter === 'approved' ? w.status === 'Withdrawal successfully' :
        w.status === 'Failed';
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        w.currency?.toLowerCase().includes(q) ||
        w.type?.toLowerCase().includes(q) ||
        w.userName?.toLowerCase().includes(q) ||
        w.walletAddress?.toLowerCase().includes(q)
      );
    });
  }, [withdrawalRecords, withdrawalFilter, searchQuery]);

  // Cloud Sync Handler
  const handleTriggerSync = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      setSyncToast('Live Cloud Sync Completed! All tables up-to-date.');
      setTimeout(() => setSyncToast(''), 3000);
    } catch (err: any) {
      alert('Sync error: ' + (err?.message || 'Failed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'VIP Level', 'Status', 'Total Deposited (USD)', 'Active Hashrate (TH/s)', 'Total Profit (USD)', 'Total Withdrawn (USD)', 'Net Balance (USD)', 'Joined Date'];
    const rows = aggregatedCustomers.map(c => [
      `"${c.user.id}"`,
      `"${c.user.name}"`,
      `"${c.user.email}"`,
      `"VIP ${c.computedVipLevel}"`,
      `"${c.accountStatus}"`,
      c.totalDepositedUsd.toFixed(2),
      c.totalHashrate,
      c.totalAccruedProfitsUsd.toFixed(2),
      c.totalWithdrawnUsd.toFixed(2),
      c.estimatedAvailableBalanceUsd.toFixed(2),
      `"${c.user.joinedDate}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HashForge_Clients_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (checkingSession) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
        <span>Authenticating master administrative session…</span>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 1: ADMIN LOGIN SCREEN
  // ----------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-[#0d1424] border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Administrator Portal</h1>
          <p className="text-xs text-slate-400">
            High-security management dashboard for client portfolio tracking, smart production approvals, and treasury operations.
          </p>
        </div>

        {loginError && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Administrator Email / Identifier</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="admin@system.domain"
              className="w-full bg-[#131d33] border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Master Key / Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full bg-[#131d33] border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingLogin}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-60"
          >
            {isSubmittingLogin ? 'Authenticating…' : 'Access Executive Console'}
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={onBackToClientApp}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Client Website</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: PROFESSIONAL ADMIN DASHBOARD
  // ----------------------------------------------------
  return (
    <div id="admin-management-portal" className="space-y-6 animate-in fade-in duration-300">

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-2xl bg-emerald-500/90 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Administrative Header */}
      <div className="rounded-3xl bg-[#0b101c] border border-slate-800 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl shrink-0 shadow-lg shadow-amber-500/10">
            👑
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Executive Admin Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Master Admin Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time customer 360° analytics, automated production yields, blockchain deposits, and non-custodial payouts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Live Sync Button */}
          <button
            onClick={handleTriggerSync}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-[#121c33] border border-slate-700 hover:border-amber-500/60 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md disabled:opacity-50"
            title="Fetch real-time data directly from Supabase Cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Cloud Database'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#121c33] border border-slate-700 hover:border-emerald-500/60 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            title="Download full client accounting spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Reset All */}
          <button
            onClick={() => setShowPurgeConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-rose-500/5"
            title="Clean wipe all test data"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Reset System</span>
          </button>

          {/* Return to App */}
          <button
            onClick={onBackToClientApp}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Client View</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleAdminLogout}
            className="p-2 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-950/60 font-bold text-xs cursor-pointer transition-all"
            title="Log Out Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High-Impact Executive Bento Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Clients */}
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Total Clients</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {aggregatedCustomers.length}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {activeMinersCount} Active Miners
          </div>
        </div>

        {/* Total Active Hashrate */}
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-amber-500/30 space-y-1 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span>Total Hashrate</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {totalPlatformHashrate} <span className="text-xs">TH/s</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Online Stratum Pool
          </div>
        </div>

        {/* Verified Deposits */}
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-emerald-500/30 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span>Approved Deposits</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ${totalDepositVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {approvedDeposits.length} approved txs
          </div>
        </div>

        {/* Pending Deposit Reviews */}
        <div className={`p-4 rounded-2xl bg-[#0c1220] border space-y-1 shadow-lg ${
          pendingDeposits.length > 0 ? 'border-amber-500/60 shadow-amber-500/10' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span>Pending Deposits</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            {pendingDeposits.length}
          </div>
          <div className="text-[11px] text-amber-400/80 font-mono">
            ${pendingDepositVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT waiting
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className={`p-4 rounded-2xl bg-[#0c1220] border space-y-1 shadow-lg ${
          pendingWithdrawals.length > 0 ? 'border-purple-500/60 shadow-purple-500/10' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-purple-400 font-bold">
            <span>Pending Payouts</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
            {pendingWithdrawals.length}
          </div>
          <div className="text-[11px] text-purple-400/80 font-mono">
            ${pendingWithdrawalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT pending
          </div>
        </div>

        {/* Settled Withdrawn Volume */}
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
            <span>Paid Withdrawals</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
            ${totalWithdrawnVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {approvedWithdrawals.length} completed
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Clients 360° Directory */}
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'clients'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer 360° Directory ({aggregatedCustomers.length})</span>
            {activeMinersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'clients' ? 'bg-slate-950 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {activeMinersCount} Miners
              </span>
            )}
          </button>

          {/* Tab 2: Deposit Requests */}
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'deposits'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Deposit Requests ({deposits.length})</span>
            {pendingDeposits.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingDeposits.length} Pending
              </span>
            )}
          </button>

          {/* Tab 3: Withdrawal Requests */}
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Withdrawal Requests ({withdrawalRecords.length})</span>
            {pendingWithdrawals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white animate-pulse">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CUSTOMER 360° COMPLETE DIRECTORY                      */}
      {/* ============================================================ */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Filters & Instant Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0d1424] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                onClick={() => setClientFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  clientFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Clients ({aggregatedCustomers.length})
              </button>
              <button
                onClick={() => setClientFilter('active_miners')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                  clientFilter === 'active_miners'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Active Miners ({activeMinersCount})</span>
              </button>
              <button
                onClick={() => setClientFilter('pending_deposits')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                  clientFilter === 'pending_deposits'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Pending Verification ({pendingDeposits.length})</span>
              </button>
              <button
                onClick={() => setClientFilter('pending_withdrawals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                  clientFilter === 'pending_withdrawals'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Pending Payout ({pendingWithdrawals.length})</span>
              </button>
              <button
                onClick={() => setClientFilter('inactive')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  clientFilter === 'inactive'
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Inactive / Free
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, wallet, TXID, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#121c33] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-80"
              />
            </div>
          </div>

          {/* Customer Table */}
          <div className="rounded-2xl bg-[#0c1220] border border-slate-800 overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 px-4 py-3.5 bg-[#10182b] border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4 sm:col-span-3">Customer Identity</div>
              <div className="col-span-3 sm:col-span-2">Mining Power</div>
              <div className="col-span-3 sm:col-span-2">Total Invested</div>
              <div className="hidden sm:block sm:col-span-2">Accrued / Balance</div>
              <div className="hidden sm:block sm:col-span-2">Status & Alerts</div>
              <div className="col-span-2 sm:col-span-1 text-right">Inspect</div>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[65vh] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                  <Users className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="font-bold text-slate-400 text-sm">No customers matching this filter</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    When visitors register or make deposits on HashForge, their complete 360° profile, active mining clusters, and balances will populate here in real-time.
                  </p>
                </div>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  return (
                    <div
                      key={`cust-${cust.user.id || cust.user.email || 'c'}-${idx}`}
                      className="grid grid-cols-12 px-4 py-3.5 text-xs items-center hover:bg-slate-900/60 transition-colors gap-2"
                    >
                      {/* Customer Name & Email */}
                      <div className="col-span-4 sm:col-span-3 min-w-0">
                        <div className="font-bold text-white truncate flex items-center gap-1.5">
                          <span>{cust.user.name || 'Unnamed Client'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold">
                            VIP {cust.computedVipLevel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{cust.user.email}</div>
                      </div>

                      {/* Hashrate & Nodes */}
                      <div className="col-span-3 sm:col-span-2">
                        {cust.activeContracts.length > 0 ? (
                          <div>
                            <div className="font-black text-amber-400 font-mono flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5" />
                              <span>{cust.totalHashrate} TH/s</span>
                            </div>
                            <div className="text-[10px] text-emerald-400 font-medium">
                              {cust.activeContracts.length} running {cust.activeContracts.length === 1 ? 'node' : 'nodes'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 font-mono text-[11px]">0 TH/s (Idle)</div>
                        )}
                      </div>

                      {/* Total Invested */}
                      <div className="col-span-3 sm:col-span-2 font-mono">
                        <div className="font-bold text-emerald-400">
                          ${cust.totalDepositedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {cust.approvedDeposits.length} approved dep.
                        </div>
                      </div>

                      {/* Accrued Profit & Net Balance */}
                      <div className="hidden sm:block sm:col-span-2 font-mono">
                        <div className="text-cyan-300 font-bold text-[11px]">
                          +${cust.totalAccruedProfitsUsd.toFixed(2)} mined
                        </div>
                        <div className="text-[10px] text-purple-400">
                          ${cust.estimatedAvailableBalanceUsd.toFixed(2)} withdrawable
                        </div>
                      </div>

                      {/* Status Badges & Action Flags */}
                      <div className="hidden sm:block sm:col-span-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {cust.pendingDeposits.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {cust.pendingDeposits.length} Dep. Pending
                            </span>
                          )}
                          {cust.pendingWithdrawals.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Wallet className="w-2.5 h-2.5" /> Payout Pending
                            </span>
                          )}
                          {cust.pendingDeposits.length === 0 && cust.pendingWithdrawals.length === 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cust.accountStatus === 'Active Miner'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {cust.accountStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inspect / 360 View Button */}
                      <div className="col-span-2 sm:col-span-1 text-right flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectedCustomer(cust)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                          title="Open 360° Customer Ledger & Controls"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: DEPOSIT REQUESTS & BLOCKCHAIN VERIFICATION            */}
      {/* ============================================================ */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1424] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setDepositFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                  depositFilter === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Pending Review</span>
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {pendingDeposits.length}
                </span>
              </button>
              <button
                onClick={() => setDepositFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  depositFilter === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approved ({approvedDeposits.length})
              </button>
              <button
                onClick={() => setDepositFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  depositFilter === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Declined / Rejected
              </button>
              <button
                onClick={() => setDepositFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  depositFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({deposits.length})
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user, TXID, package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#121c33] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Blockchain Verification:</strong> Verify the sender TXID on the explorer before approving. Approving immediately credits the mining package to the client's dashboard and begins production.
            </span>
          </div>

          <div className="space-y-3">
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No deposit requests found</div>
                <p className="text-xs text-slate-500">When clients submit a deposit request, it will appear here for your approval.</p>
              </div>
            ) : (
              filteredDeposits.map((dep, idx) => {
                const isTrc = dep.network === 'TRC20';
                const explorerUrl = isTrc
                  ? `https://tronscan.org/#/transaction/${dep.senderTxid}`
                  : `https://etherscan.io/tx/${dep.senderTxid}`;

                return (
                  <div
                    key={`dep-${dep.id || 'd'}-${idx}`}
                    className={`p-4 sm:p-5 rounded-2xl bg-[#0f172a] border ${
                      dep.status === 'pending'
                        ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : dep.status === 'approved'
                        ? 'border-emerald-500/30 opacity-95'
                        : 'border-rose-900/40 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{dep.userName}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                            {dep.packageName} (VIP {dep.vipLevel})
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">
                            {dep.network}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{dep.createdAt}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Amount:</span>
                            <span className="text-base font-black text-emerald-400 font-mono">
                              ${dep.amountUsd.toLocaleString()} USDT
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500">Sender TXID:</span>
                            <code className="text-amber-300/90 bg-[#121b30] px-2 py-0.5 rounded border border-slate-800 break-all select-all">
                              {dep.senderTxid}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(dep.senderTxid, `dep-tx-${dep.id}`)}
                              className="text-slate-400 hover:text-white"
                            >
                              {copiedKey === `dep-tx-${dep.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                            >
                              <span>Explorer</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                        {dep.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => onApproveDeposit(dep.id)}
                              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                              title="Accept and approve this deposit"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Accept / Approve</span>
                            </button>
                            <button
                              onClick={() => onRejectDeposit(dep.id)}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 font-bold text-xs border border-slate-700 hover:border-rose-700 cursor-pointer transition-all flex items-center gap-1.5"
                              title="Decline / Reject this deposit"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Decline / Reject</span>
                            </button>
                          </>
                        ) : dep.status === 'approved' ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approved & Credited</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/30">
                            <XCircle className="w-4 h-4" />
                            <span>Declined / Rejected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: WITHDRAWAL REQUESTS & PAYOUTS                         */}
      {/* ============================================================ */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1424] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setWithdrawalFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                  withdrawalFilter === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Pending Review</span>
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {pendingWithdrawals.length}
                </span>
              </button>
              <button
                onClick={() => setWithdrawalFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  withdrawalFilter === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approved ({approvedWithdrawals.length})
              </button>
              <button
                onClick={() => setWithdrawalFilter('failed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  withdrawalFilter === 'failed'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Declined / Failed
              </button>
              <button
                onClick={() => setWithdrawalFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  withdrawalFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({withdrawalRecords.length})
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search currency, type, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#121c33] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
                <Wallet className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No withdrawal requests found</div>
                <p className="text-xs text-slate-500">When clients request withdrawals, they will appear here with Accept and Decline actions.</p>
              </div>
            ) : (
              filteredWithdrawals.map((w, idx) => (
                <div
                  key={`w-${w.id || 'w'}-${idx}`}
                  className={`p-4 sm:p-5 rounded-2xl bg-[#0f172a] border ${
                    w.status === 'Pending'
                      ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : w.status === 'Withdrawal successfully'
                      ? 'border-emerald-500/30 opacity-95'
                      : 'border-rose-900/40 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
                          ₮
                        </div>
                        <span className="text-sm font-bold text-white">{w.currency}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">
                          {w.type}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{w.time}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Withdrawal Amount:</span>
                          <span className="text-base font-black text-rose-400 font-mono">
                            ${Math.abs(w.amount).toLocaleString()} USDT
                          </span>
                        </div>
                        {w.walletAddress && (
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500">Destination Wallet:</span>
                            <code className="text-slate-300 bg-[#121b30] px-2 py-0.5 rounded border border-slate-800 break-all select-all">
                              {w.walletAddress}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(w.walletAddress!, `w-addr-${w.id}`)}
                              className="text-slate-400 hover:text-white"
                            >
                              {copiedKey === `w-addr-${w.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                        {w.userName && (
                          <div className="text-xs text-slate-400">
                            Requested by: <strong className="text-white">{w.userName}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                      {w.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => onApproveWithdrawal && onApproveWithdrawal(w.id)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                            title="Accept and approve withdrawal"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept / Approve</span>
                          </button>
                          <button
                            onClick={() => onRejectWithdrawal && onRejectWithdrawal(w.id)}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 font-bold text-xs border border-slate-700 hover:border-rose-700 cursor-pointer transition-all flex items-center gap-1.5"
                            title="Decline / Reject withdrawal"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Decline / Reject</span>
                          </button>
                        </>
                      ) : w.status === 'Withdrawal successfully' ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approved & Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/30">
                          <XCircle className="w-4 h-4" />
                          <span>Declined / Failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CUSTOMER 360° INSPECTOR MODAL                                */}
      {/* ============================================================ */}
      {inspectedCustomer && (
        <CustomerDetailModal
          customer={inspectedCustomer}
          onClose={() => setInspectedCustomer(null)}
          onApproveDeposit={onApproveDeposit}
          onRejectDeposit={onRejectDeposit}
          onApproveWithdrawal={onApproveWithdrawal}
          onRejectWithdrawal={onRejectWithdrawal}
          onDeleteClient={onDeleteClient}
          onUpdateUser={onUpdateUser}
        />
      )}

      {/* ============================================================ */}
      {/* FULL DATABASE PURGE & RESET CONFIRMATION MODAL               */}
      {/* ============================================================ */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0d1424] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Reset & Purge All Test Data?</h3>
                <p className="text-xs text-rose-300/80 font-mono">Master Admin Protected Reset</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-2 text-xs text-slate-300">
              <p className="font-bold text-white">This action will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px]">
                <li>All registered test client accounts</li>
                <li>All deposit requests & active mining packages</li>
                <li>All withdrawal records & history</li>
                <li>Local client session cache</li>
              </ul>
              <p className="text-emerald-400 font-semibold pt-1">
                ✓ Master Administrator account credentials will be safely preserved.
              </p>
            </div>

            {purgeSuccessMsg ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center">
                {purgeSuccessMsg}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurgeConfirm(false)}
                  disabled={isPurging}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePurge}
                  disabled={isPurging}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isPurging ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Purging...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm & Delete All</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
