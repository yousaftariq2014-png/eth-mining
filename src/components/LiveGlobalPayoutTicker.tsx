import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Globe,
  Radio
} from 'lucide-react';

interface PayoutEvent {
  id: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'CONTRACT' | 'SWAP';
  walletMasked: string;
  amount: string;
  network: string;
  timeAgo: string;
  highlightColor: string;
}

const INITIAL_EVENTS: PayoutEvent[] = [
  {
    id: 'ev-1',
    type: 'WITHDRAWAL',
    walletMasked: '0x8f...3a1c',
    amount: '450.00 USDT',
    network: 'TRC20',
    timeAgo: 'Just now',
    highlightColor: 'emerald'
  },
  {
    id: 'ev-2',
    type: 'CONTRACT',
    walletMasked: '0x1e...99b2',
    amount: 'VIP-3 Flash 48H Pool',
    network: '2,500 USDT',
    timeAgo: '1 min ago',
    highlightColor: 'amber'
  },
  {
    id: 'ev-3',
    type: 'WITHDRAWAL',
    walletMasked: '0x4d...77e9',
    amount: '1,280.50 USDT',
    network: 'TRC20',
    timeAgo: '2 mins ago',
    highlightColor: 'emerald'
  },
  {
    id: 'ev-4',
    type: 'SWAP',
    walletMasked: '0x7a...d40e',
    amount: '0.45 ETH → USDT',
    network: 'Zero-Fee',
    timeAgo: '4 mins ago',
    highlightColor: 'cyan'
  },
  {
    id: 'ev-5',
    type: 'DEPOSIT',
    walletMasked: '0x9b...11fa',
    amount: '5,000 USDT (VIP-4)',
    network: 'ERC20',
    timeAgo: '5 mins ago',
    highlightColor: 'indigo'
  },
  {
    id: 'ev-6',
    type: 'WITHDRAWAL',
    walletMasked: '0x2c...88d1',
    amount: '890.00 USDT',
    network: 'TRC20',
    timeAgo: '7 mins ago',
    highlightColor: 'emerald'
  }
];

const RANDOM_WALLETS = [
  '0x3b...88aa', '0x7c...21f0', '0x12...99ef', '0x99...43bc',
  '0x5a...117d', '0xfe...8821', '0x6e...40ab', '0xaa...559c'
];

const RANDOM_AMOUNTS = [
  '120.00 USDT', '350.00 USDT', '680.00 USDT', '1,450.00 USDT',
  '2,800.00 USDT', '4,200.00 USDT', '750.00 USDT', '920.00 USDT'
];

export const LiveGlobalPayoutTicker: React.FC = () => {
  const [events, setEvents] = useState<PayoutEvent[]>(INITIAL_EVENTS);
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);

  // Periodically add new realistic live transaction items
  useEffect(() => {
    const interval = setInterval(() => {
      const randomWallet = RANDOM_WALLETS[Math.floor(Math.random() * RANDOM_WALLETS.length)];
      const randomAmount = RANDOM_AMOUNTS[Math.floor(Math.random() * RANDOM_AMOUNTS.length)];
      const isFlash = Math.random() > 0.65;
      
      const newEv: PayoutEvent = {
        id: `ev-${Date.now()}`,
        type: isFlash ? 'CONTRACT' : 'WITHDRAWAL',
        walletMasked: randomWallet,
        amount: isFlash ? `VIP Flash Pool (${randomAmount})` : `${randomAmount}`,
        network: 'TRC20',
        timeAgo: 'Just now',
        highlightColor: isFlash ? 'amber' : 'emerald'
      };

      setEvents(prev => [newEv, ...prev.slice(0, 7)]);
      setActiveEventIndex(prev => (prev + 1) % 5);
    }, 6500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#080d19]/90 backdrop-blur-md border-y border-slate-800/80 py-2 px-3 sm:px-6 relative overflow-hidden z-20">
      
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 font-mono text-xs">
        
        {/* Left Badge: Protocol Live Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE SETTLEMENTS
          </span>
          <span className="text-slate-500 hidden md:inline text-[11px]">|</span>
          <span className="text-slate-400 text-[11px] hidden md:inline">On-Chain Real-Time Feed</span>
        </div>

        {/* Center: Live Flowing Ticker Items */}
        <div className="flex-1 overflow-hidden w-full relative flex items-center justify-start sm:justify-center">
          <div className="flex items-center gap-6 animate-none sm:animate-pulse overflow-x-auto scrollbar-none py-0.5">
            {events.slice(0, 3).map((ev, idx) => (
              <div
                key={ev.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 border transition-all ${
                  idx === 0
                    ? 'border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'border-slate-800 text-slate-300'
                }`}
              >
                {ev.type === 'WITHDRAWAL' && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                {ev.type === 'CONTRACT' && (
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                {ev.type === 'SWAP' && (
                  <Coins className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                {ev.type === 'DEPOSIT' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}

                <span className="text-slate-400 font-bold">{ev.walletMasked}</span>
                <span className="text-slate-500">→</span>
                <span className={`font-bold ${
                  ev.type === 'WITHDRAWAL' ? 'text-emerald-400' :
                  ev.type === 'CONTRACT' ? 'text-amber-400' : 'text-cyan-300'
                }`}>
                  {ev.amount}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] text-slate-400 border border-slate-800">
                  {ev.network}
                </span>
                <span className="text-[10px] text-slate-500">{ev.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Stats: 24h Settled Volume */}
        <div className="shrink-0 hidden lg:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <div>
            24h Payout Volume: <strong className="text-emerald-400 font-black">$384,120.00 USDT</strong>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>Global Nodes</span>
          </div>
        </div>

      </div>

    </div>
  );
};
