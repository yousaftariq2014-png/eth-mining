import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  X,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Search,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Printer,
  ChevronDown,
  ChevronUp,
  Wallet,
  Sparkles
} from 'lucide-react';
import { WithdrawalRecordItem } from '../types';

interface WithdrawalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawals: WithdrawalRecordItem[];
  onViewReceipt: (w: WithdrawalRecordItem) => void;
  onNewWithdrawal: () => void;
  userEmail?: string;
  userName?: string;
}

// Tether USDT Logo component matching mobile DApp
export const TetherIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      d="M17.922 17.383c-.088.006-.275.018-.544.018-.846 0-1.897-.044-2.732-.152l.006 4.954h-2.316l-.006-4.942c-1.341-.186-2.298-.567-2.298-1.026 0-.58 1.523-1.053 3.51-1.127v-1.632h-4.39V11.58h13.696v1.897h-4.39v1.632c1.98.074 3.498.547 3.498 1.127 0 .428-.844.789-2.034.981v1.286l.002-.001zm0-2.45c-.267.012-.663.025-1.11.025-.562 0-1.036-.013-1.345-.025-1.782-.075-3.085-.357-3.085-.694 0-.337 1.303-.619 3.085-.694.309-.012.783-.025 1.345-.025.447 0 .843.013 1.11.025 1.782.075 3.085.357 3.085.694 0 .337-1.303.619-3.085.694z"
      fill="#FFFFFF"
    />
  </svg>
);

// Formatter for timestamp: MM/DD/YYYY HH:mm:ss (exact format from user screenshot)
export const formatWithdrawalTime = (timeStr?: string): string => {
  if (!timeStr) return '--';
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const year = d.getFullYear();
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      const seconds = pad(d.getSeconds());
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    }

    // Try parsing ISO or sql string manually if Date failed
    const parts = timeStr.trim().split(/[\sT]+/);
    if (parts.length === 2) {
      const dateParts = parts[0].split(/[-/]/);
      if (dateParts.length === 3) {
        if (dateParts[0].length === 4) {
          // YYYY-MM-DD
          return `${dateParts[1].padStart(2, '0')}/${dateParts[2].padStart(2, '0')}/${dateParts[0]} ${parts[1].substring(0, 8)}`;
        }
      }
    }
    return timeStr;
  } catch {
    return timeStr || '--';
  }
};

// Formatter for amount: -50464.5554 (with minus sign and accurate decimals)
const formatWithdrawalAmount = (amt: number | string): string => {
  const num = Math.abs(Number(amt) || 0);
  const numStr = num.toString();
  if (numStr.includes('.')) {
    const decimals = numStr.split('.')[1];
    if (decimals.length > 4) {
      return `-${num.toFixed(4)}`;
    }
    return `-${numStr}`;
  }
  return `-${num.toLocaleString('en-US')}`;
};

// Generates title like "USDT-ERCWithdrawal" or "USDT-TRCWithdrawal"
const getWithdrawalTitle = (w: WithdrawalRecordItem): string => {
  const typeStr = (w.type || '').toUpperCase();
  const curr = (w.currency || 'USDT').toUpperCase();
  
  if (typeStr.includes('ERC') || typeStr.includes('ETH')) {
    return `${curr}-ERCWithdrawal`;
  }
  if (typeStr.includes('TRC') || typeStr.includes('TRON')) {
    return `${curr}-TRCWithdrawal`;
  }
  if (typeStr.includes('BEP') || typeStr.includes('BSC')) {
    return `${curr}-BEPWithdrawal`;
  }
  if (typeStr) {
    const cleanType = typeStr.replace(/[^A-Z0-9]/g, '');
    return `${cleanType}Withdrawal`;
  }
  return `${curr}-ERCWithdrawal`;
};

