import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  Printer,
  Sparkles,
  Wallet,
  ArrowDownLeft,
  ChevronRight
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

export const WithdrawalHistoryModal: React.FC<WithdrawalHistoryModalProps> = ({
  isOpen,
  onClose,
  withdrawals,
  onViewReceipt,
  onNewWithdrawal,
  userEmail,
  userName
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Metrics calculations
  const totalWithdrawn = withdrawals.reduce((acc, curr) => {
    const st = String(curr.status || '').toLowerCase();
    if (['withdrawal successfully', 'approved', 'completed'].includes(st)) {
      return acc + Math.abs(Number(curr.amount) || 0);
    }
    return acc;
  }, 0);

  const pendingList = withdrawals.filter(w => String(w.status || '').toLowerCase() === 'pending');
  const pendingAmount = pendingList.reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
  const completedCount = withdrawals.filter(w => ['withdrawal successfully', 'approved', 'completed'].includes(String(w.status || '').toLowerCase())).length;
  const rejectedCount = withdrawals.filter(w => ['failed', 'rejected'].includes(String(w.status || '').toLowerCase())).length;

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    const st = String(w.status || '').toLowerCase();
    const isPending = st === 'pending';
    const isCompleted = ['withdrawal successfully', 'approved', 'completed'].includes(st);
    const isRejected = ['failed', 'rejected'].includes(st);

    if (filterStatus === 'pending' && !isPending) return false;
    if (filterStatus === 'completed' && !isCompleted) return false;
    if (filterStatus === 'rejected' && !isRejected) return false;

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

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        id="withdrawal-history-ledger-modal"
        className="w-full max-w-4xl bg-gradient-to-b from-[#0e1628] via-[#0a0f1d] to-[#070b14] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-sans"
      >
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-[#0c1322]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Withdrawal History & Ledger
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40">
                  Live Audit
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Official Multi-Sig Treasury Clearances & Blockchain Settlement Records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintStatement}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-medium border border-slate-700 cursor-pointer transition-colors"
              title="Print Official Statement"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Statement</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 AUDIT METRICS TILES */}
        <div className="p-5 sm:p-6 border-b border-slate-800/70 bg-[#090e1a]/60 shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
            
            {/* Tile 1: Total Withdrawn */}
            <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-emerald-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Total Settled</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-300 mt-1 truncate">
                ${totalWithdrawn.toFixed(2)}{' '}
                <span className="text-xs font-bold text-slate-400">USDT</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {completedCount} approved {completedCount === 1 ? 'transaction' : 'transactions'}
              </div>
            </div>

            {/* Tile 2: In Review / Pending */}
            <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-amber-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>In Review</span>
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </div>
              <div className="text-base sm:text-xl font-black text-amber-300 mt-1 truncate">
                ${pendingAmount.toFixed(2)}{' '}
                <span className="text-xs font-bold text-slate-400">USDT</span>
              </div>
              <div className="text-[10px] text-amber-400/90 mt-0.5 font-bold">
                {pendingList.length} awaiting multi-sig
              </div>
            </div>

            {/* Tile 3: Total Requests */}
            <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-cyan-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Total Requests</span>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base sm:text-xl font-black text-white mt-1">
                {withdrawals.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {rejectedCount} rejected / failed
              </div>
            </div>

            {/* Tile 4: VIP Gas Subsidy */}
            <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Network Fee</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base sm:text-xl font-black text-amber-400 mt-1">
                $0.00
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5 font-bold">
                100% VIP Gas Subsidy
              </div>
            </div>

          </div>
        </div>

        {/* SEARCH & STATUS FILTER TOOLBAR */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-[#0a0f1d] flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({withdrawals.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'pending' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Pending</span>
              {pendingList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-950 text-amber-400 font-black">
                  {pendingList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'completed' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'rejected' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search wallet, TXID or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
          </div>

        </div>

        {/* LEDGER TRANSACTION LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-300">No Withdrawal Records Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
                {searchQuery || filterStatus !== 'all'
                  ? 'No transactions matched your selected status filter or search query.'
                  : 'You have not submitted any withdrawal payout requests yet.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNewWithdrawal();
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
              >
                + Submit New Withdrawal
              </button>
            </div>
          ) : (
            filteredWithdrawals.map((w, idx) => {
              const st = String(w.status || '').toLowerCase();
              const isPending = st === 'pending';
              const isApproved = ['withdrawal successfully', 'approved', 'completed'].includes(st);
              const isRejected = ['failed', 'rejected'].includes(st);
              const explorerUrl = getExplorerUrl(w.txHash, w.type);
              const copyWalletKey = `w-addr-${idx}`;
              const copyTxKey = `w-tx-${idx}`;

              return (
                <div
                  key={`ledger-item-${w.id || idx}`}
                  className={`p-4 sm:p-5 rounded-2xl border font-mono transition-all space-y-3 ${
                    isPending
                      ? 'bg-gradient-to-r from-amber-950/20 via-[#0e1628] to-[#0a0f1d] border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : isApproved
                      ? 'bg-gradient-to-r from-emerald-950/20 via-[#0e1628] to-[#0a0f1d] border-emerald-500/30'
                      : isRejected
                      ? 'bg-gradient-to-r from-rose-950/20 via-[#0e1628] to-[#0a0f1d] border-rose-500/30'
                      : 'bg-[#0b101c] border-slate-800'
                  }`}
                >
                  {/* Top Line: Amount, Network, Status Badge, Invoice Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`text-base sm:text-lg font-black tracking-tight ${
                        isPending ? 'text-amber-300' : isApproved ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        -${Math.abs(Number(w.amount)).toFixed(2)} USDT
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-bold uppercase">
                        {w.type || 'USDT-TRC20'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : isApproved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isPending && <Clock className="w-3 h-3 text-amber-400 animate-spin" />}
                        {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {isRejected && <AlertCircle className="w-3 h-3 text-rose-400" />}
                        <span>
                          {isPending
                            ? 'Pending Treasury Clearance'
                            : isApproved
                            ? 'Approved & Settled'
                            : 'Request Rejected'}
                        </span>
                      </span>

                      <button
                        onClick={() => onViewReceipt(w)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold border border-slate-700 cursor-pointer transition-colors"
                        title="Download Official Audit Receipt (PDF)"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Receipt</span>
                      </button>
                    </div>
                  </div>

                  {/* Destination Wallet Address & Timestamp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    
                    {/* Destination Address */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Destination Wallet</span>
                        <div className="text-slate-200 text-xs truncate font-mono mt-0.5" title={w.walletAddress || 'Saved Account Wallet'}>
                          {w.walletAddress || 'Saved Account Wallet'}
                        </div>
                      </div>
                      {w.walletAddress && (
                        <button
                          onClick={() => handleCopy(w.walletAddress!, copyWalletKey)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0"
                          title="Copy Wallet Address"
                        >
                          {copiedKey === copyWalletKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Timestamp & Multi-sig state */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Submitted Date & Time</span>
                        <div className="text-slate-300 text-xs font-mono mt-0.5">
                          {w.time || 'Recently Logged'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Multi-Sig</span>
                        <span className={`text-[10px] font-bold ${isApproved ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-slate-400'}`}>
                          {isApproved ? '3/3 Confirmed' : isPending ? '1/3 Auditor' : 'Declined'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Blockchain Transaction Hash / TXID */}
                  {w.txHash && (
                    <div className="bg-[#080d1a] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          On-Chain Transaction Hash (TXID)
                        </span>
                        <div className="text-emerald-400 font-mono text-xs truncate mt-0.5">
                          {w.txHash}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(w.txHash!, copyTxKey)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                          title="Copy Blockchain Hash"
                        >
                          {copiedKey === copyTxKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {explorerUrl && (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="Verify on Blockchain Explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Explorer</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection Note */}
                  {w.rejectionReason && (
                    <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/50 text-xs text-rose-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Rejection Reason:</span>
                      </div>
                      <p className="text-[11px] text-rose-200 font-normal pl-5">
                        {w.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Pending Info Footnote */}
                  {isPending && (
                    <div className="flex items-center justify-between text-[10px] text-amber-300/80 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                      <span>⚡ Security Protocol: Assets are held in HashForge Cold-Storage Treasury pending compliance clearance.</span>
                      <span className="font-bold">Avg. 15-45m</span>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0c1322] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Signature Ledger • Zero-Slippage Guaranteed</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNewWithdrawal();
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>New Withdrawal</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
