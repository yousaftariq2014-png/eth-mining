import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Sparkles, 
  Flame, 
  Gift, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Award,
  ChevronRight,
  Lock,
  ArrowRight
} from 'lucide-react';
import { UserProfile, DailyStreakDay, VipTierBenefit } from '../types';

interface VipStreakBonusModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onClaimDailyReward: (ethReward: number, hashrateBonusGhs: number, dayNumber: number) => void;
}

const VIP_TIERS: VipTierBenefit[] = [
  {
    level: 1,
    name: 'VIP 1 Bronze Miner',
    minInvestmentUsd: 100,
    hashrateBoostGhs: 0,
    withdrawalFeePercent: 0.0,
    referralBonusPercent: 7.0,
    perks: ['24/7 Mining Engine', 'Instant Automated Payouts', 'Zero Gas Platform Fee'],
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300'
  },
  {
    level: 2,
    name: 'VIP 2 Silver Hydro',
    minInvestmentUsd: 500,
    hashrateBoostGhs: 25,
    withdrawalFeePercent: 0.0,
    referralBonusPercent: 8.0,
    perks: ['+25 GH/s Free Loyalty Boost', 'Priority Stratum v2 Pool Route', 'Sub-minute withdrawal queue'],
    color: 'text-slate-300',
    badgeBg: 'bg-slate-300/20 border-slate-300/40 text-slate-200'
  },
  {
    level: 3,
    name: 'VIP 3 Gold ASIC',
    minInvestmentUsd: 1000,
    hashrateBoostGhs: 60,
    withdrawalFeePercent: 0.0,
    referralBonusPercent: 9.0,
    perks: ['+60 GH/s Turbo Boost', 'Exclusive 48h Flash Pool Access', 'VIP Technical Support Manager'],
    color: 'text-amber-300',
    badgeBg: 'bg-amber-400/20 border-amber-400/50 text-amber-200'
  },
  {
    level: 4,
    name: 'VIP 4 Platinum Cluster',
    minInvestmentUsd: 5000,
    hashrateBoostGhs: 200,
    withdrawalFeePercent: 0.0,
    referralBonusPercent: 10.0,
    perks: ['+200 GH/s Enterprise Hashrate', 'Direct Telemetry API Access', 'Custom Liquidity Settlement Pool'],
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
  },
  {
    level: 5,
    name: 'VIP 5 Whale Diamond Enterprise',
    minInvestmentUsd: 10000,
    hashrateBoostGhs: 500,
    withdrawalFeePercent: 0.0,
    referralBonusPercent: 12.0,
    perks: ['+500 GH/s Hydro Datacenter Power', 'Zero Slippage Instant Swap Guarantee', '1-on-1 Dedicated Mining Specialist'],
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/20 border-purple-500/40 text-purple-300'
  }
];

