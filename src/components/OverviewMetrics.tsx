import React from 'react';
import { 
  Zap, 
  Cpu, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  Flame, 
  ArrowUpRight, 
  Wallet,
  Gauge
} from 'lucide-react';
import { Language, MiningRig } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface OverviewMetricsProps {
  language: Language;
  rigs: MiningRig[];
  isGlobalMiningActive: boolean;
  totalMinedUsd: number;
  openWalletModal: () => void;
  openNewRigModal: () => void;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  language,
  rigs,
  isGlobalMiningActive,
  totalMinedUsd,
  openWalletModal,
  openNewRigModal,
}) => {
  const t = TRANSLATIONS[language];

  // Calculate aggregated stats
  const activeRigs = rigs.filter((r) => r.status === 'mining');
  const totalPowerWatts = activeRigs.reduce((acc, r) => acc + (isGlobalMiningActive ? r.powerWatts : 0), 0);
  const totalAccepted = rigs.reduce((acc, r) => acc + r.acceptedShares, 0);
  const totalRejected = rigs.reduce((acc, r) => acc + r.rejectedShares, 0);
  const totalShares = totalAccepted + totalRejected;
  const shareEfficiency = totalShares > 0 ? ((totalAccepted / totalShares) * 100).toFixed(2) : '100.00';

  // Projected 24h revenue
  const estDailyRevenueUsd = isGlobalMiningActive ? 38.65 : 0;
  const estDailyPowerCostUsd = isGlobalMiningActive ? ((totalPowerWatts * 24) / 1000) * 0.055 : 0;
  const estNetProfitUsd = estDailyRevenueUsd - estDailyPowerCostUsd;

  return (
    <div id="overview-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* Metric 1: Total Active Hashrate */}
      <div className="relative overflow-hidden rounded-xl bg-[#111726] border border-slate-800 p-5 shadow-sm hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.active_hashrate}</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {isGlobalMiningActive ? '356.5' : '0.00'}
          </span>
          <span className="text-sm font-bold text-amber-400 font-mono">TH/s (Equiv.)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isGlobalMiningActive ? 'Stratum Connected' : 'Paused'}
          </span>
          <span className="font-mono">{activeRigs.length} of {rigs.length} Units</span>
        </div>
      </div>

      {/* Metric 2: Estimated 24h Gross & Net Yield */}
      <div className="relative overflow-hidden rounded-xl bg-[#111726] border border-slate-800 p-5 shadow-sm hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.daily_est_revenue}</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            ${estDailyRevenueUsd.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-emerald-400 font-mono">/ 24h</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Net Profit: <strong className="text-emerald-400 font-semibold">${estNetProfitUsd.toFixed(2)}</strong></span>
          <span className="text-slate-500">Power: -${estDailyPowerCostUsd.toFixed(2)}</span>
        </div>
      </div>

      {/* Metric 3: Power Consumption & Efficiency */}
      <div className="relative overflow-hidden rounded-xl bg-[#111726] border border-slate-800 p-5 shadow-sm hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.power_consumption}</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {(totalPowerWatts / 1000).toFixed(2)}
          </span>
          <span className="text-sm font-bold text-cyan-400 font-mono">kW</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Avg: 56°C
          </span>
          <span className="text-slate-300">Share Valid: <strong className="text-emerald-400">{shareEfficiency}%</strong></span>
        </div>
      </div>

      {/* Metric 4: Unpaid Balance & Wallet Direct Action */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#111726] to-[#171f33] border border-amber-500/30 p-5 shadow-md shadow-amber-500/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">{t.unpaid_balance}</span>
          <button
            id="overview-quick-withdraw-btn"
            onClick={openWalletModal}
            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-all"
            title={t.withdraw_btn}
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            ${totalMinedUsd.toFixed(2)}
          </span>
          <span className="text-xs text-slate-300 font-mono">USD</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">≈ 0.04829 BTC</span>
          <button
            id="overview-payout-text-btn"
            onClick={openWalletModal}
            className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            {t.withdraw_btn} &rarr;
          </button>
        </div>
      </div>

    </div>
  );
};
