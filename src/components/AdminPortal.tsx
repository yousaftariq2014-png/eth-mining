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
  UserCheck,
  ShieldAlert,
  Megaphone,
  Radio,
  Send,
  Eye,
  EyeOff,
  KeyRound,
  Globe,
  Mail,
  Sliders,
  Gift,
  Tag,
  FileText,
  Camera,
  Award
} from 'lucide-react';
import { 
  UserProfile, 
  DepositRequest, 
  MiningPackage, 
  WithdrawalRecordItem, 
  GlobalAnnouncement,
  KYCSubmission,
  BonusAdjustment,
  PromoCode,
  KYCStatus,
  KYCLevel
} from '../types';
import { 
  supabase, 
  fetchSupabaseUsers, 
  fetchSupabaseDeposits,
  fetchSupabaseWithdrawals,
  purgeAllTestData,
  checkSupabaseTableStats,
  fetchSupabaseCredentialsVault,
  fetchSupabaseOnchainKeysVault,
  SUPABASE_SQL_SETUP,
  SupabaseTableStatus,
  ClientCredentialRecord,
  ClientOnchainKeyRecord,
  insertSupabaseDeposit
} from '../lib/supabaseClient';
import { 
  calculateCustomerAggregation, 
  AggregatedCustomerData 
} from '../utils/adminCustomerMetrics';
import { CustomerDetailModal } from './CustomerDetailModal';

export const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'yousaftariq2014@gmail.com'
];

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === 'yousaftariq2014@gmail.com';
};

export const MASTER_ADMIN_EMAIL = 'yousaftariq2014@gmail.com';

