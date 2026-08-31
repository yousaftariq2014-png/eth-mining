import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Cpu,
  Zap,
  TrendingUp,
  ShieldCheck,
  Server,
  ArrowRight,
  Sparkles,
  Layers,
  Coins,
  CheckCircle2
} from 'lucide-react';
import { MiningPackage } from '../types';
import {
  CUSTOM_PACKAGE_MIN_USD,
  CUSTOM_PACKAGE_MAX_USD,
  calculateCustomPackageRates,
  createCustomMiningPackage
} from '../data/packagesData';

interface CustomPackageBuilderProps {
  onSelectPackage: (pkg: MiningPackage) => void;
  ethPriceUsd?: number;
  compact?: boolean;
}

const PRESET_AMOUNTS = [10000, 25000, 50000, 75000, 100000, 150000, 200000];

export const CustomPackageBuilder: React.FC<CustomPackageBuilderProps> = ({
  onSelectPackage,
  ethPriceUsd = 2750,
  compact = false
}) => {
  const [amount, setAmount] = useState<number>(25000);
  const [selectedDuration, setSelectedDuration] = useState<number>(365);

  const rates = useMemo(() => {
    return calculateCustomPackageRates(amount);
  }, [amount]);

  const customPkg = useMemo(() => {
    return createCustomMiningPackage(amount, selectedDuration);
  }, [amount, selectedDuration]);

  const dailyEth = ethPriceUsd > 0 ? (rates.dailyReturnUsd / ethPriceUsd) : 0;
  const sixHourEth = dailyEth / 4;
  const monthlyEth = dailyEth * 30;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAmount(val);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      setAmount(val);
    }
  };

  const handleBlur = () => {
    if (amount < CUSTOM_PACKAGE_MIN_USD) {
      setAmount(CUSTOM_PACKAGE_MIN_USD);
    } else if (amount > CUSTOM_PACKAGE_MAX_USD) {
      setAmount(CUSTOM_PACKAGE_MAX_USD);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#0b1329] via-[#070d1d] to-[#040813] border border-cyan-500/30 rounded-2xl p-4 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Institutional Custom Pool
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">
              $10,000 – $200,000 Max
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Build Your Custom Enterprise Mining Rig
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Configure your custom capital allocation to receive dedicated hydro-immersion ASIC clusters with guaranteed daily automated payouts.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl">
          <Server className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Allocated Hashpower</div>
            <div className="text-sm font-bold text-cyan-300">{rates.hashrate.toLocaleString()} TH/s</div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 relative z-10">
        
        {/* Left Column: Interactive Sliders & Presets (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Capital Allocation Input & Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300 font-bold uppercase flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Select Investment Capital (USDT)
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                Rate: {rates.dailyRate.toFixed(2)}% Daily
              </span>
            </div>

            {/* Custom Input Box */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 font-mono">$</span>
              <input
                type="number"
                min={CUSTOM_PACKAGE_MIN_USD}
                max={CUSTOM_PACKAGE_MAX_USD}
                step={1000}
                value={amount}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full bg-slate-950/80 border border-cyan-500/40 rounded-xl py-3 pl-9 pr-24 text-xl sm:text-2xl font-black text-white font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                USDT
              </span>
            </div>

            {/* Range Slider */}
            <div className="space-y-1 pt-2">
              <input
                type="range"
                min={CUSTOM_PACKAGE_MIN_USD}
                max={CUSTOM_PACKAGE_MAX_USD}
                step={1000}
                value={amount}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>$10,000 (Min)</span>
                <span>$50,000</span>
                <span>$100,000</span>
                <span>$200,000 (Max)</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="pt-2">
              <div className="text-[11px] font-mono text-slate-400 mb-2">Quick Preset Tiers:</div>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      amount === p
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    ${(p / 1000)}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tier Rate Explanation Banner */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-300">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white mb-0.5">{rates.tierName}</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {amount < 30000 && 'Tier 1 Rate: 2.60% daily fixed output for capital between $10k and $30k.'}
                {amount >= 30000 && amount < 50000 && 'Tier 2 Enterprise Rate: 2.80% daily fixed output for capital between $30k and $50k.'}
                {amount >= 50000 && amount < 100000 && 'Tier 3 Diamond Rate: 3.00% daily fixed output for capital between $50k and $100k.'}
                {amount >= 100000 && 'Tier 4 Sovereign Megawatt Rate: 3.20% maximum institutional yield cap for $100k to $200k.'}
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Live Projected Returns & Direct Deploy Button (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/90 border border-cyan-500/30 rounded-xl p-5 space-y-5">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-slate-400 uppercase">Contract Summary</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold">
                {rates.tierBadge}
              </span>
            </div>

            {/* Daily Profit Box */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 rounded-xl p-3.5">
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase flex items-center justify-between">
                <span>Daily Mining Output</span>
                <span>{rates.dailyRate.toFixed(2)}% / Day</span>
              </div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                +${rates.dailyReturnUsd.toLocaleString()} <span className="text-xs text-emerald-400">USDT</span>
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ≈ {dailyEth.toFixed(4)} ETH / day ({sixHourEth.toFixed(4)} ETH every 6h)
              </div>
            </div>

            {/* 3-Way Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400">Weekly Output (7D)</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  +${rates.weeklyProjectedUsd.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400">Monthly Output (30D)</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  +${rates.monthlyProjectedUsd.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Included Specs List */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Dedicated Stratum Cluster ({rates.hashrate.toLocaleString()} TH/s)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>4-Cycle Automatic Distribution Every 6 Hours</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>100% Instant USDT Exchange & Non-Custodial Withdrawals</span>
              </div>
            </div>
          </div>

          {/* Action Deploy Button */}
          <button
            type="button"
            onClick={() => onSelectPackage(customPkg)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
          >
            <span>Deploy Custom Rig (${amount.toLocaleString()})</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

      </div>
    </div>
  );
};
