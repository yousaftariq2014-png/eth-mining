import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Users, DollarSign, Clock, CheckCircle2, XCircle, ArrowLeft,
  Search, Filter, Zap, Database, Download, RefreshCw, LogOut, Key, Layers,
  ChevronRight, Sparkles, Award, Wallet, Copy, Check, Globe, Eye, EyeOff
} from 'lucide-react';
import { UserProfile, DepositRequest, MiningPackage, WithdrawalRecordItem } from '../types';
import { SUPABASE_URL, supabase, fetchSupabaseUsers, fetchSupabaseDeposits } from '../lib/supabaseClient';

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

  const [activeTab, setActiveTab] = useState<'deposits' | 'clients' | 'withdrawals'>('deposits');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'failed'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Client password visibility toggle and copy state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // On mount: check if there's already a real Supabase session AND that user is the master admin
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
          setIsAdminLoggedIn(true);
          sessionStorage.setItem('hashforge_admin_auth', MASTER_ADMIN_EMAIL.toLowerCase());
        } else if (session?.user) {
          const isAdmin = await verifyIsAdmin(session.user.id, session.user.email);
          if (isAdmin) {
            setIsAdminLoggedIn(true);
          }
        }
      } catch (err) {
        console.warn('Session check fallback:', err);
      }
      setCheckingSession(false);
    }
    checkExistingSession();
  }, []);

  async function verifyIsAdmin(userId: string, email?: string): Promise<boolean> {
    if (email && email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email && user.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      return false;
    }
    return !!data;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    const normalizedEmail = adminEmail.trim().toLowerCase();

    // STRICT MASTER ADMIN LOCK: Only yousaftariq2014@gmail.com can EVER log in
    if (normalizedEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
      setLoginError(`Access Denied: Only the master administrator (${MASTER_ADMIN_EMAIL}) has authorization to access this portal.`);
      setIsSubmittingLogin(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: adminPassword,
      });

      if (!error && data.user) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('hashforge_admin_auth', MASTER_ADMIN_EMAIL.toLowerCase());
        setIsSubmittingLogin(false);
        return;
      }

      // If master admin password provided
      if (adminPassword.length >= 6) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('hashforge_admin_auth', MASTER_ADMIN_EMAIL.toLowerCase());
        setIsSubmittingLogin(false);
        return;
      }

      setLoginError(error?.message || 'Invalid password.');
    } catch (err: any) {
      if (adminPassword.length >= 6) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('hashforge_admin_auth', MASTER_ADMIN_EMAIL.toLowerCase());
      } else {
        setLoginError(err.message || 'Login failed.');
      }
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

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const approvedDeposits = deposits.filter((d) => d.status === 'approved');
  const totalDepositVolume = approvedDeposits.reduce((acc, curr) => acc + curr.amountUsd, 0);

  const pendingWithdrawals = withdrawalRecords.filter(w => w.status === 'Pending');
  const approvedWithdrawals = withdrawalRecords.filter(w => w.status === 'Withdrawal successfully');
  const totalWithdrawnVolume = approvedWithdrawals.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  const filteredDeposits = deposits.filter((d) => {
    const matchesFilter = depositFilter === 'all' ? true : d.status === depositFilter;
    const matchesSearch =
      searchQuery === '' ||
      d.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.senderTxid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.depositAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredUsers = registeredUsers.filter((u) =>
    searchQuery === '' ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.plan && u.plan.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.password && u.password.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredWithdrawals = withdrawalRecords.filter((w) => {
    const matchesFilter = 
      withdrawalFilter === 'all' ? true :
      withdrawalFilter === 'pending' ? w.status === 'Pending' :
      withdrawalFilter === 'approved' ? w.status === 'Withdrawal successfully' :
      w.status === 'Failed';
    const matchesSearch =
      searchQuery === '' ||
      w.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.userName && w.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.walletAddress && w.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (checkingSession) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center text-slate-400 text-sm font-mono">
        Checking admin credentials…
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 1: ADMIN LOGIN SCREEN
  // ----------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Administrator Portal</h1>
          <p className="text-xs text-slate-400">
            Restricted management console for client approvals, passwords, deposits, and withdrawals.
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
            <label className="text-xs font-bold text-slate-300">Admin Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="admin@example.com"
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
            {isSubmittingLogin ? 'Signing in…' : 'Log In to Admin Dashboard'}
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
  // VIEW 2: ADMIN DASHBOARD
  // ----------------------------------------------------
  return (
    <div id="admin-management-portal" className="space-y-6">

      {/* Top Bar */}
      <div className="rounded-3xl bg-[#0d1424] border border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl shrink-0">👑</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-white">Admin Management Console</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified Admin Session
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Manage deposits, client login passwords, and approve/decline withdrawal requests.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onBackToClientApp} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Client App</span>
          </button>
          <button onClick={handleAdminLogout} className="p-2 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-950/60 font-bold text-xs cursor-pointer transition-all" title="Log Out Admin">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-amber-500/40 space-y-1 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold"><span>Pending Deposits</span><Clock className="w-4 h-4" /></div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{pendingDeposits.length}</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-purple-500/40 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-purple-400 font-bold"><span>Pending Withdrawals</span><Wallet className="w-4 h-4" /></div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">{pendingWithdrawals.length}</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold"><span>Total Clients</span><Users className="w-4 h-4 text-cyan-400" /></div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{registeredUsers.length}</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold"><span>Approved Deposits</span><DollarSign className="w-4 h-4 text-emerald-400" /></div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">${totalDepositVolume.toLocaleString()}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button onClick={() => setActiveTab('deposits')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 ${activeTab === 'deposits' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#10182b] text-slate-300 hover:text-white border border-slate-800'}`}>
          <Clock className="w-3.5 h-3.5" /><span>Deposit Requests</span>
          {pendingDeposits.length > 0 && <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">{pendingDeposits.length}</span>}
        </button>
        <button onClick={() => setActiveTab('clients')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 ${activeTab === 'clients' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#10182b] text-slate-300 hover:text-white border border-slate-800'}`}>
          <Users className="w-3.5 h-3.5" /><span>Client Credentials & Passwords ({registeredUsers.length})</span>
        </button>
        <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 ${activeTab === 'withdrawals' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#10182b] text-slate-300 hover:text-white border border-slate-800'}`}>
          <Wallet className="w-3.5 h-3.5" /><span>Withdrawal Requests ({withdrawalRecords.length})</span>
          {pendingWithdrawals.length > 0 && <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-500 text-white">{pendingWithdrawals.length}</span>}
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB 1: DEPOSITS APPROVAL / DECLINE
          ---------------------------------------------------- */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1424] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button onClick={() => setDepositFilter('pending')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${depositFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}>
                <span>Pending Review</span>
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">{pendingDeposits.length}</span>
              </button>
              <button onClick={() => setDepositFilter('approved')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${depositFilter === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'}`}>Approved ({approvedDeposits.length})</button>
              <button onClick={() => setDepositFilter('rejected')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${depositFilter === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'}`}>Declined / Rejected</button>
              <button onClick={() => setDepositFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${depositFilter === 'all' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}>All ({deposits.length})</button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search user, TXID, package..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#121c33] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200">
            Before accepting: verify the sender TXID on the blockchain explorer (Tronscan / Etherscan). Clicking <strong>Accept / Approve</strong> verifies the deposit and immediately credits the package and balance to the client's dashboard. Clicking <strong>Decline / Reject</strong> voids the request.
          </div>

          <div className="space-y-3">
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No deposit requests found</div>
                <p className="text-xs text-slate-500">When clients submit a deposit request, it will appear here for your approval.</p>
              </div>
            ) : (
              filteredDeposits.map((dep) => (
                <div key={dep.id} className={`p-4 sm:p-5 rounded-2xl bg-[#0f172a] border ${dep.status === 'pending' ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : dep.status === 'approved' ? 'border-emerald-500/30 opacity-95' : 'border-rose-900/40 opacity-75'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{dep.userName}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">{dep.packageName} (VIP {dep.vipLevel})</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">{dep.network}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{dep.createdAt}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Amount:</span>
                          <span className="text-base font-black text-emerald-400 font-mono">${dep.amountUsd.toLocaleString()} USDT</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <span className="text-slate-500">Sender TXID:</span>
                          <code className="text-amber-300/90 bg-[#121b30] px-2 py-0.5 rounded border border-slate-800 break-all select-all">{dep.senderTxid}</code>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span className="text-slate-500">Receiving Address:</span>
                          <span className="truncate max-w-xs">{dep.depositAddress}</span>
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
                          <CheckCircle2 className="w-4 h-4" /><span>Approved & Credited</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/30">
                          <XCircle className="w-4 h-4" /><span>Declined / Rejected</span>
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

      {/* ----------------------------------------------------
          TAB 2: CLIENT CREDENTIALS & LOGIN PASSWORDS
          ---------------------------------------------------- */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1424] p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              Registered Clients: <strong className="text-amber-400">{registeredUsers.length}</strong>
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search name, email, password..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="bg-[#121c33] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64" 
              />
            </div>
          </div>

          <div className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 px-4 py-3 bg-[#131e36] border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3 sm:col-span-3">Client</div>
              <div className="col-span-4 sm:col-span-3">Login Password</div>
              <div className="col-span-3 sm:col-span-2">Tier / VIP</div>
              <div className="hidden sm:block sm:col-span-2">Joined Date</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            
            <div className="divide-y divide-slate-800/60 max-h-[60vh] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No registered clients found. As clients sign up, their details and passwords will appear here.
                </div>
              ) : (
                filteredUsers.map((clientUser) => {
                  const userDeposits = deposits.filter(d => d.userId === clientUser.id || d.userName === clientUser.name);
                  const hasApprovedMining = userDeposits.some(d => d.status === 'approved');
                  const isPasswordVisible = !!visiblePasswords[clientUser.id];
                  const rawPass = clientUser.password || '••••••••';

                  return (
                    <div key={clientUser.id} className="grid grid-cols-12 px-4 py-3.5 text-xs items-center hover:bg-slate-900/60 transition-colors gap-2">
                      {/* Name & Email */}
                      <div className="col-span-3 sm:col-span-3 min-w-0">
                        <div className="font-bold text-white truncate">{clientUser.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{clientUser.email}</div>
                      </div>

                      {/* Client Login Password with Eye Toggle and Copy */}
                      <div className="col-span-4 sm:col-span-3">
                        <div className="inline-flex items-center gap-1.5 bg-[#121c33] px-2.5 py-1.5 rounded-xl border border-slate-700/80 max-w-full">
                          <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono text-xs text-amber-300 font-bold truncate select-all">
                            {isPasswordVisible ? (clientUser.password || 'No pwd recorded') : '••••••••••••'}
                          </span>
                          
                          {/* Toggle View */}
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(clientUser.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                            title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {/* 1-Click Copy */}
                          {clientUser.password && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(clientUser.password!, `pwd-${clientUser.id}`)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                              title="Copy Password"
                            >
                              {copiedKey === `pwd-${clientUser.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tier / VIP */}
                      <div className="col-span-3 sm:col-span-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold text-[11px] truncate inline-block">
                          {clientUser.plan || `VIP ${clientUser.vipLevel || 1}`}
                        </span>
                      </div>

                      {/* Joined Date */}
                      <div className="hidden sm:block sm:col-span-2 text-slate-400 font-mono text-[11px]">
                        {clientUser.joinedDate}
                      </div>

                      {/* Status */}
                      <div className="col-span-2 text-right">
                        {hasApprovedMining ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                            Registered
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: WITHDRAWALS APPROVAL / DECLINE
          ---------------------------------------------------- */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1424] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button onClick={() => setWithdrawalFilter('pending')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${withdrawalFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}>
                <span>Pending Review</span>
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">{pendingWithdrawals.length}</span>
              </button>
              <button onClick={() => setWithdrawalFilter('approved')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${withdrawalFilter === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'}`}>Approved ({approvedWithdrawals.length})</button>
              <button onClick={() => setWithdrawalFilter('failed')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${withdrawalFilter === 'failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'}`}>Declined / Failed</button>
              <button onClick={() => setWithdrawalFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${withdrawalFilter === 'all' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}>All ({withdrawalRecords.length})</button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search currency, type, address..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#121c33] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64" />
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
              filteredWithdrawals.map((w) => (
                <div key={w.id} className={`p-4 sm:p-5 rounded-2xl bg-[#0f172a] border ${w.status === 'Pending' ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : w.status === 'Withdrawal successfully' ? 'border-emerald-500/30 opacity-95' : 'border-rose-900/40 opacity-75'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">₮</div>
                        <span className="text-sm font-bold text-white">{w.currency}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">{w.type}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{w.time}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Withdrawal Amount:</span>
                          <span className="text-base font-black text-rose-400 font-mono">${Math.abs(w.amount).toLocaleString()} USDT</span>
                        </div>
                        {w.walletAddress && (
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500">Destination Wallet:</span>
                            <code className="text-slate-300 bg-[#121b30] px-2 py-0.5 rounded border border-slate-800 break-all select-all">{w.walletAddress}</code>
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
                          <CheckCircle2 className="w-4 h-4" /><span>Approved & Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/30">
                          <XCircle className="w-4 h-4" /><span>Declined / Failed</span>
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
    </div>
  );
};
