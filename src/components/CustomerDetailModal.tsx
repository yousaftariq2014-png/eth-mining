import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Key,
  KeyRound,
  Eye,
  EyeOff,
  Edit2,
  Save,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Zap,
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Calendar,
  Activity,
  AlertTriangle,
  Flame,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  PlusCircle,
  Sparkles,
  Gift,
  Award,
  Sliders
} from 'lucide-react';
import { AggregatedCustomerData } from '../utils/adminCustomerMetrics';
import { UserProfile, DepositRequest, BonusAdjustment, KYCStatus, KYCLevel } from '../types';
import { 
  getClientCredentials, 
  updateClientCredentials, 
  ensureCustomerCredentials, 
  insertSupabaseDeposit 
} from '../lib/supabaseClient';
import { MINING_PACKAGES, DAILY_PACKAGES, FLASH_48H_PACKAGES } from '../data/packagesData';

interface CustomerDetailModalProps {
  customer: AggregatedCustomerData;
  onClose: () => void;
  onApproveDeposit?: (depositId: string) => void;
  onRejectDeposit?: (depositId: string) => void;
  onApproveWithdrawal?: (withdrawalId: string) => void;
  onRejectWithdrawal?: (withdrawalId: string) => void;
  onDeleteClient?: (userId: string, email: string) => void;
  onUpdateUser?: (user: UserProfile) => void;
  onInjectBonus?: (bonus: BonusAdjustment) => void;
  onUpdateKYCStatus?: (userId: string, status: KYCStatus, tier: KYCLevel, reason?: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  onApproveDeposit,
  onRejectDeposit,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onDeleteClient,
  onUpdateUser,
  onInjectBonus,
  onUpdateKYCStatus,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'deposits' | 'withdrawals'>('overview');
  
  // Credentials management - guaranteed active credentials
  const initialCreds = ensureCustomerCredentials(
    customer.user.email,
    customer.user.id,
    customer.user.password,
    customer.user.onchainKey
  );

  const [currentOnchainKey, setCurrentOnchainKey] = useState<string>(initialCreds.onchainKey);
  const [currentPassword, setCurrentPassword] = useState<string>(initialCreds.password);
  const [showPassword, setShowPassword] = useState<boolean>(true);
  
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [editKeyInput, setEditKeyInput] = useState<string>(initialCreds.onchainKey);
  
  const [isEditingPass, setIsEditingPass] = useState<boolean>(false);
  const [editPassInput, setEditPassInput] = useState<string>(initialCreds.password);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Bonus & Profit Injector State
  const [showBonusModal, setShowBonusModal] = useState<boolean>(false);
  const [bonusAmountInput, setBonusAmountInput] = useState<string>('250');
  const [bonusTypeInput, setBonusTypeInput] = useState<'bonus_credit' | 'yield_boost' | 'manual_credit' | 'promo_reward'>('bonus_credit');
  const [yieldBoostInput, setYieldBoostInput] = useState<string>('0.5');
  const [bonusReasonInput, setBonusReasonInput] = useState<string>('Executive VIP Welcome Bonus');
  const [isInjectingBonus, setIsInjectingBonus] = useState<boolean>(false);

  // KYC Management State
  const [showKycEditModal, setShowKycEditModal] = useState<boolean>(false);
  const [kycStatusSelect, setKycStatusSelect] = useState<KYCStatus>(customer.user.kycStatus || 'verified');
  const [kycLevelSelect, setKycLevelSelect] = useState<KYCLevel>(customer.user.kycLevel || 1);
  const [kycReasonInput, setKycReasonInput] = useState<string>('');
  const [isUpdatingKyc, setIsUpdatingKyc] = useState<boolean>(false);

  // Direct package activation state
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assigningPackageId, setAssigningPackageId] = useState<string>('vip1');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Synchronize when customer changes
  useEffect(() => {
    const creds = ensureCustomerCredentials(
      customer.user.email,
      customer.user.id,
      customer.user.password,
      customer.user.onchainKey
    );
    setCurrentPassword(creds.password);
    setCurrentOnchainKey(creds.onchainKey);
    setEditPassInput(creds.password);
    setEditKeyInput(creds.onchainKey);
  }, [customer.user.email, customer.user.password, customer.user.onchainKey, customer.user.id]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveOnchainKey = async () => {
    const cleanKey = editKeyInput.trim();
    if (!cleanKey) return;
    
    setCurrentOnchainKey(cleanKey);
    setIsEditingKey(false);

    const updatedUser: UserProfile = {
      ...customer.user,
      onchainKey: cleanKey,
      password: currentPassword,
    };

    customer.user.onchainKey = cleanKey;
    await updateClientCredentials(customer.user.id, customer.user.email, currentPassword, cleanKey);
    onUpdateUser?.(updatedUser);

    setSaveSuccessMsg('Onchain Key updated and synchronized with database!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSavePassword = async () => {
    const cleanPass = editPassInput.trim();
    if (!cleanPass) return;

    setCurrentPassword(cleanPass);
    setIsEditingPass(false);

    const updatedUser: UserProfile = {
      ...customer.user,
      password: cleanPass,
      onchainKey: currentOnchainKey,
    };

    customer.user.password = cleanPass;
    await updateClientCredentials(customer.user.id, customer.user.email, cleanPass, currentOnchainKey);
    onUpdateUser?.(updatedUser);

    setSaveSuccessMsg('Account Password updated and saved for user!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleAssignPackage = async () => {
    const targetPkg = MINING_PACKAGES.find(p => p.id === assigningPackageId) || MINING_PACKAGES[0];
    setIsAssigning(true);

    try {
      const nowIso = new Date().toISOString();
      const depositId = `dep-admin-${Date.now()}`;
      const newDeposit: DepositRequest = {
        id: depositId,
        userId: customer.user.id,
        userName: customer.user.name || customer.user.email,
        packageId: targetPkg.id,
        packageName: targetPkg.name,
        vipLevel: targetPkg.vipLevel,
        amountUsd: targetPkg.priceUsd,
        network: 'TRC20',
        depositAddress: 'Admin Direct Assigned Node',
        senderTxid: `ADMIN-GRANT-${Date.now().toString(36).toUpperCase()}`,
        status: 'approved',
        createdAt: nowIso,
        approvedAt: nowIso,
      };

      await insertSupabaseDeposit(newDeposit);
      
      const updatedUser: UserProfile = {
        ...customer.user,
        plan: `VIP ${targetPkg.vipLevel} (${targetPkg.name})`,
        vipLevel: targetPkg.vipLevel,
      };

      onUpdateUser?.(updatedUser);
      onApproveDeposit?.(depositId);

      setSaveSuccessMsg(`VIP ${targetPkg.vipLevel} (${targetPkg.name}) successfully activated for ${customer.user.name || customer.user.email}!`);
      setShowAssignModal(false);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e: any) {
      alert('Failed to assign package: ' + (e?.message || 'Error'));
    } finally {
      setIsAssigning(false);
    }
  };

  // Execute Bonus & Yield Boost Injection
  const handleExecuteBonusInjection = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bonusAmountInput) || 0;
    const yieldBoost = parseFloat(yieldBoostInput) || 0;
    
    if (amount <= 0 && yieldBoost <= 0) {
      alert('Please enter a valid bonus amount in USDT or a yield boost percentage.');
      return;
    }

    setIsInjectingBonus(true);
    try {
      const nowIso = new Date().toISOString();
      const bonusRecord: BonusAdjustment = {
        id: `bonus-${customer.user.id}-${Date.now()}`,
        userId: customer.user.id,
        userName: customer.user.name || customer.user.email,
        type: bonusTypeInput,
        amountUsd: amount,
        yieldBoostPercent: yieldBoost,
        reason: bonusReasonInput.trim() || 'Admin Discretionary Bonus',
        createdAt: nowIso,
      };

      // Also create an auto-approved deposit record for balance injection if amount > 0
      if (amount > 0) {
        const bonusDeposit: DepositRequest = {
          id: `bonus-dep-${Date.now()}`,
          userId: customer.user.id,
          userName: customer.user.name || customer.user.email,
          userEmail: customer.user.email,
          packageId: 'custom-bonus',
          packageName: `🎁 Balance Credit: ${bonusRecord.reason}`,
          vipLevel: customer.user.vipLevel || 0,
          amountUsd: amount,
          network: 'TRC20',
          depositAddress: '0xHashForgeSystemReserveHotVault',
          senderTxid: `SYSTEM-CREDIT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          status: 'approved',
          createdAt: nowIso,
          approvedAt: nowIso,
        };
        await insertSupabaseDeposit(bonusDeposit);
        customer.deposits.push(bonusDeposit);
      }

      const updatedUser: UserProfile = {
        ...customer.user,
        bonusUsdtBalance: (customer.user.bonusUsdtBalance || 0) + amount,
        customYieldBonusPercent: (customer.user.customYieldBonusPercent || 0) + yieldBoost,
      };

      // Update storage
      try {
        const historyKey = 'hashforge_bonus_adjustments';
        const saved: BonusAdjustment[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
        saved.unshift(bonusRecord);
        localStorage.setItem(historyKey, JSON.stringify(saved));
      } catch {}

      onInjectBonus?.(bonusRecord);
      onUpdateUser?.(updatedUser);

      setSaveSuccessMsg(`Successfully injected $${amount.toFixed(2)} USDT & +${yieldBoost.toFixed(2)}% Daily Yield Boost for ${customer.user.name || customer.user.email}!`);
      setShowBonusModal(false);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Bonus injection error: ' + (err?.message || 'Failed'));
    } finally {
      setIsInjectingBonus(false);
    }
  };

  // Execute KYC Verification Status Update
  const handleExecuteKycUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingKyc(true);
    try {
      const updatedUser: UserProfile = {
        ...customer.user,
        kycStatus: kycStatusSelect,
        kycLevel: kycLevelSelect,
      };

      onUpdateKYCStatus?.(customer.user.id, kycStatusSelect, kycLevelSelect, kycReasonInput);
      onUpdateUser?.(updatedUser);

      setSaveSuccessMsg(`KYC Status updated to "${kycStatusSelect.toUpperCase()}" (Tier ${kycLevelSelect}) for ${customer.user.name || customer.user.email}!`);
      setShowKycEditModal(false);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('KYC update error: ' + (err?.message || 'Failed'));
    } finally {
      setIsUpdatingKyc(false);
    }
  };

  const getVipColor = (level: number) => {
    switch (level) {
      case 5: return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 4: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 3: return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 2: return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default: return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0c1220] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#10182b] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0 shadow-lg shadow-amber-500/10">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-white truncate">{customer.user.name || 'Unnamed Client'}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${getVipColor(customer.computedVipLevel)}`}>
                  {customer.computedVipLevel > 0 ? `VIP ${customer.computedVipLevel}` : 'No Active Plan'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  customer.accountStatus === 'Active Miner'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : customer.accountStatus.includes('Pending')
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {customer.accountStatus}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span className="truncate">{customer.user.email}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(customer.user.email, 'email')}
                  className="hover:text-amber-300 transition-colors"
                  title="Copy email"
                >
                  {copiedKey === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#0e1626] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>360° Financials</span>
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'contracts'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Mining Nodes ({customer.activeContracts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'deposits'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Deposits ({customer.deposits.length})</span>
              {customer.pendingDeposits.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {customer.pendingDeposits.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'withdrawals'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdrawals ({customer.withdrawals.length})</span>
              {customer.pendingWithdrawals.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {customer.pendingWithdrawals.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBonusModal(true)}
              className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Inject instant USDT bonus or yield rate boost"
            >
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inject Bonus</span>
            </button>

            <button
              type="button"
              onClick={() => setShowKycEditModal(true)}
              className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Review and adjust KYC clearance level"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>KYC Level</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              title="Manually assign or upgrade VIP Mining Package for this client"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Activate Package</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const dossier = `CUSTOMER DOSSIER:
Name: ${customer.user.name}
Email: ${customer.user.email}
User ID: ${customer.user.id}
Account Password: ${currentPassword}
Onchain Key: ${currentOnchainKey}
VIP Tier: VIP ${customer.computedVipLevel}
KYC Status: ${customer.user.kycStatus || 'unverified'} (Tier ${customer.user.kycLevel || 1})
Bonus USDT Balance: $${(customer.user.bonusUsdtBalance || 0).toFixed(2)}
Custom Yield Boost: +${(customer.user.customYieldBonusPercent || 0).toFixed(2)}%/day
Total Deposited: $${customer.totalDepositedUsd.toFixed(2)} USDT
Active Mining Hashrate: ${customer.totalHashrate} TH/s
Total Accrued Profits: $${customer.totalAccruedProfitsUsd.toFixed(2)} USDT
Total Withdrawn: $${customer.totalWithdrawnUsd.toFixed(2)} USDT
Available Net Balance: $${customer.estimatedAvailableBalanceUsd.toFixed(2)} USDT
Primary Wallet: ${customer.primaryWalletAddress}`;
                copyToClipboard(dossier, 'dossier');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
              title="Copy formatted customer report to clipboard"
            >
              {copiedKey === 'dossier' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'dossier' ? 'Copied Report' : 'Copy Dossier'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Success Toast */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveSuccessMsg(null)}
                className="text-emerald-400 hover:text-emerald-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 1: 360° OVERVIEW */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Top Financial Stat Bento Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#121b2f] border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                    <span>Total Deposited</span>
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                    ${customer.totalDepositedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121b2f] border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                    <span>Live Hashrate</span>
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                    {customer.totalHashrate} <span className="text-xs">TH/s</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121b2f] border border-cyan-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400">
                    <span>Accrued Yield</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-cyan-300 font-mono">
                    ${customer.totalAccruedProfitsUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121b2f] border border-rose-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-rose-400">
                    <span>Total Withdrawn</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-rose-400 font-mono">
                    ${customer.totalWithdrawnUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121b2f] border border-purple-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-400">
                    <span>Net Balance</span>
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-purple-300 font-mono">
                    ${customer.estimatedAvailableBalanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#121b2f] border border-slate-700 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Daily Rate</span>
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white font-mono">
                    +${customer.totalDailyYieldUsd.toFixed(2)}<span className="text-xs text-slate-400">/d</span>
                  </div>
                </div>
              </div>

              {/* Identity & Technical Dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#10182b] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Authentication & Profile Metadata</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Admin Full Access
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs font-mono">
                    {/* User ID */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">User ID:</span>
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <span className="truncate max-w-[180px]">{customer.user.id}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(customer.user.id, 'userId')}
                          className="hover:text-amber-300 transition-colors cursor-pointer"
                          title="Copy User ID"
                        >
                          {copiedKey === 'userId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Registered Email */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">Registered Email:</span>
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <span className="truncate max-w-[180px]">{customer.user.email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(customer.user.email, 'email')}
                          className="hover:text-amber-200 transition-colors cursor-pointer text-slate-400"
                          title="Copy Email"
                        >
                          {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Account Password */}
                    <div className="p-2 rounded-xl bg-[#0c1220] border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>Account Password:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-0.5"
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentPassword, 'password')}
                            className="hover:text-amber-300 transition-colors cursor-pointer text-slate-400 p-0.5"
                            title="Copy Password"
                          >
                            {copiedKey === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditPassInput(currentPassword);
                              setIsEditingPass(!isEditingPass);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold ml-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>{isEditingPass ? 'Cancel' : 'Change'}</span>
                          </button>
                        </div>
                      </div>

                      {isEditingPass ? (
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={editPassInput}
                            onChange={(e) => setEditPassInput(e.target.value)}
                            placeholder="Enter new password"
                            className="flex-1 bg-[#161f36] border border-amber-500/50 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleSavePassword}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-sm"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs font-mono">
                          {currentPassword ? (
                            <span className={`font-bold ${showPassword ? 'text-amber-300 font-mono select-all text-sm' : 'text-slate-400'}`}>
                              {showPassword ? currentPassword : '••••••••••••••••'}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No password set in record</span>
                          )}
                          <span className="text-[10px] text-emerald-400/80 font-sans font-semibold">Live Vault Synced</span>
                        </div>
                      )}
                    </div>

                    {/* Onchain Key */}
                    <div className="p-2 rounded-xl bg-[#0c1220] border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>Onchain Key:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {currentOnchainKey && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(currentOnchainKey, 'onchainKey')}
                              className="hover:text-amber-300 transition-colors cursor-pointer text-slate-400 p-0.5"
                              title="Copy Onchain Key"
                            >
                              {copiedKey === 'onchainKey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditKeyInput(currentOnchainKey);
                              setIsEditingKey(!isEditingKey);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold ml-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>{isEditingKey ? 'Cancel' : (currentOnchainKey ? 'Edit' : 'Set Key')}</span>
                          </button>
                        </div>
                      </div>

                      {isEditingKey ? (
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={editKeyInput}
                            onChange={(e) => setEditKeyInput(e.target.value)}
                            placeholder="Enter custom onchain key (e.g. ONC-9821-ETH2)"
                            className="flex-1 bg-[#161f36] border border-amber-500/50 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleSaveOnchainKey}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-sm"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs font-mono">
                          {currentOnchainKey ? (
                            <span className="text-amber-400 font-bold truncate max-w-[240px] select-all">
                              {currentOnchainKey}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No onchain key set</span>
                          )}
                          <span className="text-[10px] text-amber-500/80 font-sans font-semibold">Node Key</span>
                        </div>
                      )}
                    </div>

                    {/* Joined Date */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">Joined Date:</span>
                      <span className="text-slate-300">{customer.user.joinedDate || '2026-08-28'}</span>
                    </div>

                    {/* Security Standard */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">Security Standard:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Supabase Argon2 & Key Vault
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#10182b] border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Blockchain Addresses & Ledger</span>
                  </h3>
                  
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-[#0c1220] border border-slate-800/80 space-y-1">
                      <div className="text-slate-400 font-sans text-[11px]">Primary Wallet Address:</div>
                      <div className="flex items-center justify-between gap-1 text-slate-200">
                        <span className="truncate select-all">{customer.primaryWalletAddress}</span>
                        {customer.primaryWalletAddress !== 'No wallet linked yet' && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(customer.primaryWalletAddress, 'wallet')}
                            className="hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                          >
                            {copiedKey === 'wallet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#0c1220] border border-slate-800/80 space-y-1">
                      <div className="text-slate-400 font-sans text-[11px]">Last Sender TXID:</div>
                      <div className="flex items-center justify-between gap-1 text-amber-300">
                        <span className="truncate select-all">{customer.lastDepositTxid}</span>
                        {customer.lastDepositTxid !== 'None' && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(customer.lastDepositTxid, 'txid')}
                            className="hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                          >
                            {copiedKey === 'txid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">Total Blockchain Txs:</span>
                      <span className="text-white font-bold">{customer.deposits.length + customer.withdrawals.length} operations</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 7 & 8: Institutional KYC Clearance & Profit/Bonus Matrix */}
              <div className="p-4 rounded-2xl bg-[#10182b] border border-cyan-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Institutional KYC & Balance Adjustment Engine</h3>
                      <p className="text-[11px] text-slate-400">Manage client clearance limits, instant credit injections, and yield multipliers</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBonusModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Inject Bonus USDT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKycEditModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Set KYC Status</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  {/* KYC Status Block */}
                  <div className="p-3 rounded-xl bg-[#0c1220] border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-sans block">KYC Verification:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] uppercase ${
                        (customer.user.kycStatus === 'verified')
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : (customer.user.kycStatus === 'pending')
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {customer.user.kycStatus || 'unverified'}
                      </span>
                      <span className="text-slate-400 text-[11px]">Tier {customer.user.kycLevel || 1}</span>
                    </div>
                  </div>

                  {/* Bonus Balance Block */}
                  <div className="p-3 rounded-xl bg-[#0c1220] border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-sans block">Injected Bonus Balance:</span>
                    <div className="text-emerald-400 font-bold text-sm">
                      ${(customer.user.bonusUsdtBalance || 0).toFixed(2)} <span className="text-[10px] text-slate-500">USDT</span>
                    </div>
                  </div>

                  {/* Yield Boost Block */}
                  <div className="p-3 rounded-xl bg-[#0c1220] border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-sans block">Custom Yield Boost:</span>
                    <div className="text-amber-300 font-bold text-sm">
                      +{(customer.user.customYieldBonusPercent || 0).toFixed(2)}% <span className="text-[10px] text-slate-500">daily</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Action Alerts within customer modal */}
              {(customer.pendingDeposits.length > 0 || customer.pendingWithdrawals.length > 0) && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Pending Actions Required for this Client</span>
                  </div>
                  
                  <div className="space-y-2">
                    {customer.pendingDeposits.map((dep, idx) => (
                      <div key={`p-dep-${dep.id || 'dep'}-${idx}`} className="p-3 rounded-xl bg-[#0c1220] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>Pending Deposit: ${dep.amountUsd} USDT</span>
                            <span className="text-amber-300 font-mono text-[11px] font-normal">({dep.packageName})</span>
                          </div>
                          <div className="text-slate-400 font-mono text-[11px] truncate max-w-md">TXID: {dep.senderTxid}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {onApproveDeposit && (
                            <button
                              type="button"
                              onClick={() => onApproveDeposit(dep.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                          {onRejectDeposit && (
                            <button
                              type="button"
                              onClick={() => onRejectDeposit(dep.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {customer.pendingWithdrawals.map((w, idx) => (
                      <div key={`p-w-${w.id || 'w'}-${idx}`} className="p-3 rounded-xl bg-[#0c1220] border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>Pending Withdrawal: ${Math.abs(w.amount)} USDT</span>
                            <span className="text-purple-300 font-mono text-[11px] font-normal">({w.currency})</span>
                          </div>
                          <div className="text-slate-400 font-mono text-[11px] truncate max-w-md">Destination: {w.walletAddress}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {onApproveWithdrawal && (
                            <button
                              type="button"
                              onClick={() => onApproveWithdrawal(w.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                          {onRejectWithdrawal && (
                            <button
                              type="button"
                              onClick={() => onRejectWithdrawal(w.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: ACTIVE MINING HARDWARE CONTRACTS */}
          {/* ============================================================ */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>Purchased Smart Production Nodes ({customer.activeContracts.length + customer.expiredContracts.length})</span>
                </h3>
              </div>

              {customer.activeContracts.length === 0 && customer.expiredContracts.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-[#10182b] border border-slate-800 space-y-2">
                  <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">No active mining nodes</div>
                  <p className="text-xs text-slate-500">Client has not activated any VIP contracts yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {customer.activeContracts.map((c, idx) => (
                    <div key={`act-${c.deposit.id}-${idx}`} className="p-4 rounded-2xl bg-[#10182b] border border-amber-500/30 space-y-3 shadow-lg shadow-amber-500/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{c.deposit.packageName}</span>
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                              VIP {c.deposit.vipLevel}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                              Active Running
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            Duration: {c.durationLabel}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400">Time Remaining:</div>
                          <div className="text-xs font-mono font-bold text-amber-300">{c.timeRemainingText}</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Mining Cycle Progress</span>
                          <span>{c.progressPercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${c.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Contract Financial Breakdown */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Capital:</span>
                          <span className="text-emerald-400 font-bold">${c.deposit.amountUsd} USDT</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Accrued Yield:</span>
                          <span className="text-amber-300 font-bold">${c.accruedYieldUsd.toFixed(2)} USDT</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Hash Output:</span>
                          <span className="text-cyan-300 font-bold">{c.hashrate} {c.hashrateUnit}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {customer.expiredContracts.map((c, idx) => (
                    <div key={`exp-${c.deposit.id}-${idx}`} className="p-4 rounded-2xl bg-[#10182b] border border-slate-800 space-y-2 opacity-70">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">{c.deposit.packageName} (VIP {c.deposit.vipLevel})</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-mono text-[11px]">Expired & Settled</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Unlocked Payout: <strong className="text-emerald-400">${c.estTotalYieldUsd.toFixed(2)} USDT</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: DEPOSITS LEDGER */}
          {/* ============================================================ */}
          {activeTab === 'deposits' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>All Client Deposit Requests ({customer.deposits.length})</span>
                <span className="text-emerald-400">Total: ${customer.totalDepositedUsd.toFixed(2)} USDT</span>
              </div>

              {customer.deposits.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-[#10182b] border border-slate-800 text-xs text-slate-500">
                  No deposits on record for this client.
                </div>
              ) : (
                customer.deposits.map((dep, idx) => (
                  <div key={`all-dep-${dep.id || 'dep'}-${idx}`} className="p-3.5 rounded-2xl bg-[#10182b] border border-slate-800 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">${dep.amountUsd} USDT</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px]">{dep.network}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{dep.packageName}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold ${
                        dep.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : dep.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {dep.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#0c1220] border border-slate-800/80 font-mono text-[11px] space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-sans">Sender TXID:</span>
                        <span className="text-amber-300 truncate select-all">{dep.senderTxid}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(dep.senderTxid, `tx-${dep.id}`)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedKey === `tx-${dep.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-slate-400">
                        <span className="text-slate-500 font-sans">Submitted:</span>
                        <span>{dep.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: WITHDRAWALS LEDGER */}
          {/* ============================================================ */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>All Client Withdrawal Payouts ({customer.withdrawals.length})</span>
                <span className="text-rose-400">Total: ${customer.totalWithdrawnUsd.toFixed(2)} USDT</span>
              </div>

              {customer.withdrawals.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-[#10182b] border border-slate-800 text-xs text-slate-500">
                  No withdrawal records found for this client.
                </div>
              ) : (
                customer.withdrawals.map((w, idx) => (
                  <div key={`all-w-${w.id || 'w'}-${idx}`} className="p-3.5 rounded-2xl bg-[#10182b] border border-slate-800 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-400 text-sm">-${Math.abs(w.amount)} USDT</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px]">{w.type}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{w.currency}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold ${
                        w.status === 'Withdrawal successfully'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : w.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {w.status}
                      </span>
                    </div>

                    {w.walletAddress && (
                      <div className="p-2 rounded-xl bg-[#0c1220] border border-slate-800/80 font-mono text-[11px] flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-sans">Payout Wallet:</span>
                        <span className="text-slate-200 truncate select-all">{w.walletAddress}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(w.walletAddress!, `w-${w.id}`)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedKey === `w-${w.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#10182b] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Assign Mining Package</span>
            </button>

            {onDeleteClient && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete client "${customer.user.email}" and wipe all their test deposits & packages?`)) {
                    onDeleteClient(customer.user.id, customer.user.email);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                Delete Client Account
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>

      {/* Package Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0d1424] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Assign Mining Package</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select a VIP Package to instantly activate mining hashrate and contract for <strong className="text-white">{customer.user.name || customer.user.email}</strong>.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {MINING_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setAssigningPackageId(pkg.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    assigningPackageId === pkg.id
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-[#121b2f] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                      assigningPackageId === pkg.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      V{pkg.vipLevel}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{pkg.name}</div>
                      <div className="text-[11px] text-amber-400 font-mono font-bold">${pkg.priceUsd} USDT • {pkg.hashrate} {pkg.hashrateUnit}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">+${pkg.dailyReturnUsd}/day</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                disabled={isAssigning}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignPackage}
                disabled={isAssigning}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isAssigning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Activate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 7: Instant Balance / Bonus Injection Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0d1424] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Gift className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Instant Balance / Bonus Injection</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Directly credit USDT balance or assign daily profit boost percentage to <strong className="text-white">{customer.user.name || customer.user.email}</strong>.
            </p>

            <form onSubmit={handleExecuteBonusInjection} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Adjustment Type:</label>
                <select
                  value={bonusTypeInput}
                  onChange={(e) => setBonusTypeInput(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bonus_credit">🎁 Promotional Welcome Bonus (USDT Balance)</option>
                  <option value="manual_credit">💵 Executive Discretionary Credit (USDT)</option>
                  <option value="yield_boost">⚡ Custom Daily Yield Multiplier (+% Daily Profit)</option>
                  <option value="promo_reward">🏆 Institutional VIP Loyalty Grant (USDT)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">USDT Credit Amount ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 500"
                    value={bonusAmountInput}
                    onChange={(e) => setBonusAmountInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Yield Boost (+% / day):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="e.g. 0.5"
                    value={yieldBoostInput}
                    onChange={(e) => setYieldBoostInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Reason / Ledger Memo:</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Institutional Sign-up Grant"
                  value={bonusReasonInput}
                  onChange={(e) => setBonusReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBonusModal(false)}
                  disabled={isInjectingBonus}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInjectingBonus}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isInjectingBonus ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Injecting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Execute Injection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature 8: KYC Status Management Modal */}
      {showKycEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0d1424] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-base font-black text-white">KYC Verification Status Control</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKycEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Update compliance clearance and withdrawal limits for <strong className="text-white">{customer.user.name || customer.user.email}</strong>.
            </p>

            <form onSubmit={handleExecuteKycUpdate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Verification Status:</label>
                <select
                  value={kycStatusSelect}
                  onChange={(e) => setKycStatusSelect(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="verified">✅ Verified (Full Clearance)</option>
                  <option value="pending">⏳ Pending Review</option>
                  <option value="unverified">⚪ Unverified</option>
                  <option value="rejected">❌ Rejected (Require Resubmission)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Clearance Tier:</label>
                <select
                  value={kycLevelSelect}
                  onChange={(e) => setKycLevelSelect(parseInt(e.target.value) as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={1}>Tier 1: Standard ID ($50,000/day limit)</option>
                  <option value={2}>Tier 2: Institutional (Unlimited Volume)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Admin Audit Note / Rejection Reason:</label>
                <textarea
                  rows={2}
                  placeholder="Optional compliance audit feedback or rejection details..."
                  value={kycReasonInput}
                  onChange={(e) => setKycReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKycEditModal(false)}
                  disabled={isUpdatingKyc}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingKyc}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isUpdatingKyc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Update Status</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
