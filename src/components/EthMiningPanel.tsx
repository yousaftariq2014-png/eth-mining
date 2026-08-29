import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Cpu,
  Flame,
  Clock,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Server,
  Layers,
  Sparkles,
  Terminal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface EthMiningPanelProps {
  ethPriceUsd: number;
  ethPriceChange24h: number;
  onRefreshPrice?: () => void;
  isPriceRefreshing?: boolean;
  minedEthBalance: number;
  dailyEthRate: number;
  activeContractsCount: number;
  totalHashrateDisplay: string;
  onOpenExchangeModal: () => void;
  onOpenWithdrawModal: () => void;
  availableUsdtBalance: number;
}

export const EthMiningPanel: React.FC<EthMiningPanelProps> = ({
  ethPriceUsd,
  ethPriceChange24h,
  onRefreshPrice,
  isPriceRefreshing,
  minedEthBalance,
  dailyEthRate,
  activeContractsCount,
  totalHashrateDisplay,
  onOpenExchangeModal,
  onOpenWithdrawModal,
  availableUsdtBalance,
}) => {
  // Live micro-counter animation that realistically ticks up tiny fractions of mined ETH
  const [liveEthTicks, setLiveEthTicks] = useState<number>(0);
  const [sharesSolved, setSharesSolved] = useState<number>(1482);
  const [lastShareTime, setLastShareTime] = useState<string>('Just now');
  const [showMiniTerminal, setShowMiniTerminal] = useState<boolean>(false);
  const [miniLogs, setMiniLogs] = useState<Array<{ id: string; time: string; text: string; tag: string }>>([
    { id: '1', time: '15:38:12', text: 'ETH2.0 Stratum Engine connected to pool us-east.ethmining.org:8443', tag: 'STRATUM' },
    { id: '2', time: '15:39:04', text: 'PoS Validator consensus block #2184920 confirmed - share accepted', tag: 'VALIDATOR' },
    { id: '3', time: '15:39:48', text: 'Proof of Stake slot verified (Reward: +0.00012 ETH credited to node)', tag: 'REWARD' },
  ]);

  // Micro-tick increment for active nodes (smooth background update without UI flicker)
  useEffect(() => {
    if (activeContractsCount === 0) return;

    const interval = setInterval(() => {
      const perTick = dailyEthRate > 0 ? dailyEthRate / 43200 : 0.00000012;
      setLiveEthTicks(prev => prev + perTick);

      if (Math.random() > 0.4) {
        setSharesSolved(s => {
          const nextShare = s + 1;
          const now = new Date();
          const timeStr = now.toTimeString().substring(0, 8);
          setLastShareTime('Just now');

          setMiniLogs(prev => [
            {
              id: `${Date.now()}-${Math.random()}`,
              time: timeStr,
              text: `Stratum share #${nextShare} accepted (difficulty 8.4G, latency 14ms)`,
              tag: 'SHARE'
            },
            ...prev.slice(0, 6)
          ]);
          return nextShare;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeContractsCount, dailyEthRate]);

  const effectiveEthBalance = minedEthBalance + liveEthTicks;
  const ethValueInUsdt = effectiveEthBalance * ethPriceUsd;

  return (
    <div id="eth-live-mining-panel" className="w-full rounded-3xl bg-gradient-to-br from-[#0a0f1d] via-[#0d1527] to-[#070b14] border border-cyan-500/30 p-5 sm:p-6 lg:p-7 shadow-2xl relative overflow-hidden space-y-6">
      
      {/* Decorative High-Tech Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Bar: Node Status & Live ETH Price Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 relative z-10">
        
        {/* Left: Node Header & Cluster Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Cpu className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>ETH2.0 Cloud Mining Console</span>
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {activeContractsCount > 0 ? 'STRATUM ACTIVE' : 'STANDBY READY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Cluster: <strong className="text-slate-300">ETH2-Global-Node-04</strong></span>
                <span className="text-slate-600">•</span>
                <span>Algorithm: <strong className="text-cyan-400">ETH2.0 / Ethash PoS</strong></span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="hidden sm:inline text-slate-400">SSL Port: <strong className="text-slate-300">8443</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Live Updated ETH Price Ticker Box */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-slate-950/80 border border-slate-800 p-3 rounded-2xl shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm font-mono">
            ETH
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <span>Live Ethereum Price (USDT)</span>
              <button
                onClick={onRefreshPrice}
                className="text-slate-400 hover:text-cyan-300 cursor-pointer transition-transform active:rotate-180"
                title="Refresh Live ETH Price"
              >
                <RefreshCw className={`w-3 h-3 ${isPriceRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-mono">
              <span className="text-base sm:text-lg font-black text-white tracking-tight">
                ${ethPriceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-bold flex items-center ${ethPriceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ethPriceChange24h >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {ethPriceChange24h >= 0 ? '+' : ''}{ethPriceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Primary Mining Display Grid (Live ETH Mined Ticker + Real-Time Telemetry Stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        
        {/* Left (7 cols): Main Live ETH Mined Counter & Direct Exchange Action */}
        <div className="lg:col-span-7 rounded-2xl bg-[#090e1a] border border-cyan-500/25 p-5 space-y-4 shadow-xl">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
              LIVE ACCUMULATED MINED REVENUE
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Auto-Credited Realtime
            </span>
          </div>

          {/* Big Glowing ETH Counter */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#070b14] via-[#0d162a] to-[#070b14] border border-slate-800 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                Total Mined ETH Available
              </span>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-mono tracking-tight text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]">
                {effectiveEthBalance.toFixed(8)} <span className="text-sm font-bold text-cyan-400">ETH</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
                <span>≈</span>
                <strong className="text-emerald-400 font-bold">
                  ${ethValueInUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </strong>
                <span className="text-slate-500">(@ ${ethPriceUsd.toFixed(2)}/ETH)</span>
              </div>
            </div>

            {/* Quick Exchange Action Button */}
            <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-1.5">
              <button
                onClick={onOpenExchangeModal}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Exchange ETH to USDT</span>
              </button>
              <span className="text-[10px] font-mono text-slate-400 text-center sm:text-right">
                Convert to USDT for direct withdrawal
              </span>
            </div>
          </div>

          {/* Quick Dual Wallet Balance Strip */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-[10px] text-slate-500 block">Mined ETH Balance</span>
              <div className="text-sm font-black text-cyan-300 font-mono mt-0.5 truncate">
                {effectiveEthBalance.toFixed(6)} ETH
              </div>
              <span className="text-[10px] text-slate-400">
                ≈ ${ethValueInUsdt.toFixed(2)} USDT
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-[10px] text-slate-500 block">Available USDT Wallet</span>
              <div className="text-sm font-black text-emerald-400 font-mono mt-0.5 truncate">
                ${availableUsdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </div>
              <span className="text-[10px] text-emerald-400/80">
                Ready for withdrawal
              </span>
            </div>
          </div>

        </div>

        {/* Right (5 cols): Live Hardware Telemetry Grid */}
        <div className="lg:col-span-5 rounded-2xl bg-[#090e1a] border border-slate-800 p-5 space-y-3.5 shadow-xl flex flex-col justify-between">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              HARDWARE & HASHRATE STATS
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              99.8% Eff
            </span>
          </div>

          {/* 4 Metric Tiles */}
          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Total Hashrate</span>
              <div className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">
                {totalHashrateDisplay}
              </div>
              <span className="text-[9px] text-emerald-400">Online & Hashing</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Daily ETH Yield</span>
              <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5 truncate">
                {dailyEthRate.toFixed(6)} ETH
              </div>
              <span className="text-[9px] text-slate-400">≈ ${(dailyEthRate * ethPriceUsd).toFixed(2)}/day</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Valid Shares</span>
              <div className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5">
                {sharesSolved.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/ 0 rej</span>
              </div>
              <span className="text-[9px] text-slate-400">Last: {lastShareTime}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Cluster Temp / Fan</span>
              <div className="text-xs sm:text-sm font-black text-cyan-300 mt-0.5">
                52°C <span className="text-[10px] font-normal text-slate-400">| 64%</span>
              </div>
              <span className="text-[9px] text-cyan-400">Optimal Cool</span>
            </div>

          </div>

          {/* 6-Hour Cycle Progress Bar */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                6-Hour Distribution Cycle
              </span>
              <span className="text-cyan-400 font-bold">4 Times Daily</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full w-3/4 animate-pulse" />
            </div>
          </div>

        </div>

      </div>

      {/* 3. Mini Live Stratum Console Logs (Collapsible) */}
      <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-3.5 space-y-2 relative z-10 font-mono text-xs">
        <div 
          onClick={() => setShowMiniTerminal(!showMiniTerminal)}
          className="flex items-center justify-between cursor-pointer select-none text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-[11px]">Live Stratum Mining Feed ({sharesSolved} Shares Verified)</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>{showMiniTerminal ? 'Hide Terminal' : 'Show Terminal'}</span>
            {showMiniTerminal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        {showMiniTerminal && (
          <div className="pt-2 border-t border-slate-800 space-y-1 max-h-32 overflow-y-auto no-scrollbar text-[11px]">
            {miniLogs.map((l) => (
              <div key={l.id} className="flex items-start gap-2 text-slate-400 hover:text-slate-200">
                <span className="text-slate-600 text-[10px]">{l.time}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {l.tag}
                </span>
                <span className="truncate text-slate-300">{l.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
