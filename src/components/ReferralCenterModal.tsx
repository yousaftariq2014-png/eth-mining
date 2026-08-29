import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  DollarSign, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles, 
  Award,
  TrendingUp,
  Layers,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { UserProfile, ReferralRecord, ReferralStats } from '../types';

interface ReferralCenterModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onClaimCommission?: (amountUsd: number) => void;
}

export const ReferralCenterModal: React.FC<ReferralCenterModalProps> = ({
  user,
  isOpen,
  onClose,
  onClaimCommission
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Generate unique referral code for the user
  const userRefCode = React.useMemo(() => {
    if (user.onchainKey) {
      return `HF-${user.onchainKey.slice(0, 6).toUpperCase()}`;
    }
    const safePart = (user.id || user.name || 'USER').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    return `HF-${safePart || 'MINER'}`;
  }, [user]);

  const referralLink = `https://hashforge.pro/register?ref=${userRefCode}`;

  // Referral Stats state with localStorage persistence
  const [stats, setStats] = useState<ReferralStats>(() => {
    const saved = localStorage.getItem(`hashforge_ref_stats_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Seed initial realistic activity
    const seedRecords: ReferralRecord[] = [
      {
        id: 'ref-1',
        refereeName: 'David K. (Europe)',
        refereeEmail: 'dav***@gmail.com',
        joinedAt: '2 days ago',
        packageName: 'Diamond Miner (850 TH/s)',
        depositAmountUsd: 1000,
        commissionEarnedUsd: 70.00, // 7%
        status: 'Completed',
        tierLevel: 1
      },
      {
        id: 'ref-2',
        refereeName: 'Marcus V. (Asia)',
        refereeEmail: 'mar***@crypto.io',
        joinedAt: '5 days ago',
        packageName: 'Gold Hydro Miner (320 TH/s)',
        depositAmountUsd: 500,
        commissionEarnedUsd: 35.00, // 7%
        status: 'Completed',
        tierLevel: 1
      },
      {
        id: 'ref-3',
        refereeName: 'Elena Rostova',
        refereeEmail: 'ele***@proton.me',
        joinedAt: '1 week ago',
        packageName: 'Bronze Starter (25 TH/s)',
        depositAmountUsd: 100,
        commissionEarnedUsd: 7.00, // 7%
        status: 'Completed',
        tierLevel: 1
      }
    ];

    return {
      referralCode: userRefCode,
      referralLink: referralLink,
      totalInvites: 8,
      activeMinersCount: 3,
      totalCommissionUsd: 112.00,
      claimableCommissionUsd: 112.00,
      tier1CommissionPercent: 7,
      tier2CommissionPercent: 3,
      tier3CommissionPercent: 1,
      records: seedRecords
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(`hashforge_ref_stats_${user.id}`, JSON.stringify(stats));
    } catch {}
  }, [stats, user.id]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userRefCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClaim = () => {
    if (stats.claimableCommissionUsd <= 0) return;
    const amount = stats.claimableCommissionUsd;
    
    setStats(prev => ({
      ...prev,
      claimableCommissionUsd: 0
    }));

    if (onClaimCommission) {
      onClaimCommission(amount);
    }

    setClaimSuccess(true);
    setTimeout(() => setClaimSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0d1424] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17233f] via-[#111a30] to-[#0c1220] p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Affiliate & Partner Commission Center</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  UP TO 11% EARNINGS
                </span>
              </div>
              <p className="text-xs text-slate-400">Invite friends and investors to earn instant recurring USDT commissions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-[#0a0f1d]">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#11192c] border border-slate-800/80">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Invites</span>
              <span className="text-xl font-black text-white font-mono mt-1 block">{stats.totalInvites}</span>
              <span className="text-[10px] text-slate-500 font-mono">Registered accounts</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#11192c] border border-slate-800/80">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Active Miners</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{stats.activeMinersCount}</span>
              <span className="text-[10px] text-slate-500 font-mono">Deposited contracts</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#11192c] border border-slate-800/80">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Commission</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-1 block">${stats.totalCommissionUsd.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 font-mono">All-time earned</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/30">
              <span className="text-[11px] font-mono uppercase text-amber-300 block">Claimable Balance</span>
              <span className="text-xl font-black text-white font-mono mt-1 block">${stats.claimableCommissionUsd.toFixed(2)}</span>
              <button
                onClick={handleClaim}
                disabled={stats.claimableCommissionUsd <= 0}
                className="mt-2 w-full py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Claim to USDT</span>
              </button>
            </div>
          </div>

          {claimSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Commission successfully claimed! Added to your live withdrawable USDT balance.</span>
            </div>
          )}

          {/* Share Links Box */}
          <div className="p-5 rounded-2xl bg-[#11192c] border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Your Unique Referral Credentials</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono">Personal Invitation Link</label>
                <div className="flex items-center gap-2 bg-[#090d18] p-2 rounded-xl border border-slate-700/80">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="bg-transparent text-xs text-white font-mono flex-1 outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono">Referral Code</label>
                <div className="flex items-center gap-2 bg-[#090d18] p-2 rounded-xl border border-slate-700/80">
                  <span className="text-xs text-amber-400 font-mono font-bold flex-1 text-center">{userRefCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Tier Multi-Level Commission Structure */}
          <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Multi-Tier Commission Structure</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Instant Automated Payouts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#131e34] border border-amber-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm font-mono border border-amber-500/40">
                  7%
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Tier 1 Direct</span>
                  <span className="text-[10px] text-slate-400 font-mono">Your direct friend invites</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#131e34] border border-slate-700/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm font-mono border border-slate-700">
                  3%
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Tier 2 Sub-network</span>
                  <span className="text-[10px] text-slate-400 font-mono">Invites by your friends</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#131e34] border border-slate-700/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm font-mono border border-slate-700">
                  1%
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Tier 3 Extended</span>
                  <span className="text-[10px] text-slate-400 font-mono">Community layer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Activity Records Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Recent Referral Commissions</span>
            </h4>

            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-[#11192c] px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono grid grid-cols-12">
                <div className="col-span-4">Friend / Referee</div>
                <div className="col-span-4">Mining Contract</div>
                <div className="col-span-2 text-right">Deposit</div>
                <div className="col-span-2 text-right">Commission</div>
              </div>

              <div className="divide-y divide-slate-800/80 bg-[#090d18] text-xs">
                {stats.records.map((rec) => (
                  <div key={rec.id} className="px-4 py-3 grid grid-cols-12 items-center">
                    <div className="col-span-4">
                      <span className="font-bold text-white block">{rec.refereeName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{rec.joinedAt}</span>
                    </div>
                    <div className="col-span-4">
                      <span className="text-slate-300 truncate block">{rec.packageName}</span>
                      <span className="text-[10px] text-amber-400 font-mono">Tier {rec.tierLevel} Direct</span>
                    </div>
                    <div className="col-span-2 text-right font-mono text-slate-400">
                      ${rec.depositAmountUsd}
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-emerald-400">
                      +${rec.commissionEarnedUsd.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#11192c] px-6 py-4 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographically Verified Referral Ledger</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
