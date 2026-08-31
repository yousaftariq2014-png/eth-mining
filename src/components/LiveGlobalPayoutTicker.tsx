import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Coins,
  Globe,
  Sliders,
  Flame
} from 'lucide-react';

interface PayoutEvent {
  id: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'CONTRACT' | 'CUSTOM_POOL' | 'SWAP';
  walletMasked: string;
  amount: string;
  amountNumeric: number;
  network: string;
  timeAgo: string;
  highlightColor: string;
}

// Generates a realistic date-seeded base payout volume that changes every day
function getDailyBaseVolume(): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  
  // Deterministic seed for today's date
  const seed = (year * 365 + month * 31 + day) * 9301 + 49297;
  const pseudoRandom = ((seed % 233280) / 233280); // 0.0 to 1.0
  
  // Base volume between $1,450,000 and $2,850,000 USDT depending on the day
  const baseForDay = 1450000 + Math.floor(pseudoRandom * 1400000);
  
  // Add progressive volume based on current UTC hour & minute (0 to 24 hours)
  const minutesToday = now.getUTCHours() * 60 + now.getUTCMinutes();
  const progressRatio = minutesToday / 1440; // 0.0 to 1.0 throughout the day
  const dayProgressVolume = Math.floor(progressRatio * 420000);

  return baseForDay + dayProgressVolume;
}

// Generate random withdrawal amount strictly between $1,000 and $100,000
function generateWithdrawalAmount(): { formatted: string; numeric: number } {
  const tiers = [
    { min: 1000, max: 5000, weight: 0.35 },    // $1,000 - $5,000 (35%)
    { min: 5000, max: 20000, weight: 0.35 },   // $5,000 - $20,000 (35%)
    { min: 20000, max: 50000, weight: 0.20 },  // $20,000 - $50,000 (20%)
    { min: 50000, max: 100000, weight: 0.10 }  // $50,000 - $100,000 (10%)
  ];

  const rand = Math.random();
  let cumulative = 0;
  let selectedTier = tiers[0];

  for (const tier of tiers) {
    cumulative += tier.weight;
    if (rand <= cumulative) {
      selectedTier = tier;
      break;
    }
  }

  // Random round or 50-step value
  const rawAmount = selectedTier.min + Math.floor(Math.random() * ((selectedTier.max - selectedTier.min) / 50)) * 50;
  // Ensure strict min $1,000 and max $100,000
  const finalAmount = Math.max(1000, Math.min(100000, rawAmount));

  return {
    formatted: `${finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`,
    numeric: finalAmount
  };
}

const INITIAL_EVENTS: PayoutEvent[] = [
  {
    id: 'ev-1',
    type: 'WITHDRAWAL',
    walletMasked: '0x8f...3a1c',
    amount: '1,450.00 USDT',
    amountNumeric: 1450,
    network: 'TRC20',
    timeAgo: 'Just now',
    highlightColor: 'emerald'
  },
  {
    id: 'ev-2',
    type: 'CUSTOM_POOL',
    walletMasked: '0x1e...99b2',
    amount: 'Custom Rig ($50,000)',
    amountNumeric: 50000,
    network: 'Stratum ASIC',
    timeAgo: '1 min ago',
    highlightColor: 'cyan'
  },
  {
    id: 'ev-3',
    type: 'WITHDRAWAL',
    walletMasked: '0x4d...77e9',
    amount: '12,850.00 USDT',
    amountNumeric: 12850,
    network: 'TRC20',
    timeAgo: '2 mins ago',
    highlightColor: 'emerald'
  },
  {
    id: 'ev-4',
    type: 'WITHDRAWAL',
    walletMasked: '0x7a...d40e',
    amount: '48,200.00 USDT',
    amountNumeric: 48200,
    network: 'ERC20',
    timeAgo: '3 mins ago',
    highlightColor: 'emerald'
  },
  {
    id: 'ev-5',
    type: 'CONTRACT',
    walletMasked: '0x9b...11fa',
    amount: '48H Flash ($10,000)',
    amountNumeric: 10000,
    network: 'Lump-Sum',
    timeAgo: '4 mins ago',
    highlightColor: 'amber'
  },
  {
    id: 'ev-6',
    type: 'WITHDRAWAL',
    walletMasked: '0x2c...88d1',
    amount: '85,000.00 USDT',
    amountNumeric: 85000,
    network: 'TRC20',
    timeAgo: '5 mins ago',
    highlightColor: 'emerald'
  }
];

const RANDOM_WALLETS = [
  '0x3b...88aa', '0x7c...21f0', '0x12...99ef', '0x99...43bc',
  '0x5a...117d', '0xfe...8821', '0x6e...40ab', '0xaa...559c',
  '0x41...98bc', '0xd3...e710', '0x18...42c1', '0x7f...65d9',
  '0x20...319a', '0x88...f22c', '0x64...90ba', '0xee...0112'
];

