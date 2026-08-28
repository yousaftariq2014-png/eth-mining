import React, { useState, useEffect } from 'react';
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
  Database, 
  Download, 
  RefreshCw, 
  LogOut, 
  Key, 
  Layers,
  ChevronRight,
  Sparkles,
  Award,
  Wallet,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, DepositRequest, MiningPackage, WithdrawalRecordItem } from '../types';
import { 
  SUPABASE_URL, 
  SUPABASE_SQL_SETUP, 
  checkSupabaseConnection, 
  fetchSupabaseUsers, 
  fetchSupabaseDeposits 
} from '../lib/supabase';

interface AdminPortalProps {
  onBackToClientApp: () => void;
  deposits: DepositRequest[];
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string) => void;
  registeredUsers: UserProfile[];
  packages: MiningPackage[];
  withdrawalRecords: WithdrawalRecordItem[];
  onApproveWithdrawal?: (withdrawalId: string) => void;
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
}) => {
  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('eth_admin_session') === 'true';
  });
  const [adminEmail, setAdminEmail] = useState<string>('admin@eth-smart.com');
  const [adminPassword, setAdminPassword] = useState<string>('admin123');
  const [loginError, setLoginError] = useState<string>('');

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<'deposits' | 'clients' | 'withdrawals' | 'database'>('deposits');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Supabase Live Status
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    checkSupabaseConnection().then(res => {
      setIsSupabaseConnected(res.connected);
    });
  }, []);

  const handleTestConnection = async () => {
    setIsCheckingDb(true);
    const res = await checkSupabaseConnection();
    setIsSupabaseConnected(res.connected);
    setIsCheckingDb(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (adminEmail.trim() === 'admin@eth-smart.com' || adminEmail.trim() === 'admin') &&
      adminPassword.trim() === 'admin123'
    ) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('eth_admin_session', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid Admin Credentials. Default login: admin@eth-smart.com / admin123');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('eth_admin_session');
  };

  // Export JSON Database Backup
  const handleExportDataBackup = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      platform: 'ETH2.0 Smart Production',
      supabaseHost: SUPABASE_URL,
      registeredUsers,
      deposits,
      withdrawalRecords,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eth2_supabase_admin_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats Calculations
  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const approvedDeposits = deposits.filter((d) => d.status === 'approved');
  const totalDepositVolume = approvedDeposits.reduce((acc, curr) => acc + curr.amountUsd, 0);

  // Filtered deposits for display
  const filteredDeposits = deposits.filter((d) => {
    const matchesFilter =
      depositFilter === 'all' ? true : d.status === depositFilter;
    const matchesSearch =
      searchQuery === '' ||
      d.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.senderTxid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.depositAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filtered clients
  const filteredUsers = registeredUsers.filter((u) => {
    return (
      searchQuery === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.plan && u.plan.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // ----------------------------------------------------
  // VIEW 1: ADMIN LOGIN SCREEN (If not logged in)
  // ----------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Top Lock Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">
            Administrator Portal
          </h1>
          <p className="text-xs text-slate-400">
            Restricted management area for client approvals, payments, and mining node activations.
          </p>
        </div>

        {/* Error Message */}
        {loginError && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Admin Credentials Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Admin Email / Username</label>
            <input
              type="text"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className="w-full bg-[#131d33] border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Admin Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              className="w-full bg-[#131d33] border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick credentials hint for owner */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
            <div className="text-amber-400 font-bold">Default Master Credentials:</div>
            <div>User: <strong className="text-slate-200">admin@eth-smart.com</strong></div>
            <div>Pass: <strong className="text-slate-200">admin123</strong></div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all"
          >
            Log In to Admin Dashboard
          </button>
        </form>

        {/* Return to Public Website */}
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
  // VIEW 2: ADMIN DASHBOARD & MANAGEMENT CONSOLE
  // ----------------------------------------------------
  return (
    <div id="admin-management-portal" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Admin Top Header */}
      <div className="rounded-3xl bg-[#0d1424] border border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl shrink-0">
            👑
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-white">
                Admin Master Management Console
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Secure Session
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Supabase Live Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Connected Database: <span className="text-slate-300 font-mono">bnyjkevubfncpkbnbacv.supabase.co</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportDataBackup}
            className="px-3.5 py-2 rounded-xl bg-[#131d33] hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Download Full Database Backup as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Backup</span>
          </button>

          <button
            onClick={onBackToClientApp}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Client App</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="p-2 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-950/60 font-bold text-xs cursor-pointer transition-all"
            title="Log Out Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Pending Approvals */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-amber-500/40 space-y-1 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {pendingDeposits.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Awaiting admin confirmation
          </div>
        </div>

        {/* Total Registered Clients */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Total Clients</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {registeredUsers.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Registered accounts
          </div>
        </div>

        {/* Total Deposit Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Approved Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ${totalDepositVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            USDT received from packages
          </div>
        </div>

        {/* Active Mining Nodes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Active Miner Nodes</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {approvedDeposits.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Generating 6-hour payouts
          </div>
        </div>

      </div>

      {/* Tabs Bar: Deposits Review | Clients List | Withdrawals | Supabase Database */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'deposits'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-[#10182b] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Client Deposits</span>
          {pendingDeposits.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
              {pendingDeposits.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'clients'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-[#10182b] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Registered Clients ({registeredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'withdrawals'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-[#10182b] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Withdrawal Requests ({withdrawalRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'database'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-[#10182b] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase SQL & Tables</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: CLIENT DEPOSITS & APPROVAL WORKFLOW */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1424] p-3.5 rounded-2xl border border-slate-800">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setDepositFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  depositFilter === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approved ({approvedDeposits.length})
              </button>

              <button
                onClick={() => setDepositFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  depositFilter === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rejected
              </button>

              <button
                onClick={() => setDepositFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  depositFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Records ({deposits.length})
              </button>
            </div>

            {/* Search Input */}
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

          {/* Deposits List */}
          <div className="space-y-3">
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No deposits found</div>
                <div className="text-xs text-slate-500">
                  {depositFilter === 'pending' ? 'All client deposits have been reviewed.' : 'No matching records in database.'}
                </div>
              </div>
            ) : (
              filteredDeposits.map((dep) => (
                <div
                  key={dep.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-[#0f172a] border transition-all ${
                    dep.status === 'pending'
                      ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : dep.status === 'approved'
                      ? 'border-slate-800 opacity-90'
                      : 'border-rose-900/40 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Left: User & Package Details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {dep.userName}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                          {dep.packageName} (VIP {dep.vipLevel})
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">
                          {dep.network}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {dep.createdAt}
                        </span>
                      </div>

                      {/* Deposit Amount & Blockchain TXID */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Recharge Amount:</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            ${dep.amountUsd.toLocaleString()} USDT
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <span className="text-slate-500">Sender TXID / Hash:</span>
                          <code className="text-amber-300/90 bg-[#121b30] px-2 py-0.5 rounded border border-slate-800 break-all select-all">
                            {dep.senderTxid}
                          </code>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span className="text-slate-500">Receiving Address:</span>
                          <span className="truncate max-w-xs">{dep.depositAddress}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                      {dep.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => {
                              onApproveDeposit(dep.id);
                              confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                            }}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve & Activate Mining</span>
                          </button>
                          <button
                            onClick={() => onRejectDeposit(dep.id)}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 font-bold text-xs border border-slate-700 hover:border-rose-700 cursor-pointer transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : dep.status === 'approved' ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mining Active (VIP {dep.vipLevel})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/30">
                          <XCircle className="w-4 h-4" />
                          <span>Rejected Deposit</span>
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

      {/* ---------------------------------------------------- */}
      {/* TAB 2: REGISTERED CLIENTS MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0d1424] p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              Total Clients Enrolled: <strong className="text-amber-400">{registeredUsers.length}</strong>
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#121c33] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 px-4 py-3 bg-[#131e36] border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Client Name & Email</div>
              <div className="col-span-3">Tier / Package</div>
              <div className="col-span-3">Joined Date</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[60vh] overflow-y-auto">
              {filteredUsers.map((user) => {
                const userDeposits = deposits.filter(d => d.userId === user.id);
                const hasApprovedMining = userDeposits.some(d => d.status === 'approved');

                return (
                  <div key={user.id} className="grid grid-cols-12 px-4 py-3.5 text-xs items-center hover:bg-slate-900/60 transition-colors">
                    <div className="col-span-4">
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </div>
                    <div className="col-span-3">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold text-[11px]">
                        {user.plan || `VIP ${user.vipLevel || 1}`}
                      </span>
                    </div>
                    <div className="col-span-3 text-slate-400 font-mono text-[11px]">
                      {user.joinedDate || '2026-08-28'}
                    </div>
                    <div className="col-span-2 text-right">
                      {hasApprovedMining ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active Mining
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                          Registered
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: WITHDRAWAL REQUESTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 px-4 py-3 bg-[#131e36] border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Currency / Type</div>
              <div className="col-span-3 text-right">Withdrawal Amount</div>
              <div className="col-span-3 text-center">Timestamp</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[60vh] overflow-y-auto">
              {withdrawalRecords.map((w) => (
                <div key={w.id} className="grid grid-cols-12 px-4 py-3.5 text-xs items-center hover:bg-slate-900/60 transition-colors">
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
                      ₮
                    </div>
                    <span className="font-bold text-white">{w.currency}</span>
                  </div>
                  <div className="col-span-3 text-right font-mono font-bold text-rose-400 text-sm">
                    {w.amount} USDT
                  </div>
                  <div className="col-span-3 text-center text-slate-400 font-mono text-[11px]">
                    {w.time}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                      w.status === 'Withdrawal successfully'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: SUPABASE DATABASE MANAGEMENT & SQL SETUP */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          
          {/* Connection Status Box */}
          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Supabase Cloud PostgreSQL Database</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Endpoint: <strong className="text-cyan-300">{SUPABASE_URL}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isCheckingDb}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
                  <span>{isCheckingDb ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={handleExportDataBackup}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON Backup</span>
                </button>
              </div>
            </div>

            {/* Supabase Status Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              <div className="p-4 rounded-2xl bg-[#111b33] border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase font-mono">Table: public.clients</div>
                <h4 className="text-sm font-bold text-white">Registered Users Sync</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Stores user name, email, VIP mining tier, and account creation dates across all devices.
                </p>
                <div className="text-[11px] text-emerald-400 font-mono font-bold">
                  ● {registeredUsers.length} Active Records Loaded
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#111b33] border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase font-mono">Table: public.deposits</div>
                <h4 className="text-sm font-bold text-white">Recharge & Approvals</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Stores deposit amounts, USDT network, sender TXID hash, and instant admin approval timestamps.
                </p>
                <div className="text-[11px] text-amber-400 font-mono font-bold">
                  ● {deposits.length} Deposit Records Loaded
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#111b33] border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-cyan-400 uppercase font-mono">Table: public.withdrawals</div>
                <h4 className="text-sm font-bold text-white">Withdrawal History</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time synchronization of client payout records and hash verification.
                </p>
                <div className="text-[11px] text-cyan-400 font-mono font-bold">
                  ● {withdrawalRecords.length} Withdrawal Records
                </div>
              </div>

            </div>

          </div>

          {/* SQL Editor Setup Box */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Supabase SQL Table Schema (1-Click Copy)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copy this SQL code and paste it into your <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query &gt; Run</strong>.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg shadow-cyan-500/20 transition-all"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy SQL Setup Script</span>
                  </>
                )}
              </button>
            </div>

            {/* SQL Code Block */}
            <div className="relative">
              <pre className="p-4 rounded-2xl bg-[#080d19] border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto max-h-72 select-all">
                {SUPABASE_SQL_SETUP}
              </pre>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