export const WithdrawalHistoryModal: React.FC<WithdrawalHistoryModalProps> = ({
  isOpen,
  onClose,
  withdrawals,
  onViewReceipt,
  onNewWithdrawal,
  userEmail,
  userName
}) => {
  // Tabs strictly matching screenshot: 'All' | 'Pending' | 'Withdrawal successfully' | 'Failed'
  const [filterTab, setFilterTab] = useState<'All' | 'Pending' | 'Withdrawal successfully' | 'Failed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Metrics (strictly from genuine client records)
  const totalWithdrawn = withdrawals.reduce((acc, curr) => {
    const st = String(curr.status || '').toLowerCase();
    if (['withdrawal successfully', 'approved', 'completed'].includes(st)) {
      return acc + Math.abs(Number(curr.amount) || 0);
    }
    return acc;
  }, 0);

  const pendingList = withdrawals.filter(w => String(w.status || '').toLowerCase() === 'pending');
  const pendingAmount = pendingList.reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
  const completedList = withdrawals.filter(w => ['withdrawal successfully', 'approved', 'completed'].includes(String(w.status || '').toLowerCase()));
  const failedList = withdrawals.filter(w => ['failed', 'rejected'].includes(String(w.status || '').toLowerCase()));

  // Filter withdrawals based on the selected tab
  const filteredWithdrawals = withdrawals.filter(w => {
    const st = String(w.status || '').toLowerCase();
    const isPending = st === 'pending';
    const isCompleted = ['withdrawal successfully', 'approved', 'completed'].includes(st);
    const isFailed = ['failed', 'rejected'].includes(st);

    if (filterTab === 'Pending' && !isPending) return false;
    if (filterTab === 'Withdrawal successfully' && !isCompleted) return false;
    if (filterTab === 'Failed' && !isFailed) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchWallet = (w.walletAddress || '').toLowerCase().includes(q);
      const matchTx = (w.txHash || '').toLowerCase().includes(q);
      const matchType = (w.type || '').toLowerCase().includes(q);
      const matchTime = (w.time || '').toLowerCase().includes(q);
      const matchAmt = String(w.amount).includes(q);
      return matchWallet || matchTx || matchType || matchTime || matchAmt;
    }

    return true;
  });

  const getExplorerUrl = (txHash?: string, network?: string) => {
    if (!txHash) return null;
    const cleanHash = txHash.trim();
    const net = (network || '').toUpperCase();
    if (net.includes('TRC') || net.includes('TRON')) {
      return `https://tronscan.org/#/transaction/${cleanHash}`;
    }
    if (net.includes('BEP') || net.includes('BSC')) {
      return `https://bscscan.com/tx/${cleanHash}`;
    }
    return `https://etherscan.io/tx/${cleanHash}`;
  };

  const toggleRow = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        id="withdrawal-record-container"
        className="w-full max-w-lg bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[92vh] text-slate-900 font-sans border border-slate-200"
      >
        {/* ============================================================ */}
        {/* 1. TOP APP HEADER (Exact match to screenshot)                */}
        {/* ============================================================ */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight text-center flex-1 pr-2">
            Withdrawal Record
          </h1>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              title="Search records"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Search Bar */}
        {showSearch && (
          <div className="p-3 bg-slate-50 border-b border-gray-200 flex items-center gap-2 animate-fadeIn">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search amount, wallet or TXID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. FILTER TABS (Exact match to screenshot: All, Pending,     */}
        {/*    Withdrawal successfully, Failed)                          */}
        {/* ============================================================ */}
        <div className="bg-white border-b border-gray-100 px-2 flex items-center justify-between shrink-0 select-none">
          {([
            { key: 'All', label: 'All', count: withdrawals.length },
            { key: 'Pending', label: 'Pending', count: pendingList.length },
            { key: 'Withdrawal successfully', label: 'Withdrawal successfully', count: completedList.length },
            { key: 'Failed', label: 'Failed', count: failedList.length },
          ] as const).map(tab => {
            const isActive = filterTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`flex-1 py-3 px-1 text-center text-[13px] sm:text-sm font-medium transition-all relative cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-[#1890ff] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-[2.5px] bg-[#1890ff] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* 3. TRANSACTION RECORDS LIST (Genuine Client Data Only)        */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto bg-white divide-y divide-gray-100">
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Wallet className="w-7 h-7" />
              </div>
              <div className="text-sm font-bold text-slate-800">
                No Withdrawal Records Found
              </div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {filterTab !== 'All' || searchQuery
                  ? `No transactions in the "${filterTab}" category.`
                  : 'You have not submitted any withdrawal payout requests yet.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewWithdrawal();
                }}
                className="mt-2 px-5 py-2 rounded-xl bg-[#1890ff] hover:bg-blue-600 text-white font-medium text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all"
              >
                + Request Withdrawal
              </button>
            </div>
          ) : (
            filteredWithdrawals.map((w, idx) => {
              const rowId = w.id || `w-${idx}`;
              const isExpanded = expandedRowId === rowId;
              const st = String(w.status || '').toLowerCase();
              const isPending = st === 'pending';
              const isSuccess = ['withdrawal successfully', 'approved', 'completed'].includes(st);
              const isFailed = ['failed', 'rejected'].includes(st);

              const formattedAmount = formatWithdrawalAmount(w.amount);
              const formattedTime = formatWithdrawalTime(w.time);
              const title = getWithdrawalTitle(w);
              const explorerUrl = getExplorerUrl(w.txHash, w.type);

              const copyWalletKey = `addr-${rowId}`;
              const copyTxKey = `tx-${rowId}`;

              return (
                <div
                  key={rowId}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  {/* Primary Row: Matching screenshot layout */}
                  <div
                    onClick={() => toggleRow(rowId)}
                    className="p-4 sm:px-5 space-y-3 cursor-pointer"
                  >
                    {/* Header: Tether Icon + USDT-ERCWithdrawal */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TetherIcon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
                        <span className="font-semibold text-slate-900 text-sm sm:text-[15px]">
                          {title}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* 3 Columns Subheaders: Amount | Status | Time */}
                    <div className="grid grid-cols-3 text-xs text-slate-400 font-normal">
                      <div>Amount</div>
                      <div className="text-center sm:text-left">Status</div>
                      <div className="text-right">Time</div>
                    </div>

                    {/* 3 Columns Values: Red Amount | Colored Status | Timestamp */}
                    <div className="grid grid-cols-3 items-center text-xs sm:text-sm">
                      {/* Amount: -50464.5554 in bold red */}
                      <div className="font-bold text-[#ff4d4f] truncate text-sm sm:text-base">
                        {formattedAmount}
                      </div>

                      {/* Status: Pending (dark) / Withdrawal successfully (blue) / Failed (red) */}
                      <div className="text-center sm:text-left font-medium truncate">
                        {isPending && (
                          <span className="text-slate-700">Pending</span>
                        )}
                        {isSuccess && (
                          <span className="text-[#1890ff]">Withdrawal successfully</span>
                        )}
                        {isFailed && (
                          <span className="text-[#ff4d4f]">Failed</span>
                        )}
                      </div>

                      {/* Time: MM/DD/YYYY HH:mm:ss in right-aligned dark text */}
                      <div className="text-right font-mono text-slate-900 font-medium text-xs sm:text-[13px] truncate">
                        {formattedTime}
                      </div>
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* EXPANDABLE DETAIL DRAWER (Professional Enterprise Verification) */}
                  {/* ============================================================ */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 sm:px-5 space-y-3 bg-slate-50/80 border-t border-dashed border-gray-200 text-xs animate-fadeIn">
                      
                      {/* Wallet Address */}
                      {w.walletAddress && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Destination Wallet</span>
                            <div className="text-slate-800 font-mono text-xs truncate mt-0.5" title={w.walletAddress}>
                              {w.walletAddress}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(w.walletAddress!, copyWalletKey, e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors shrink-0"
                            title="Copy Wallet Address"
                          >
                            {copiedKey === copyWalletKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Blockchain Transaction Hash / TXID */}
                      {w.txHash && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Blockchain TXID
                            </span>
                            <div className="text-emerald-700 font-mono text-xs truncate mt-0.5">
                              {w.txHash}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleCopy(w.txHash!, copyTxKey, e)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                              title="Copy TXID"
                            >
                              {copiedKey === copyTxKey ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {explorerUrl && (
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 cursor-pointer transition-colors flex items-center gap-1 text-[11px] font-medium"
                                title="Verify on Blockchain Explorer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Explorer</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Multi-Sig & Status Banner */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-slate-700 font-medium">
                            {isSuccess ? 'Settled on Treasury Ledger' : isPending ? 'In Security Review' : 'Cancelled'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isSuccess ? '3/3 Multi-Sig' : isPending ? '1/3 Underwriter' : 'Failed'}
                        </span>
                      </div>

                      {/* Rejection Reason if any */}
                      {w.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
                          <div className="flex items-center gap-1.5 font-semibold text-red-800">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Rejection Reason:</span>
                          </div>
                          <p className="text-[11px] text-red-700 mt-1 pl-5">
                            {w.rejectionReason}
                          </p>
                        </div>
                      )}

                      {/* PDF Receipt Action */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Official Settlement Record
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewReceipt(w);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#1890ff] hover:bg-blue-600 text-white font-medium text-xs shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Official Receipt</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ============================================================ */}
        {/* 4. FOOTER BAR                                                */}
        {/* ============================================================ */}
        <div className="p-3.5 bg-slate-50 border-t border-gray-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Multi-Sig Cryptographic Clearance</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNewWithdrawal();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#1890ff] hover:bg-blue-600 text-white font-semibold text-xs cursor-pointer shadow-sm transition-all flex items-center gap-1"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>New Withdrawal</span>
          </button>
        </div>

      </div>
    </div>
  );
};