const NETWORKS = ['TRC20', 'ERC20', 'TRC20', 'TRC20', 'POLYGON'];

export const LiveGlobalPayoutTicker: React.FC = () => {
  const [events, setEvents] = useState<PayoutEvent[]>(INITIAL_EVENTS);
  const [liveVolume, setLiveVolume] = useState<number>(() => getDailyBaseVolume());

  // Update base volume whenever date changes + increment on live events
  useEffect(() => {
    const dailyInterval = setInterval(() => {
      setLiveVolume(getDailyBaseVolume());
    }, 60000); // refresh time-of-day progress every minute

    return () => clearInterval(dailyInterval);
  }, []);

  // Periodically add new realistic live transaction items (Withdrawals $1,000 to $100,000)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomWallet = RANDOM_WALLETS[Math.floor(Math.random() * RANDOM_WALLETS.length)];
      const randomNetwork = NETWORKS[Math.floor(Math.random() * NETWORKS.length)];
      const { formatted, numeric } = generateWithdrawalAmount();
      
      const randType = Math.random();
      let evType: PayoutEvent['type'] = 'WITHDRAWAL';
      let displayAmount = formatted;
      let highlight = 'emerald';
      let net = randomNetwork;

      if (randType > 0.82 && numeric >= 10000) {
        evType = 'CUSTOM_POOL';
        displayAmount = `Custom Pool ($${numeric.toLocaleString()})`;
        highlight = 'cyan';
        net = 'Stratum Grid';
      } else if (randType > 0.70 && numeric <= 10000) {
        evType = 'CONTRACT';
        displayAmount = `48H Flash ($${numeric.toLocaleString()})`;
        highlight = 'amber';
        net = 'Lump-Sum';
      } else {
        evType = 'WITHDRAWAL';
        displayAmount = formatted;
        highlight = 'emerald';
        net = randomNetwork;
      }

      const newEv: PayoutEvent = {
        id: `ev-${Date.now()}`,
        type: evType,
        walletMasked: randomWallet,
        amount: displayAmount,
        amountNumeric: numeric,
        network: net,
        timeAgo: 'Just now',
        highlightColor: highlight
      };

      setEvents(prev => [newEv, ...prev.slice(0, 7)]);

      // Live accumulate into 24h payout volume
      if (evType === 'WITHDRAWAL') {
        setLiveVolume(prev => prev + numeric);
      }
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#080d19]/95 backdrop-blur-md border-y border-slate-800/80 py-2 px-3 sm:px-6 relative overflow-hidden z-20">
      
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 font-mono text-xs">
        
        {/* Left Badge: Protocol Live Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE SETTLEMENTS
          </span>
          <span className="text-slate-500 hidden md:inline text-[11px]">|</span>
          <span className="text-slate-400 text-[11px] hidden md:inline">$1k – $100k Instant Payouts</span>
        </div>

        {/* Center: Live Flowing Ticker Items */}
        <div className="flex-1 overflow-hidden w-full relative flex items-center justify-start sm:justify-center">
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-0.5">
            {events.slice(0, 3).map((ev, idx) => (
              <div
                key={ev.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border transition-all shrink-0 ${
                  idx === 0
                    ? 'border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10 scale-105'
                    : 'border-slate-800 text-slate-300'
                }`}
              >
                {ev.type === 'WITHDRAWAL' && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                {ev.type === 'CUSTOM_POOL' && (
                  <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                {ev.type === 'CONTRACT' && (
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                {ev.type === 'SWAP' && (
                  <Coins className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                {ev.type === 'DEPOSIT' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}

                <span className="text-slate-400 font-bold">{ev.walletMasked}</span>
                <span className="text-slate-600">→</span>
                <span className={`font-bold font-mono ${
                  ev.type === 'WITHDRAWAL' ? 'text-emerald-400' :
                  ev.type === 'CUSTOM_POOL' ? 'text-cyan-300' :
                  ev.type === 'CONTRACT' ? 'text-amber-400' : 'text-cyan-300'
                }`}>
                  {ev.amount}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] text-slate-400 border border-slate-800 font-mono">
                  {ev.network}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{ev.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Stats: 24h Settled Volume (Dynamically updates every day + ticks live) */}
        <div className="shrink-0 hidden lg:flex items-center gap-3 text-[11px] text-slate-400 font-mono bg-slate-900/60 px-3 py-1 rounded-xl border border-slate-800/80">
          <div>
            24h Settled Volume: <strong className="text-emerald-400 font-black">${liveVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</strong>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>Global Net</span>
          </div>
        </div>

      </div>

    </div>
  );
};

