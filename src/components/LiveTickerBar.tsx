import React from 'react';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';
import { CoinInfo } from '../types';

interface LiveTickerBarProps {
  coins: Record<string, CoinInfo>;
  networkStats: {
    activeMinersGlobal: number;
    activePoolsGlobal: number;
    totalBlocksMinedToday: number;
    estimatedNextDiffAdjustment: string;
  };
}

export const LiveTickerBar: React.FC<LiveTickerBarProps> = ({ coins, networkStats }) => {
  const coinList: CoinInfo[] = Object.values(coins);

  return (
    <div id="live-ticker-bar" className="w-full bg-[#080c14] border-b border-slate-800/80 py-1.5 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Responsive flex / scrollable bar where all items including right-side network stats are smoothly accessible */}
        <div className="flex items-center justify-between gap-4 text-xs">
          
          {/* Scrollable Container covering both live coin prices and global network features on all screens */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-0.5 touch-pan-x w-full">
            
            {/* Live Indicator Badge */}
            <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>LIVE POOLS</span>
            </div>

            {/* Live Coin Prices */}
            {coinList.map((coin) => {
              const isPositive = coin.change24h >= 0;
              return (
                <div key={coin.symbol} className="flex items-center gap-1.5 sm:gap-2 font-mono whitespace-nowrap shrink-0 text-xs">
                  <span className="font-bold text-slate-200">{coin.symbol}</span>
                  <span className="text-slate-300">
                    ${coin.priceUsd < 1 ? coin.priceUsd.toFixed(4) : coin.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`flex items-center text-[10px] font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {isPositive ? '+' : ''}{coin.change24h}%
                  </span>
                  <span className="text-slate-800">|</span>
                </div>
              );
            })}

            {/* Live Network Features (Accessible in scroll on mobile & right-anchored on large screens) */}
            <div className="flex items-center gap-3 sm:gap-4 font-mono text-[11px] whitespace-nowrap shrink-0 text-slate-400 pl-1 border-l border-slate-800">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Next Diff: <strong className="text-slate-200">{networkStats.estimatedNextDiffAdjustment}</strong></span>
              </div>
              <span className="text-slate-800">|</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Miners: <strong className="text-slate-200">{networkStats.activeMinersGlobal.toLocaleString()}</strong></span>
              </div>
              <span className="text-slate-800">|</span>
              <div className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>24h Blocks: <strong className="text-slate-200">{networkStats.totalBlocksMinedToday}</strong></span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
