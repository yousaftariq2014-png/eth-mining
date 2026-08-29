import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Key,
  ShieldCheck,
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
  Cpu
} from 'lucide-react';
import { AggregatedCustomerData } from '../utils/adminCustomerMetrics';

interface CustomerDetailModalProps {
  customer: AggregatedCustomerData;
  onClose: () => void;
  onApproveDeposit?: (depositId: string) => void;
  onRejectDeposit?: (depositId: string) => void;
  onApproveWithdrawal?: (withdrawalId: string) => void;
  onRejectWithdrawal?: (withdrawalId: string) => void;
  onDeleteClient?: (userId: string, email: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  onApproveDeposit,
  onRejectDeposit,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onDeleteClient
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'deposits' | 'withdrawals'>('overview');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
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
                  VIP {customer.computedVipLevel}
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
              onClick={() => {
                const dossier = `CUSTOMER DOSSIER:
Name: ${customer.user.name}
Email: ${customer.user.email}
User ID: ${customer.user.id}
Onchain Key: ${customer.user.onchainKey || 'N/A'}
VIP Tier: VIP ${customer.computedVipLevel}
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
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Authentication & Profile Metadata</span>
                  </h3>
                  
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">User ID:</span>
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <span className="truncate max-w-[200px]">{customer.user.id}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(customer.user.id, 'userId')}
                          className="hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          {copiedKey === 'userId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">Onchain Key:</span>
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <span className="truncate max-w-[200px]">{customer.user.onchainKey || 'Verified Protocol Key'}</span>
                        {customer.user.onchainKey && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(customer.user.onchainKey || '', 'onchainKey')}
                            className="hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            {copiedKey === 'onchainKey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">Registered Email:</span>
                      <span className="text-amber-300 font-bold">{customer.user.email}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">Joined Date:</span>
                      <span className="text-slate-300">{customer.user.joinedDate || '2026-08-28'}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#0c1220] border border-slate-800/80">
                      <span className="text-slate-400 font-sans">Security Standard:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Supabase Argon2 / Bcrypt
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
    </div>
  );
};