export const VipStreakBonusModal: React.FC<VipStreakBonusModalProps> = ({
  user,
  isOpen,
  onClose,
  onClaimDailyReward
}) => {
  const [activeTab, setActiveTab] = useState<'streak' | 'vip'>('streak');
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    lastClaimTimestamp: number;
    days: DailyStreakDay[];
  }>(() => {
    const saved = localStorage.getItem(`hashforge_streak_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    const defaultDays: DailyStreakDay[] = [
      { dayNumber: 1, rewardEth: 0.00005, rewardText: '+0.00005 ETH', bonusHashrateGhs: 0, isClaimed: true, isToday: false, isLocked: false },
      { dayNumber: 2, rewardEth: 0.00010, rewardText: '+0.00010 ETH', bonusHashrateGhs: 0, isClaimed: true, isToday: false, isLocked: false },
      { dayNumber: 3, rewardEth: 0.00015, rewardText: '+0.00015 ETH', bonusHashrateGhs: 5, isClaimed: false, isToday: true, isLocked: false },
      { dayNumber: 4, rewardEth: 0.00020, rewardText: '+0.00020 ETH', bonusHashrateGhs: 5, isClaimed: false, isToday: false, isLocked: true },
      { dayNumber: 5, rewardEth: 0.00030, rewardText: '+0.00030 ETH', bonusHashrateGhs: 10, isClaimed: false, isToday: false, isLocked: true },
      { dayNumber: 6, rewardEth: 0.00045, rewardText: '+0.00045 ETH', bonusHashrateGhs: 15, isClaimed: false, isToday: false, isLocked: true },
      { dayNumber: 7, rewardEth: 0.00100, rewardText: '+0.00100 ETH + 30 GH/s', bonusHashrateGhs: 30, isClaimed: false, isToday: false, isLocked: true }
    ];

    return {
      currentStreak: 2,
      lastClaimTimestamp: Date.now() - 25 * 60 * 60 * 1000,
      days: defaultDays
    };
  });

  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`hashforge_streak_${user.id}`, JSON.stringify(streakData));
    } catch {}
  }, [streakData, user.id]);

  if (!isOpen) return null;

  const currentVipLevel = user.vipLevel || 1;
  const currentVip = VIP_TIERS.find(t => t.level === currentVipLevel) || VIP_TIERS[0];
  const nextVip = VIP_TIERS.find(t => t.level === currentVipLevel + 1);

  const todayIndex = streakData.days.findIndex(d => d.isToday);
  const todayDay = todayIndex !== -1 ? streakData.days[todayIndex] : null;
  const canClaimToday = todayDay && !todayDay.isClaimed;

  const handleClaim = () => {
    if (!todayDay || todayDay.isClaimed) return;

    const newDays = [...streakData.days];
    newDays[todayIndex] = {
      ...todayDay,
      isClaimed: true,
      isToday: false
    };

    if (todayIndex + 1 < newDays.length) {
      newDays[todayIndex + 1] = {
        ...newDays[todayIndex + 1],
        isToday: true,
        isLocked: false
      };
    }

    const newStreak = streakData.currentStreak + 1;

    setStreakData({
      currentStreak: newStreak,
      lastClaimTimestamp: Date.now(),
      days: newDays
    });

    onClaimDailyReward(todayDay.rewardEth, todayDay.bonusHashrateGhs || 0, todayDay.dayNumber);

    setClaimSuccess(`🎉 Day ${todayDay.dayNumber} Streak Claimed! Added ${todayDay.rewardEth} ETH to your balance.`);
    setTimeout(() => setClaimSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0d1424] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17233f] via-[#111a30] to-[#0c1220] p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">VIP Club & Daily Streak Rewards</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  LOYALTY PERKS
                </span>
              </div>
              <p className="text-xs text-slate-400">Check in daily for free ETH rewards & level up your VIP mining multiplier</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="bg-[#10182b] px-6 py-2.5 border-b border-slate-800 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('streak')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'streak'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-600" />
            <span>7-Day Daily Check-in Streak</span>
          </button>

          <button
            onClick={() => setActiveTab('vip')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vip'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-600" />
            <span>VIP Loyalty Tier Status</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-[#0a0f1d]">
          
          {claimSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{claimSuccess}</span>
            </div>
          )}

          {activeTab === 'streak' ? (
            <div className="space-y-6">
              
              {/* Streak Tracker Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141f38] via-[#10192e] to-[#0c1322] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                    <Flame className="w-7 h-7 fill-orange-500 text-orange-500 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white font-mono">{streakData.currentStreak} Days</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                        ACTIVE STREAK
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Maintain your daily check-in to unlock the Day 7 Mega Reward (+0.00100 ETH)!</p>
                  </div>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={!canClaimToday}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <Gift className="w-4 h-4" />
                  <span>{canClaimToday ? `Claim Day ${todayDay?.dayNumber} Reward` : 'Already Claimed for Today'}</span>
                </button>
              </div>

              {/* 7-Day Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {streakData.days.map((d) => (
                  <div
                    key={d.dayNumber}
                    className={`p-3 rounded-2xl border flex flex-col justify-between text-center transition-all ${
                      d.isClaimed
                        ? 'bg-[#101b30] border-emerald-500/40 text-slate-300'
                        : d.isToday
                        ? 'bg-[#1c2947] border-amber-500 shadow-md shadow-amber-500/10 text-white ring-2 ring-amber-500/20'
                        : 'bg-[#0e1628] border-slate-800/80 text-slate-500 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span>Day {d.dayNumber}</span>
                        {d.isClaimed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : d.isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>

                      <span className="text-xs font-bold block mt-1 font-mono text-amber-400">
                        {d.rewardEth} ETH
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      {d.isClaimed ? (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Claimed</span>
                      ) : d.isToday ? (
                        <span className="text-[10px] font-mono text-amber-300 font-bold uppercase animate-pulse">Ready</span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-600 uppercase">Locked</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Current Status Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141f38] via-[#10192e] to-[#0c1322] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono uppercase text-slate-400">Your Current Membership</span>
                    <h3 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                      <span>{currentVip.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono border ${currentVip.badgeBg}`}>
                        LEVEL {currentVip.level}
                      </span>
                    </h3>
                  </div>

                  {nextVip && (
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-mono text-slate-400">Next Tier Target:</span>
                      <span className="text-xs font-bold text-amber-400 block font-mono">
                        {nextVip.name} (${nextVip.minInvestmentUsd})
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>VIP Progress</span>
                    <span>{Math.min(100, Math.round((currentVip.level / 5) * 100))}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      style={{ width: `${Math.min(100, (currentVip.level / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* VIP Tier List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>VIP Tier Benefits Matrix</span>
                </h4>

                <div className="space-y-3">
                  {VIP_TIERS.map((tier) => (
                    <div
                      key={tier.level}
                      className={`p-4 rounded-2xl border transition-all ${
                        tier.level === currentVipLevel
                          ? 'bg-[#15213b] border-amber-500/60 shadow-md shadow-amber-500/10'
                          : 'bg-[#0f172a] border-slate-800/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${tier.color}`}>{tier.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">Min. ${tier.minInvestmentUsd}</span>
                            {tier.level === currentVipLevel && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {tier.perks.map((p, idx) => (
                              <span key={idx} className="text-[10px] font-mono bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-800">
                                ✓ {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-left sm:text-right font-mono shrink-0">
                          <span className="text-xs text-emerald-400 font-bold block">{tier.referralBonusPercent}% Referral Bonus</span>
                          <span className="text-[10px] text-slate-400">0% Platform Fee</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#11192c] px-6 py-4 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Guaranteed Hashrate & Tier Settlement</span>
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
