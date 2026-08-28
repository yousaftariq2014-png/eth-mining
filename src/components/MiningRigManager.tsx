import React from 'react';
import { 
  Cpu, 
  Play, 
  Pause, 
  Sliders, 
  Flame, 
  Fan, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus,
  Zap,
  Server,
  AlertTriangle
} from 'lucide-react';
import { Language, MiningRig, SupportedCoin } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface MiningRigManagerProps {
  language: Language;
  rigs: MiningRig[];
  toggleRigMining: (id: string) => void;
  openOverclockModal: (rig: MiningRig) => void;
  openNewRigModal: () => void;
  deleteRig?: (id: string) => void;
}

export const MiningRigManager: React.FC<MiningRigManagerProps> = ({
  language,
  rigs,
  toggleRigMining,
  openOverclockModal,
  openNewRigModal,
}) => {
  const t = TRANSLATIONS[language];

  const getStatusBadge = (status: MiningRig['status']) => {
    switch (status) {
      case 'mining':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t.status_mining}
          </span>
        );
      case 'idle':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/40 text-slate-400 border border-slate-600/30">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t.status_idle}
          </span>
        );
      case 'overheating':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            {t.status_overheating}
          </span>
        );
      case 'maintenance':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {t.status_maintenance}
          </span>
        );
    }
  };

  const getCoinBadgeColor = (coin: SupportedCoin) => {
    switch (coin) {
      case 'BTC': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'KAS': return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'ETC': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'XMR': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'LTC': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'DOGE': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default: return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div id="rig-manager-section" className="space-y-4">
      
      {/* Header bar with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>{t.rig_manager}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
              {rigs.length} Units
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry, ASIC chip temperature, fan profiles & Stratum PoW share tracking.
          </p>
        </div>

        <button
          id="deploy-rig-button"
          onClick={openNewRigModal}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.add_rig}</span>
        </button>
      </div>

      {/* Rigs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rigs.map((rig) => {
          const isMining = rig.status === 'mining';
          const isHot = rig.tempCelsius > 65;

          return (
            <div
              key={rig.id}
              id={`rig-card-${rig.id}`}
              className="relative flex flex-col justify-between rounded-xl bg-[#111726] border border-slate-800 hover:border-slate-700 p-5 shadow-sm transition-all"
            >
              <div>
                {/* Card Top: Name, Coin & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border ${getCoinBadgeColor(rig.coin)}`}>
                        {rig.coin}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">
                        {rig.type} • {rig.algorithm}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {rig.name}
                    </h3>
                  </div>
                  {getStatusBadge(rig.status)}
                </div>

                {/* Primary Hashrate Display */}
                <div className="mt-4 p-3 rounded-lg bg-[#0b0f17] border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Active Hashrate</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-black font-mono ${isMining ? 'text-amber-400' : 'text-slate-500'}`}>
                        {isMining ? rig.hashrate.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        {rig.hashrateUnit}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Power Draw</span>
                    <div className="flex items-baseline justify-end gap-1 font-mono">
                      <span className={`text-base font-bold ${isMining ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {isMining ? rig.powerWatts : 0}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Watts</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono">
                  {/* Temp */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                      <Flame className={`w-3 h-3 ${isHot ? 'text-rose-400' : 'text-amber-400'}`} />
                      <span>{t.temp}</span>
                    </div>
                    <span className={`font-bold text-sm ${isHot ? 'text-rose-400' : 'text-slate-200'}`}>
                      {isMining ? `${rig.tempCelsius}°C` : '--'}
                    </span>
                  </div>

                  {/* Fan Speed */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                      <Fan className={`w-3 h-3 ${isMining ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
                      <span>{t.fans}</span>
                    </div>
                    <span className="font-bold text-sm text-slate-200">
                      {isMining ? `${rig.fanSpeedPercent}%` : '0%'}
                    </span>
                  </div>

                  {/* Shares A/R */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{t.shares}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-200">
                      <span className="text-emerald-400">{rig.acceptedShares}</span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-rose-400">{rig.rejectedShares}</span>
                    </div>
                  </div>
                </div>

                {/* Stratum & Worker string */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800/50">
                  <span className="truncate max-w-[200px]" title={rig.poolUrl}>
                    {rig.poolUrl}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {rig.uptimeHours}h
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                <button
                  id={`rig-toggle-btn-${rig.id}`}
                  onClick={() => toggleRigMining(rig.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isMining
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {isMining ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{t.pause_mining}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{t.start_mining}</span>
                    </>
                  )}
                </button>

                <button
                  id={`rig-overclock-btn-${rig.id}`}
                  onClick={() => openOverclockModal(rig)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-500/40 hover:text-white transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.overclock_btn}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