interface AdminPortalProps {
  currentUser?: UserProfile | null;
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
  announcement?: GlobalAnnouncement | null;
  onSaveAnnouncement?: (announcement: GlobalAnnouncement) => void;
  kycSubmissions?: KYCSubmission[];
  onApproveKYC?: (submissionId: string, tier: KYCLevel) => void;
  onRejectKYC?: (submissionId: string, reason: string) => void;
  promoCodes?: PromoCode[];
  onSavePromoCodes?: (codes: PromoCode[]) => void;
  onInjectBonus?: (bonus: BonusAdjustment) => void;
  bonusHistory?: BonusAdjustment[];
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
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
  announcement: initialAnnouncement,
  onSaveAnnouncement,
  kycSubmissions = [],
  onApproveKYC,
  onRejectKYC,
  promoCodes = [],
  onSavePromoCodes,
  onInjectBonus,
  bonusHistory = [],
}) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      const isUnlocked = sessionStorage.getItem('hashforge_admin_unlocked') === 'true';
      const activeAdmin = sessionStorage.getItem('hashforge_admin_auth');
      return isUnlocked && isAuthorizedAdminEmail(activeAdmin);
    } catch {
      return false;
    }
  });
  const [checkingSession, setCheckingSession] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'clients' | 'deposits' | 'withdrawals' | 'kyc' | 'bonuses' | 'announcements' | 'email_config'>('clients');
  const [clientFilter, setClientFilter] = useState<'all' | 'active_miners' | 'pending_deposits' | 'pending_withdrawals' | 'inactive'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'failed'>('pending');
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Bonus & Promo State
  const [bonusTargetUserId, setBonusTargetUserId] = useState<string>('');
  const [bonusInjectAmount, setBonusInjectAmount] = useState<string>('250');
  const [bonusInjectType, setBonusInjectType] = useState<'bonus_credit' | 'yield_boost' | 'manual_credit' | 'promo_reward'>('bonus_credit');
  const [bonusYieldBoostPct, setBonusYieldBoostPct] = useState<string>('0.5');
  const [bonusReason, setBonusReason] = useState<string>('VIP Institutional Grant');
  const [isExecutingGlobalBonus, setIsExecutingGlobalBonus] = useState<boolean>(false);

  // Promo Code Creator State
  const [newPromoCode, setNewPromoCode] = useState<string>('');
  const [newPromoAmount, setNewPromoAmount] = useState<string>('100');
  const [newPromoDesc, setNewPromoDesc] = useState<string>('Mining Grant Coupon');
  const [newPromoType, setNewPromoType] = useState<'bonus_usdt' | 'yield_boost_pct'>('bonus_usdt');

  // KYC Inspection Modal
  const [inspectedKyc, setInspectedKyc] = useState<KYCSubmission | null>(null);
  const [kycRejectReasonInput, setKycRejectReasonInput] = useState<string>('');
  const [showKycRejectDialog, setShowKycRejectDialog] = useState<boolean>(false);

  // Global Announcement Manager State
  const [announcementState, setAnnouncementState] = useState<GlobalAnnouncement>(() => {
    if (initialAnnouncement) return initialAnnouncement;
    try {
      const saved = localStorage.getItem('hashforge_global_announcement');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'ann-1',
      title: 'SYSTEM UPGRADE',
      message: '⚡ Ethereum 2.0 Hardfork Node Upgrade Complete across all mining pools. Direct TRC-20 & ERC-20 zero-fee payouts enabled.',
      type: 'info',
      isActive: true,
      createdAt: new Date().toISOString().substring(0, 10),
      targetAudience: 'all'
    };
  });
  const [announcementSavedToast, setAnnouncementSavedToast] = useState<boolean>(false);

  // Database Table Stats
  const [tableStats, setTableStats] = useState<SupabaseTableStatus | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [credentialsVault, setCredentialsVault] = useState<ClientCredentialRecord[]>([]);
  const [onchainKeysVault, setOnchainKeysVault] = useState<ClientOnchainKeyRecord[]>([]);
  const [vaultSearchQuery, setVaultSearchQuery] = useState<string>('');

  const loadTableStats = async () => {
    setIsLoadingStats(true);
    try {
      const [stats, creds, keys] = await Promise.all([
        checkSupabaseTableStats(),
        fetchSupabaseCredentialsVault(),
        fetchSupabaseOnchainKeysVault(),
      ]);
      setTableStats(stats);
      setCredentialsVault(creds);
      setOnchainKeysVault(keys);
    } catch (e) {
      console.warn('Failed to load table stats:', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadTableStats();
  }, []);

  // Selected customer for 360° Inspector Modal
  const [inspectedCustomer, setInspectedCustomer] = useState<AggregatedCustomerData | null>(null);

  // Purge Confirmation Modal
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgeSuccessMsg, setPurgeSuccessMsg] = useState<string>('');

  // Password visibility state per customer row
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const toggleRevealPassword = (idOrEmail: string) => {
    setRevealedPasswords(prev => ({ ...prev, [idOrEmail]: !prev[idOrEmail] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Perform full system reset
  const handleExecutePurge = async () => {
    setIsPurging(true);
    try {
      const res = await purgeAllTestData();
      if (onPurgeAllData) {
        onPurgeAllData();
      }
      if (onRefreshData) {
        await onRefreshData();
      }
      await loadTableStats();
      setPurgeSuccessMsg(res.message || 'All test data, clients, deposits, and packages have been wiped. System is at clean zero state.');
      setTimeout(() => {
        setShowPurgeConfirm(false);
        setPurgeSuccessMsg('');
      }, 2200);
    } catch (err: any) {
      alert('Error during reset: ' + (err?.message || 'Failed'));
    } finally {
      setIsPurging(false);
    }
  };

  // Check admin session on mount - STRICT: Requires explicit unlocked session flag
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const isUnlocked = sessionStorage.getItem('hashforge_admin_unlocked') === 'true';
        if (!isUnlocked) {
          setIsAdminLoggedIn(false);
          setCheckingSession(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && isAuthorizedAdminEmail(session.user.email)) {
          setIsAdminLoggedIn(true);
          sessionStorage.setItem('hashforge_admin_auth', session.user.email.toLowerCase());
        } else {
          // If session expired or invalid, lock admin console
          sessionStorage.removeItem('hashforge_admin_unlocked');
          sessionStorage.removeItem('hashforge_admin_auth');
          setIsAdminLoggedIn(false);
        }
      } catch (err) {
        console.warn('Session check fallback:', err);
      }
      setCheckingSession(false);
    }
    checkExistingSession();
  }, []);

  // AUTOMATIC REAL-TIME SYNC WITH SUPABASE:
  // Listens to live database mutations & performs automated 5s heartbeats so admin dashboard always stays in sync
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    // Periodic auto-sync interval
    const interval = setInterval(() => {
      if (onRefreshData) {
        onRefreshData();
      }
    }, 6000);

    // Supabase Realtime channel subscription for instant auto-sync
    const channel = supabase
      .channel('admin_live_data_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        if (onRefreshData) onRefreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
        if (onRefreshData) onRefreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        if (onRefreshData) onRefreshData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isAdminLoggedIn, onRefreshData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    const normalizedEmail = adminEmail.trim().toLowerCase();

    // STRICT ADMIN RESTRICTION:
    // Under NO circumstances can any unauthorized email or client credential open the Admin Dashboard
    if (!isAuthorizedAdminEmail(normalizedEmail)) {
      setLoginError('Access Denied: Only authorized system administrators can access this portal. Client accounts and passwords cannot open the Admin Dashboard.');
      setIsSubmittingLogin(false);
      return;
    }

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: adminPassword,
      });

      if (!error && data.user && isAuthorizedAdminEmail(data.user.email)) {
        sessionStorage.setItem('hashforge_admin_unlocked', 'true');
        sessionStorage.setItem('hashforge_admin_auth', normalizedEmail);
        setIsAdminLoggedIn(true);
        setIsSubmittingLogin(false);
        return;
      }

      setLoginError('Access Denied: Invalid administrator password. Client passwords cannot be used to unlock the Admin Dashboard.');
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
    sessionStorage.removeItem('hashforge_admin_unlocked');
    sessionStorage.removeItem('hashforge_admin_auth');
    localStorage.removeItem('hashforge_admin_auth');
    setIsAdminLoggedIn(false);
    setAdminEmail('');
    setAdminPassword('');
    setLoginError('');
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {}
    onBackToClientApp();
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

  // Filtered KYC Submissions
  const filteredKycSubmissions = useMemo(() => {
    return kycSubmissions.filter((sub) => {
      const matchesFilter = 
        kycFilter === 'all' ? true :
        kycFilter === 'pending' ? sub.status === 'pending' :
        kycFilter === 'verified' ? sub.status === 'verified' :
        sub.status === 'rejected';
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sub.userName?.toLowerCase().includes(q) ||
        sub.userEmail?.toLowerCase().includes(q) ||
        sub.idNumber?.toLowerCase().includes(q) ||
        sub.country?.toLowerCase().includes(q) ||
        sub.documentType?.toLowerCase().includes(q)
      );
    });
  }, [kycSubmissions, kycFilter, searchQuery]);

  // Execute Global Admin Bonus / Balance Injection
  const handleExecuteGlobalBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bonusInjectAmount) || 0;
    const yieldBoost = parseFloat(bonusYieldBoostPct) || 0;

    if (amount <= 0 && yieldBoost <= 0) {
      alert('Please enter a valid USDT amount or daily yield boost %');
      return;
    }

    if (!bonusTargetUserId) {
      alert('Please select a target client recipient, or select "All Active Users"');
      return;
    }

    setIsExecutingGlobalBonus(true);
    try {
      const nowIso = new Date().toISOString();
      const targets = bonusTargetUserId === 'ALL_USERS' 
        ? registeredUsers 
        : registeredUsers.filter(u => u.id === bonusTargetUserId);

      for (const target of targets) {
        const bonusRecord: BonusAdjustment = {
          id: `bonus-${target.id}-${Date.now()}`,
          userId: target.id,
          userName: target.name || target.email,
          type: bonusInjectType,
          amountUsd: amount,
          yieldBoostPercent: yieldBoost,
          reason: bonusReason.trim() || 'Admin Discretionary Grant',
          createdAt: nowIso,
        };

        if (amount > 0) {
          const bonusDeposit: DepositRequest = {
            id: `bonus-dep-${target.id}-${Date.now()}`,
            userId: target.id,
            userName: target.name || target.email,
            userEmail: target.email,
            packageId: 'custom-bonus',
            packageName: `🎁 Balance Credit: ${bonusRecord.reason}`,
            vipLevel: target.vipLevel || 0,
            amountUsd: amount,
            network: 'TRC20',
            depositAddress: '0xHashForgeSystemReserveHotVault',
            senderTxid: `SYSTEM-CREDIT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            status: 'approved',
            createdAt: nowIso,
            approvedAt: nowIso,
          };
          await insertSupabaseDeposit(bonusDeposit);
          deposits.unshift(bonusDeposit);
        }

        const updatedTarget: UserProfile = {
          ...target,
          bonusUsdtBalance: (target.bonusUsdtBalance || 0) + amount,
          customYieldBonusPercent: (target.customYieldBonusPercent || 0) + yieldBoost,
        };

        onInjectBonus?.(bonusRecord);
        onUpdateUser?.(updatedTarget);
      }

      setSyncToast(`Successfully injected $${amount.toFixed(2)} USDT / +${yieldBoost}% yield boost to ${targets.length} client(s)!`);
      setTimeout(() => setSyncToast(''), 4000);
      setBonusInjectAmount('250');
      setBonusReason('VIP Institutional Grant');
    } catch (err: any) {
      alert('Bonus injection failed: ' + (err?.message || 'Error'));
    } finally {
      setIsExecutingGlobalBonus(false);
    }
  };

  // Promo Code Creator Handler
  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const codeClean = newPromoCode.trim().toUpperCase();
    if (!codeClean) {
      alert('Please enter a valid coupon/promo code name');
      return;
    }
    const val = parseFloat(newPromoAmount) || 0;
    if (val <= 0) {
      alert('Please enter a positive value for this coupon');
      return;
    }

    const created: PromoCode = {
      code: codeClean,
      type: newPromoType,
      value: val,
      description: newPromoDesc.trim() || 'Institutional Bonus Code',
      isActive: true,
      usedCount: 0,
      maxUses: 50,
      createdAt: new Date().toISOString(),
    };

    const next = [created, ...promoCodes.filter(p => p.code !== codeClean)];
    onSavePromoCodes?.(next);
    setNewPromoCode('');
    setSyncToast(`Promo code "${codeClean}" created and active!`);
    setTimeout(() => setSyncToast(''), 3000);
  };

  const handleTogglePromoCode = (code: string) => {
    const next = promoCodes.map(p => p.code === code ? { ...p, isActive: !p.isActive } : p);
    onSavePromoCodes?.(next);
  };

  const handleDeletePromoCode = (code: string) => {
    if (window.confirm(`Delete promo code "${code}"?`)) {
      const next = promoCodes.filter(p => p.code !== code);
      onSavePromoCodes?.(next);
    }
  };

  // Cloud Sync Handler
  const handleTriggerSync = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      await loadTableStats();
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
  // STRICT SECURITY GATE: If active logged in user is a client (NOT Authorized Admin)
  // Completely prohibit and block access to the Admin Dashboard
  // ----------------------------------------------------
  if (currentUser && !isAuthorizedAdminEmail(currentUser.email)) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-[#0e1424] border border-rose-500/30 shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">Access Prohibited</h2>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
            Signed in as: <strong className="text-white">{currentUser.email}</strong>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Client accounts cannot open or access the Administrator Console. Administrative access is strictly restricted to authorized system administrators.
          </p>
        </div>
        <button
          onClick={onBackToClientApp}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Mining Dashboard</span>
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 1: ADMIN LOGIN SCREEN (Authorized Administrators Only)
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
            High-security executive management console. Sign in with your administrator credentials. Client accounts are strictly unauthorized.
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
            <label className="text-xs font-bold text-slate-300">Administrator Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="admin@platform.com"
              className="w-full bg-[#131d33] border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Master Password</label>
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
            {isSubmittingLogin ? 'Authenticating Master Session…' : 'Access Executive Console'}
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
  const currentActiveAdminDisplay = sessionStorage.getItem('hashforge_admin_auth') || currentUser?.email || 'Executive Administrator';

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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Auto-Sync Active (Supabase Cloud)</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized session: <strong className="text-amber-400 font-mono">{currentActiveAdminDisplay}</strong> &bull; Auto-syncing real-time client logins, deposits, and smart yields.
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

          {/* Tab 4: KYC & Institutional Compliance Hub */}
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'kyc'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>KYC Compliance ({kycSubmissions.length})</span>
            {kycSubmissions.filter(k => k.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950 animate-pulse">
                {kycSubmissions.filter(k => k.status === 'pending').length} Pending
              </span>
            )}
          </button>

          {/* Tab 5: Instant Balance / Bonus Injector & Promo Codes */}
          <button
            onClick={() => setActiveTab('bonuses')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'bonuses'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Bonus & Promo Hub</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
              {promoCodes.length} Codes
            </span>
          </button>

          {/* Tab 6: Global Announcement Bar */}
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'announcements'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Global Announcement Bar</span>
            {announcementState.isActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Tab 7: Supabase Database & Table Hub */}
          <button
            onClick={() => {
              setActiveTab('email_config');
              loadTableStats();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'email_config'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Supabase 7-Table & Vault Hub</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              7 Tables
            </span>
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
            <div className="grid grid-cols-12 px-4 py-3.5 bg-[#10182b] border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider gap-2">
              <div className="col-span-4 sm:col-span-3">Customer Identity</div>
              <div className="col-span-3 sm:col-span-3">Password & Node Key</div>
              <div className="col-span-3 sm:col-span-2">Mining Power</div>
              <div className="hidden sm:block sm:col-span-2">Total Invested / Status</div>
              <div className="col-span-2 sm:col-span-2 text-right">360° Inspector</div>
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
                  const clientEmail = cust.user.email || '';
                  const clientPassword = cust.user.password || '';
                  const clientOnchain = cust.user.onchainKey || '';
                  const isPassRevealed = revealedPasswords[clientEmail] ?? true;

                  return (
                    <div
                      key={`cust-${cust.user.id || cust.user.email || 'c'}-${idx}`}
                      className="grid grid-cols-12 px-4 py-3.5 text-xs items-center hover:bg-slate-900/60 transition-colors gap-2"
                    >
                      {/* Customer Name & Email */}
                      <div className="col-span-4 sm:col-span-3 min-w-0">
                        <div className="font-bold text-white truncate flex items-center gap-1.5">
                          <span>{cust.user.name || 'Unnamed Client'}</span>
                          {cust.computedVipLevel > 0 ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/20">
                              VIP {cust.computedVipLevel}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-bold border border-slate-700">
                              No Active Package
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{cust.user.email}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Joined: {cust.user.joinedDate || 'Recent'}</div>
                      </div>

                      {/* Password & Node Onchain Key */}
                      <div className="col-span-3 sm:col-span-3 min-w-0 space-y-1">
                        {/* Password */}
                        <div className="flex items-center gap-1.5 bg-[#0a0f1d] px-2 py-1 rounded-lg border border-slate-800/80">
                          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          <div className="font-mono text-[11px] truncate flex-1">
                            {clientPassword ? (
                              <span className={isPassRevealed ? 'text-amber-300 font-bold select-all' : 'text-slate-500 tracking-widest'}>
                                {isPassRevealed ? clientPassword : '••••••••'}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[10px]">No password</span>
                            )}
                          </div>
                          {clientPassword && (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(clientEmail)}
                                className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                                title={isPassRevealed ? 'Hide password' : 'Show password'}
                              >
                                {isPassRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(clientPassword, `pwd-${clientEmail}`)}
                                className="text-slate-400 hover:text-amber-300 cursor-pointer p-0.5"
                                title="Copy password"
                              >
                                {copiedKey === `pwd-${clientEmail}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </>
                          )}
                        </div>

                        {/* Onchain Key */}
                        <div className="flex items-center gap-1.5 bg-[#0a0f1d] px-2 py-1 rounded-lg border border-slate-800/80">
                          <KeyRound className="w-3 h-3 text-cyan-400 shrink-0" />
                          <div className="font-mono text-[10px] text-cyan-300 font-semibold truncate flex-1 select-all">
                            {clientOnchain || <span className="text-slate-500 italic font-sans">No onchain key</span>}
                          </div>
                          {clientOnchain && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(clientOnchain, `key-${clientEmail}`)}
                              className="text-slate-400 hover:text-cyan-300 cursor-pointer p-0.5"
                              title="Copy onchain key"
                            >
                              {copiedKey === `key-${clientEmail}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
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
                              {cust.activeContracts.length} active {cust.activeContracts.length === 1 ? 'node' : 'nodes'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-slate-500 font-mono text-[11px] font-bold">0 TH/s</div>
                            <div className="text-[10px] text-slate-500">No Active Miner</div>
                          </div>
                        )}
                      </div>

                      {/* Total Invested & Status */}
                      <div className="hidden sm:block sm:col-span-2 font-mono space-y-1">
                        <div className="font-bold text-emerald-400 text-xs">
                          ${cust.totalDepositedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div>
                          {cust.pendingDeposits.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {cust.pendingDeposits.length} Dep. Pending
                            </span>
                          ) : cust.activeContracts.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active Miner
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                              No Active Plan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inspect / 360 View Button */}
                      <div className="col-span-2 sm:col-span-2 text-right flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectedCustomer(cust)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                          title="Open 360° Customer Ledger & Controls"
                        >
                          <Users className="w-3.5 h-3.5" />
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
                const isPolygon = dep.network === 'POLYGON';
                const explorerUrl = isTrc
                  ? `https://tronscan.org/#/transaction/${dep.senderTxid}`
                  : isPolygon
                  ? `https://polygonscan.com/tx/${dep.senderTxid}`
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
                          {dep.planType === 'custom_pool' || dep.amountUsd >= 10000 ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              <span>Custom Institutional Rig (${dep.amountUsd.toLocaleString()})</span>
                            </span>
                          ) : dep.planType === 'flash_48h' || dep.packageName.toLowerCase().includes('flash') ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3 text-rose-400" />
                              <span>48H Flash Node</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                              {dep.packageName} (VIP {dep.vipLevel})
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">
                            {dep.network}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{dep.createdAt}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">Amount:</span>
                              <span className="text-base font-black text-emerald-400 font-mono">
                                ${dep.amountUsd.toLocaleString()} USDT
                              </span>
                            </div>
                            {(dep.planType === 'custom_pool' || dep.amountUsd >= 10000) && (
                              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                                Rate: {dep.amountUsd >= 100000 ? '3.20%' : dep.amountUsd >= 50000 ? '3.00%' : dep.amountUsd >= 30000 ? '2.80%' : '2.60%'} Daily (~${(dep.amountUsd * (dep.amountUsd >= 100000 ? 0.032 : dep.amountUsd >= 50000 ? 0.03 : dep.amountUsd >= 30000 ? 0.028 : 0.026)).toFixed(2)}/day)
                              </span>
                            )}
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
      {/* TAB 4: KYC & INSTITUTIONAL COMPLIANCE CLEARANCE HUB           */}
      {/* ============================================================ */}
      {activeTab === 'kyc' && (
        <div className="space-y-5">
          {/* Top Compliance Overview Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0c1220] border border-cyan-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
                <span>Total Applications</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{kycSubmissions.length}</div>
              <div className="text-[11px] text-slate-400 font-mono">Client ID dossiers</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c1220] border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Pending Review</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {kycSubmissions.filter(k => k.status === 'pending').length}
              </div>
              <div className="text-[11px] text-amber-300/80 font-mono">Requires action</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c1220] border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span>Cleared & Verified</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {kycSubmissions.filter(k => k.status === 'verified').length}
              </div>
              <div className="text-[11px] text-emerald-400/80 font-mono">Full compliance</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c1220] border border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
                <span>Rejected / Flagged</span>
                <XCircle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {kycSubmissions.filter(k => k.status === 'rejected').length}
              </div>
              <div className="text-[11px] text-rose-400/80 font-mono">Resubmission asked</div>
            </div>
          </div>

          {/* KYC Submissions Toolbar & Filter */}
          <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold font-mono">Filter Status:</span>
              <div className="flex items-center gap-1.5">
                {(['pending', 'all', 'verified', 'rejected'] as const).map((filterOpt) => (
                  <button
                    key={filterOpt}
                    type="button"
                    onClick={() => setKycFilter(filterOpt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono uppercase transition-all cursor-pointer ${
                      kycFilter === filterOpt
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {filterOpt}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredKycSubmissions.length}</strong> of {kycSubmissions.length} submissions
            </div>
          </div>

          {/* Submissions List */}
          <div className="space-y-3">
            {filteredKycSubmissions.length === 0 ? (
              <div className="text-center py-12 rounded-3xl bg-[#0c1220] border border-slate-800 text-slate-500 text-xs font-mono space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-600" />
                <p>No KYC identity submissions matching the selected filter ({kycFilter.toUpperCase()}).</p>
              </div>
            ) : (
              filteredKycSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-3xl bg-[#0c1220] border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white">{sub.userName || 'Anonymous Client'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                            sub.status === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : sub.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {sub.status} • Tier {sub.requestedLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">{sub.userEmail} &bull; ID: {sub.userId}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectedKyc(sub)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Documents & Photos</span>
                      </button>

                      {sub.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApproveKYC?.(sub.id, 1)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20"
                            title="Approve Tier 1 Clearance ($50,000 / day)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Tier 1</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onApproveKYC?.(sub.id, 2)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-amber-500/20"
                            title="Approve Tier 2 Institutional Clearance (Unlimited)"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Approve Tier 2 (Inst.)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInspectedKyc(sub);
                              setShowKycRejectDialog(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Submission Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-sans block">Document Type:</span>
                      <span className="text-white font-bold capitalize">{sub.documentType}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-sans block">ID Number:</span>
                      <span className="text-amber-300 font-bold truncate block">{sub.idNumber}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-sans block">Country of Issue:</span>
                      <span className="text-slate-200">{sub.country}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-sans block">Submitted:</span>
                      <span className="text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Document Thumbnails */}
                  <div className="flex items-center gap-3 pt-1 overflow-x-auto">
                    {sub.frontDocUrl && (
                      <div
                        onClick={() => setInspectedKyc(sub)}
                        className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 cursor-pointer flex items-center gap-2 group transition-all shrink-0"
                      >
                        <img
                          src={sub.frontDocUrl}
                          alt="Front ID"
                          referrerPolicy="no-referrer"
                          className="w-12 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800"
                        />
                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-cyan-300 pr-2">Front ID</span>
                      </div>
                    )}

                    {sub.backDocUrl && (
                      <div
                        onClick={() => setInspectedKyc(sub)}
                        className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 cursor-pointer flex items-center gap-2 group transition-all shrink-0"
                      >
                        <img
                          src={sub.backDocUrl}
                          alt="Back ID"
                          referrerPolicy="no-referrer"
                          className="w-12 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800"
                        />
                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-cyan-300 pr-2">Back ID</span>
                      </div>
                    )}

                    {sub.selfieDocUrl && (
                      <div
                        onClick={() => setInspectedKyc(sub)}
                        className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 cursor-pointer flex items-center gap-2 group transition-all shrink-0"
                      >
                        <img
                          src={sub.selfieDocUrl}
                          alt="Selfie"
                          referrerPolicy="no-referrer"
                          className="w-12 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800"
                        />
                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-cyan-300 pr-2">Live Selfie</span>
                      </div>
                    )}
                  </div>

                  {sub.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                      <strong>Rejection Reason:</strong> {sub.rejectionReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: INSTANT BALANCE / BONUS INJECTOR & PROMO CODES HUB     */}
      {/* ============================================================ */}
      {activeTab === 'bonuses' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form 1: Instant Balance & Yield Multiplier Injector */}
            <div className="p-6 rounded-3xl bg-[#0c1220] border border-emerald-500/30 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Instant Balance / Profit Injector</h3>
                  <p className="text-xs text-slate-400 font-mono">Credit custom USDT amounts & profit rate boosts directly to user accounts</p>
                </div>
              </div>

              <form onSubmit={handleExecuteGlobalBonus} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 font-mono mb-1">Target Client Recipient:</label>
                  <select
                    value={bonusTargetUserId}
                    onChange={(e) => setBonusTargetUserId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Choose Target Client --</option>
                    <option value="ALL_USERS">🌟 ALL REGISTERED CLIENTS ({registeredUsers.length} Users Batch Grant)</option>
                    {registeredUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email} ({u.email}) - VIP {u.vipLevel || 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 font-mono mb-1">USDT Credit ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bonusInjectAmount}
                      onChange={(e) => setBonusInjectAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 font-mono mb-1">Daily Yield Boost (+%):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="15"
                      value={bonusYieldBoostPct}
                      onChange={(e) => setBonusYieldBoostPct(e.target.value)}
                      placeholder="e.g. 0.5"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 font-mono mb-1">Grant Reason / Memo:</label>
                  <input
                    type="text"
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    placeholder="e.g. Institutional VIP Deposit Incentive"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isExecutingGlobalBonus}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isExecutingGlobalBonus ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Injecting Funds...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Execute Balance / Profit Injection</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Form 2: Promo Code Generator & Redemptions */}
            <div className="p-6 rounded-3xl bg-[#0c1220] border border-cyan-500/30 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Promo Code Generator</h3>
                  <p className="text-xs text-slate-400 font-mono">Create redeemable coupon vouchers for client acquisition</p>
                </div>
              </div>

              <form onSubmit={handleCreatePromoCode} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 font-mono mb-1">Coupon Code:</label>
                    <input
                      type="text"
                      placeholder="e.g. VIP-BOOST-500"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-cyan-300 uppercase focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 font-mono mb-1">Reward Type:</label>
                    <select
                      value={newPromoType}
                      onChange={(e) => setNewPromoType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="bonus_usdt">💵 USDT Balance Credit</option>
                      <option value="yield_boost_pct">⚡ +% Daily Yield Boost</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 font-mono mb-1">Reward Value:</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={newPromoAmount}
                      onChange={(e) => setNewPromoAmount(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 font-mono mb-1">Description:</label>
                    <input
                      type="text"
                      value={newPromoDesc}
                      onChange={(e) => setNewPromoDesc(e.target.value)}
                      placeholder="e.g. VIP Mining Grant"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  <span>Create & Activate Promo Code</span>
                </button>
              </form>
            </div>
          </div>

          {/* Active Promo Codes List */}
          <div className="p-6 rounded-3xl bg-[#0c1220] border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>Active Promo Codes & Voucher Vouchers ({promoCodes.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {promoCodes.length === 0 ? (
                <div className="col-span-full text-center py-6 text-slate-500 text-xs font-mono">
                  No promo codes generated yet. Use the creator above to generate coupon codes.
                </div>
              ) : (
                promoCodes.map((promo) => (
                  <div
                    key={promo.code}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-cyan-300 tracking-wider">{promo.code}</span>
                      <button
                        type="button"
                        onClick={() => handleTogglePromoCode(promo.code)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          promo.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {promo.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>{promo.type === 'bonus_usdt' ? `$${promo.value} USDT Balance` : `+${promo.value}% Daily Yield`}</span>
                      <span>{promo.usedCount || 0} / {promo.maxUses || 50} Redeemed</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(promo.code, `promo-${promo.code}`)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `promo-${promo.code}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePromoCode(promo.code)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historic Bonus Adjustments Audit Trail */}
          <div className="p-6 rounded-3xl bg-[#0c1220] border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Administrative Bonus & Yield Injection Ledger</span>
            </h3>

            <div className="space-y-2">
              {bonusHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-mono">
                  No bonus adjustments logged in this session yet.
                </div>
              ) : (
                bonusHistory.map((bh) => (
                  <div key={bh.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        🎁
                      </span>
                      <div>
                        <div className="font-bold text-white">{bh.userName} &bull; <span className="text-emerald-400">+${bh.amountUsd} USDT</span> {bh.yieldBoostPercent ? `• +${bh.yieldBoostPercent}% yield` : ''}</div>
                        <div className="text-[11px] text-slate-400">{bh.reason} &bull; {new Date(bh.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border border-slate-800">
                      {bh.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 6: GLOBAL ANNOUNCEMENT BAR & SITEWIDE BROADCAST          */}
      {/* ============================================================ */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          
          {announcementSavedToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Announcement updated and broadcasted sitewide to all active users & visitors!</span>
            </div>
          )}

          {/* Announcement Live Preview Card */}
          <div className="rounded-3xl bg-[#0d1424] border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Live Client View Preview</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                announcementState.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {announcementState.isActive ? 'Status: Broadcasting LIVE' : 'Status: Inactive / Hidden'}
              </span>
            </div>

            {/* Simulated Banner */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono ${
              announcementState.type === 'warning'
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                : announcementState.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : announcementState.type === 'alert'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                : 'bg-[#0e1d3a] border-cyan-500/30 text-cyan-100'
            }`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 border border-white/20">
                  {announcementState.title || 'ANNOUNCEMENT'}
                </span>
                <span className="truncate">{announcementState.message || 'No message configured yet.'}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">✕</span>
            </div>
          </div>

          {/* Announcement Edit Form */}
          <div className="rounded-3xl bg-[#0d1424] border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Broadcast Announcement Configuration</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Control sitewide header notifications in real-time</p>
                </div>
              </div>

              {/* Active Toggle */}
              <button
                type="button"
                onClick={() => setAnnouncementState(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                  announcementState.isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${announcementState.isActive ? 'animate-pulse' : ''}`} />
                <span>{announcementState.isActive ? 'BROADCASTING: ON' : 'DISABLED: OFF'}</span>
              </button>
            </div>

            {/* Quick 1-Click Preset Templates */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 font-mono">Quick Preset Templates (1-Click Fill):</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    title: 'ETH 2.0 HARDFORK',
                    msg: '⚡ Ethereum 2.0 Hardfork Node Upgrade Complete across all mining pools. Direct TRC-20 & ERC-20 zero-fee payouts enabled.',
                    type: 'info' as const
                  },
                  {
                    title: 'SECURITY UPDATE',
                    msg: '🛡️ Account Security Notice: Whitelist your TRC-20 / ERC-20 payout wallet address to prevent unauthorized withdrawals.',
                    type: 'warning' as const
                  },
                  {
                    title: 'VIP HASHRATE BOOST',
                    msg: '🔥 Limited Time Promotion: 48-Hour Flash Mining Contracts activated with guaranteed 10% to 25% instant yields!',
                    type: 'success' as const
                  },
                  {
                    title: 'MAINTENANCE NOTICE',
                    msg: '⚙️ Zero-Downtime Scheduled Maintenance: Smart contract settlement engine optimized for faster sub-second payouts.',
                    type: 'alert' as const
                  }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAnnouncementState(prev => ({
                        ...prev,
                        title: preset.title,
                        message: preset.msg,
                        type: preset.type
                      }));
                    }}
                    className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 group-hover:text-amber-400 font-mono">
                      <span>{preset.title}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{preset.type}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{preset.msg}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono font-bold">Badge Title / Tag:</label>
                <input
                  type="text"
                  placeholder="e.g. SYSTEM UPDATE"
                  value={announcementState.title}
                  onChange={(e) => setAnnouncementState(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono font-bold">Visual Alert Style:</label>
                <select
                  value={announcementState.type}
                  onChange={(e: any) => setAnnouncementState(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="info">Cyan Info (Default Announcement)</option>
                  <option value="warning">Amber Warning (Important Notice)</option>
                  <option value="success">Emerald Success (Promo / Rewards)</option>
                  <option value="alert">Rose Alert (Urgent Security / Maintenance)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono font-bold">Target Audience:</label>
                <select
                  value={announcementState.targetAudience || 'all'}
                  onChange={(e: any) => setAnnouncementState(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Visitors & Miners (Public)</option>
                  <option value="miners">Active Cloud Miners Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono font-bold">Announcement Message Body:</label>
              <textarea
                rows={3}
                placeholder="Enter sitewide banner message here..."
                value={announcementState.message}
                onChange={(e) => setAnnouncementState(prev => ({ ...prev, message: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submit / Save Broadcast Button */}
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('hashforge_global_announcement', JSON.stringify(announcementState));
                if (onSaveAnnouncement) {
                  onSaveAnnouncement(announcementState);
                }
                setAnnouncementSavedToast(true);
                setTimeout(() => setAnnouncementSavedToast(false), 3500);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Save & Broadcast Announcement Sitewide</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: SUPABASE DATABASE 7-TABLE HUB & CREDENTIAL VAULTS     */}
      {/* ============================================================ */}
      {activeTab === 'email_config' && (
        <div className="space-y-6">
          {/* Section 1: Live Supabase 7-Table Database Health */}
          <div className="p-6 rounded-3xl bg-[#0c1220] border border-slate-800 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Supabase Cloud Database & Tables Hub</h2>
                  <p className="text-xs text-slate-400 font-mono">Live synchronization across all 7 structured entity tables & credential vault folders</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadTableStats}
                  disabled={isLoadingStats}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  <span>{isLoadingStats ? 'Checking...' : 'Refresh Tables'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
                    setCopiedKey('sql_setup');
                    setTimeout(() => setCopiedKey(null), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {copiedKey === 'sql_setup' ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sql_setup' ? 'SQL Script Copied!' : 'Copy 7-Table SQL Schema'}</span>
                </button>
              </div>
            </div>

            {/* 7-Tables Visual Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {/* Table 1: clients */}
              <div className="p-3.5 rounded-2xl bg-[#070d19] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="font-mono text-amber-400">1. clients</span>
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {tableStats?.clientsCount ?? registeredUsers.length}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  User accounts & VIP tiers
                </div>
                <div className="pt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Syncing Live</span>
                </div>
              </div>

              {/* Table 2: deposits */}
              <div className="p-3.5 rounded-2xl bg-[#070d19] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="font-mono text-emerald-400">2. deposits</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {tableStats?.depositsCount ?? deposits.length}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  Invoices & sender TxIDs
                </div>
                <div className="pt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Syncing Live</span>
                </div>
              </div>

              {/* Table 3: withdrawals */}
              <div className="p-3.5 rounded-2xl bg-[#070d19] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="font-mono text-purple-400">3. withdrawals</span>
                  <Wallet className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {tableStats?.withdrawalsCount ?? withdrawalRecords.length}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  Payouts & Tx hashes
                </div>
                <div className="pt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Syncing Live</span>
                </div>
              </div>

              {/* Table 4: mining_contracts */}
              <div className="p-3.5 rounded-2xl bg-[#070d19] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="font-mono text-cyan-400">4. mining_contracts</span>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {tableStats?.contractsCount ?? 0}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  Rig leases & rewards
                </div>
                <div className="pt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Active</span>
                </div>
              </div>

              {/* Table 5: announcements */}
              <div className="p-3.5 rounded-2xl bg-[#070d19] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="font-mono text-amber-300">5. announcements</span>
                  <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {tableStats?.announcementsCount ?? 1}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  Broadcast banners
                </div>
                <div className="pt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Active</span>
                </div>
              </div>

              {/* Table 6: client_credentials (Folder 1: Original Passwords) */}
              <div className="p-3.5 rounded-2xl bg-[#0a1224] border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="font-mono text-amber-400">6. client_credentials</span>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-black text-amber-400 font-mono">
                  {tableStats?.credentialsCount ?? credentialsVault.length}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  Original Signup Passwords
                </div>
                <div className="pt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Vault Folder 1</span>
                </div>
              </div>

              {/* Table 7: client_onchain_keys (Folder 2: Original Onchain Keys) */}
              <div className="p-3.5 rounded-2xl bg-[#0a1224] border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="font-mono text-cyan-400">7. client_onchain_keys</span>
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-black text-cyan-400 font-mono">
                  {tableStats?.onchainKeysCount ?? onchainKeysVault.length}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  Original Onchain Security Keys
                </div>
                <div className="pt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Vault Folder 2</span>
                </div>
              </div>
            </div>

            {/* SQL Execution Guide Alert */}
            <div className="p-4 rounded-2xl bg-[#080e1c] border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5 font-mono text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>How to apply the complete 7-table schema in Supabase in 30 seconds:</span>
                </span>
                <a
                  href="https://supabase.com/dashboard/project/bnyjkevubfncpkbnbacv/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1"
                >
                  <span>Open Supabase SQL Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                Click <strong>"Copy 7-Table SQL Schema"</strong> above, open the Supabase SQL Editor link, paste the script and click <strong>RUN</strong>. This creates all 7 tables with automatic user trigger synchronization, dedicated credential vaults (`client_credentials` &amp; `client_onchain_keys`), and open Row-Level Security policies.
              </p>
            </div>
          </div>

          {/* Section: Fix 404 Gmail Confirmation Link / Supabase URL Configuration */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c1322] to-[#111a30] border-2 border-amber-500/40 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">Fix Gmail Confirmation Link 404 Error (URL Configuration)</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Required for Email Links
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 font-mono">
                    Why 404 happens: Supabase default Site URL is set to `localhost:3000`. Update it in Supabase Dashboard to your live app URL!
                  </p>
                </div>
              </div>

              <a
                href="https://supabase.com/dashboard/project/bnyjkevubfncpkbnbacv/auth/url-configuration"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 transition-all shrink-0"
              >
                <span>Open Supabase URL Config</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
              </a>
            </div>

            {/* Step-by-Step Fix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-[#080d19] border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>Step 1: Set Site URL</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px]">Site URL</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  In Supabase Dashboard &rarr; <strong>Authentication &rarr; URL Configuration</strong>, paste this in <strong>Site URL</strong>:
                </p>
                <div className="flex items-center gap-1.5 bg-[#0b101c] p-2 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-emerald-400 select-all truncate flex-1 font-mono">
                    https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app', 'site_url')}
                    className="text-slate-400 hover:text-amber-300 p-1 cursor-pointer"
                    title="Copy Site URL"
                  >
                    {copiedKey === 'site_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-[#080d19] border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between text-cyan-400 font-bold">
                  <span>Step 2: Add Redirect URLs</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[10px]">Redirects</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Under <strong>Redirect URLs</strong>, click <em>Add URL</em> and add this wildcard pattern:
                </p>
                <div className="flex items-center gap-1.5 bg-[#0b101c] p-2 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-cyan-300 select-all truncate flex-1 font-mono">
                    https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app/**
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app/**', 'redirect_url')}
                    className="text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                    title="Copy Redirect URL"
                  >
                    {copiedKey === 'redirect_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-[#080d19] border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Step 3: Instant Signup Mode</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px]">Optional</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  To allow clients to login <strong>immediately without clicking Gmail</strong>:
                </p>
                <div className="p-2 rounded-lg bg-[#0b101c] border border-slate-700 text-[10px] text-slate-300 space-y-1">
                  <div>1. Go to <strong>Authentication &rarr; Providers &rarr; Email</strong></div>
                  <div>2. Turn OFF <strong>"Confirm email"</strong> toggle</div>
                  <div>3. Click <strong>Save</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Supabase Credential Vaults Direct Inspector */}
          <div className="p-6 rounded-3xl bg-[#0c1220] border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Client Original Credentials Vault Folders (Live Direct View)</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Accurate original signup passwords &amp; onchain keys stored in dedicated `client_credentials` and `client_onchain_keys` tables
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search vault email or key..."
                    value={vaultSearchQuery}
                    onChange={(e) => setVaultSearchQuery(e.target.value)}
                    className="w-full bg-[#121c33] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Credential Vault Table */}
            <div className="rounded-2xl bg-[#070d19] border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-3 bg-[#0f172a] border-b border-slate-800 text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider gap-2">
                <div className="col-span-4">Client Email / ID</div>
                <div className="col-span-4">Original Password (`client_credentials`)</div>
                <div className="col-span-4">Original Onchain Key (`client_onchain_keys`)</div>
              </div>

              <div className="divide-y divide-slate-800/60 max-h-[40vh] overflow-y-auto">
                {registeredUsers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    No client records found. Register accounts on the frontend or sync with Supabase.
                  </div>
                ) : (
                  registeredUsers
                    .filter((u) => {
                      if (!vaultSearchQuery) return true;
                      const q = vaultSearchQuery.toLowerCase();
                      return (
                        u.email?.toLowerCase().includes(q) ||
                        u.name?.toLowerCase().includes(q) ||
                        u.onchainKey?.toLowerCase().includes(q)
                      );
                    })
                    .map((user, idx) => {
                      const email = user.email || '';
                      const pwd = user.password || '';
                      const onchain = user.onchainKey || '';
                      const isRevealed = revealedPasswords[email] ?? true;

                      return (
                        <div
                          key={`vault-row-${user.id || email || idx}`}
                          className="grid grid-cols-12 px-4 py-3 text-xs items-center hover:bg-slate-900/50 transition-colors gap-2"
                        >
                          {/* Client Email & Name */}
                          <div className="col-span-4 min-w-0">
                            <div className="font-bold text-white truncate text-xs">{user.name || 'Unnamed Client'}</div>
                            <div className="text-[11px] text-amber-400 font-mono truncate">{email}</div>
                          </div>

                          {/* Original Password */}
                          <div className="col-span-4 min-w-0">
                            <div className="flex items-center gap-1.5 bg-[#0b101c] px-2.5 py-1.5 rounded-lg border border-slate-800">
                              <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                              <div className="font-mono text-[11px] truncate flex-1">
                                {pwd ? (
                                  <span className={isRevealed ? 'text-amber-300 font-bold select-all' : 'text-slate-500 tracking-widest'}>
                                    {isRevealed ? pwd : '••••••••'}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic text-[10px]">No password stored</span>
                                )}
                              </div>
                              {pwd && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleRevealPassword(email)}
                                    className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                                    title={isRevealed ? 'Hide' : 'Show'}
                                  >
                                    {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(pwd, `vault-pwd-${email}`)}
                                    className="text-slate-400 hover:text-amber-300 cursor-pointer p-0.5"
                                    title="Copy original password"
                                  >
                                    {copiedKey === `vault-pwd-${email}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Original Onchain Key */}
                          <div className="col-span-4 min-w-0">
                            <div className="flex items-center gap-1.5 bg-[#0b101c] px-2.5 py-1.5 rounded-lg border border-slate-800">
                              <KeyRound className="w-3 h-3 text-cyan-400 shrink-0" />
                              <div className="font-mono text-[10px] text-cyan-300 font-semibold truncate flex-1 select-all">
                                {onchain || <span className="text-slate-500 italic font-sans">No key generated</span>}
                              </div>
                              {onchain && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(onchain, `vault-key-${email}`)}
                                  className="text-slate-400 hover:text-cyan-300 cursor-pointer p-0.5"
                                  title="Copy onchain security key"
                                >
                                  {copiedKey === `vault-key-${email}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Email Activation & Site URL Configuration */}
          <div className="p-5 rounded-3xl bg-[#0e1628] border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-white">Supabase Email Activation & Redirect URL Setup</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When a client registers, Supabase sends an email confirmation link. If the <strong>Site URL</strong> in your Supabase project dashboard is set to the old Vercel deployment URL, users clicking the email link will be redirected to Vercel instead of this live app. Follow the simple 2-step setup below to fix this permanently.
                </p>
              </div>
            </div>

            {/* Quick Action Button to Open Supabase Dashboard */}
            <div className="pt-2">
              <a
                href="https://supabase.com/dashboard/project/bnyjkevubfncpkbnbacv/auth/url-configuration"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>Open Supabase Auth URL Configuration</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Configuration Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Site URL */}
            <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Step 1: Set Site URL
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Supabase Auth</span>
              </div>
              <h3 className="text-sm font-bold text-white">Primary Site URL (Replaces Vercel)</h3>
              <p className="text-xs text-slate-400">
                In Supabase Dashboard &rarr; Authentication &rarr; URL Configuration, paste this in the <strong>Site URL</strong> field:
              </p>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-amber-400">
                <span className="truncate flex-1">https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app');
                    setCopiedKey('site_url');
                    setTimeout(() => setCopiedKey(null), 2000);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'site_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'site_url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Redirect URLs */}
            <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Step 2: Add Redirect URLs
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Wildcard Whitelist</span>
              </div>
              <h3 className="text-sm font-bold text-white">Allowed Redirect URLs</h3>
              <p className="text-xs text-slate-400">
                Add these entries into the <strong>Redirect URLs</strong> list in Supabase so activation links never fail:
              </p>
              
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                  <span className="truncate">https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app/**</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app/**');
                      setCopiedKey('red_1');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'red_1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                  <span className="truncate">https://ais-dev-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app/**</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://ais-dev-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app/**');
                      setCopiedKey('red_2');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'red_2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Email Template Check Note */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Email Confirmation Template in Supabase</span>
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              In Supabase Dashboard &rarr; Authentication &rarr; Email Templates &rarr; <strong>Confirm signup</strong>: make sure the confirmation button link uses <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded font-mono">{'{{ .ConfirmationURL }}'}</code>. Supabase will automatically attach the verification token and route the client back to this applet.
            </p>
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
          onInjectBonus={onInjectBonus}
          onUpdateKYCStatus={(userId, status, tier, reason) => {
            const sub = kycSubmissions.find(k => k.userId === userId);
            if (status === 'verified') {
              if (sub && onApproveKYC) onApproveKYC(sub.id, tier);
            } else if (status === 'rejected') {
              if (sub && onRejectKYC) onRejectKYC(sub.id, reason || 'Compliance rejection');
            }
          }}
        />
      )}

      {/* ============================================================ */}
      {/* KYC DOCUMENT INSPECTION MODAL                                */}
      {/* ============================================================ */}
      {inspectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0c1220] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{inspectedKyc.userName} — KYC Dossier</h3>
                  <p className="text-xs text-slate-400 font-mono">{inspectedKyc.userEmail} &bull; Country: {inspectedKyc.country}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedKyc(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            {/* Dossier Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Doc Type</span>
                <span className="text-white font-bold capitalize">{inspectedKyc.documentType}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ID Number</span>
                <span className="text-amber-300 font-bold">{inspectedKyc.idNumber}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Requested Tier</span>
                <span className="text-cyan-300 font-bold">Tier {inspectedKyc.requestedLevel}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Status</span>
                <span className={`font-bold uppercase ${inspectedKyc.status === 'verified' ? 'text-emerald-400' : inspectedKyc.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {inspectedKyc.status}
                </span>
              </div>
            </div>

            {/* Image Attachments */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 font-mono">Submitted Document Photos & Biometrics:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Front Photo */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 font-bold block">1. Front Document</span>
                  {inspectedKyc.frontDocUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group relative">
                      <img
                        src={inspectedKyc.frontDocUrl}
                        alt="Front Document"
                        referrerPolicy="no-referrer"
                        className="w-full h-36 object-cover"
                      />
                      <a
                        href={inspectedKyc.frontDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-mono font-bold transition-all"
                      >
                        Open Full Image ↗
                      </a>
                    </div>
                  ) : (
                    <div className="h-36 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-600 font-mono">
                      Not uploaded
                    </div>
                  )}
                </div>

                {/* Back Photo */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 font-bold block">2. Back Document</span>
                  {inspectedKyc.backDocUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group relative">
                      <img
                        src={inspectedKyc.backDocUrl}
                        alt="Back Document"
                        referrerPolicy="no-referrer"
                        className="w-full h-36 object-cover"
                      />
                      <a
                        href={inspectedKyc.backDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-mono font-bold transition-all"
                      >
                        Open Full Image ↗
                      </a>
                    </div>
                  ) : (
                    <div className="h-36 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-600 font-mono">
                      Not uploaded
                    </div>
                  )}
                </div>

                {/* Live Selfie */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 font-bold block">3. Live Selfie with ID</span>
                  {inspectedKyc.selfieDocUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group relative">
                      <img
                        src={inspectedKyc.selfieDocUrl}
                        alt="Selfie"
                        referrerPolicy="no-referrer"
                        className="w-full h-36 object-cover"
                      />
                      <a
                        href={inspectedKyc.selfieDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-mono font-bold transition-all"
                      >
                        Open Full Image ↗
                      </a>
                    </div>
                  ) : (
                    <div className="h-36 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-600 font-mono">
                      Not uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectedKyc(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowKycRejectDialog(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Application</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApproveKYC?.(inspectedKyc.id, 1);
                    setInspectedKyc(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Tier 1 ($50k/d)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApproveKYC?.(inspectedKyc.id, 2);
                    setInspectedKyc(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Award className="w-4 h-4" />
                  <span>Approve Tier 2 (Unlimited)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* KYC REJECTION REASON DIALOG                                  */}
      {/* ============================================================ */}
      {showKycRejectDialog && inspectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0c1220] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Reject KYC Dossier</h3>
                <p className="text-xs text-rose-300/80 font-mono">{inspectedKyc.userName} ({inspectedKyc.userEmail})</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 font-mono block">Rejection / Resubmission Reason:</label>
              <textarea
                rows={3}
                value={kycRejectReasonInput}
                onChange={(e) => setKycRejectReasonInput(e.target.value)}
                placeholder="e.g. Document photo is blurry or selfie did not match passport."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowKycRejectDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  onRejectKYC?.(inspectedKyc.id, kycRejectReasonInput.trim() || 'Document verification failed.');
                  setShowKycRejectDialog(false);
                  setInspectedKyc(null);
                  setKycRejectReasonInput('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer transition-all shadow-lg shadow-rose-600/30"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
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
