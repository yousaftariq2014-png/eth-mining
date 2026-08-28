import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Zap, 
  DollarSign, 
  Flame, 
  Sliders, 
  Star, 
  ShieldCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Language, HardwareBenchmark } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface HardwareBenchmarkLabProps {
  language: Language;
  benchmarks: HardwareBenchmark[];
}

export const HardwareBenchmarkLab: React.FC<HardwareBenchmarkLabProps> = ({
  language,
  benchmarks,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'ASIC' | 'GPU' | 'CPU'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBenchmarks = benchmarks.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.algorithm.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div id="hardware-benchmark-section" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>{t.hardware_lab}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified silicon efficiency rankings, ASIC hashboard telemetry, and payback period benchmarks.
          </p>
        </div>

        {/* Search & Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs */}
          <div className="flex bg-[#0b0f17] p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['ALL', 'ASIC', 'GPU', 'CPU'] as const).map((cat) => (
              <button
                key={cat}
                id={`bench-cat-${cat}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="bench-search-input"
              type="text"
              placeholder="Search hardware..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0b0f17] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono w-44"
            />
          </div>
        </div>
      </div>

      {/* Benchmark Hardware Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBenchmarks.map((bench) => {
          return (
            <div
              key={bench.id}
              id={`bench-card-${bench.id}`}
              className="rounded-2xl bg-[#111726] border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between shadow-sm transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                      {bench.manufacturer} • {bench.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {bench.name}
                    </h3>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-amber-400 font-mono border border-slate-700">
                    {bench.primaryCoin}
                  </span>
                </div>

                {/* Hashrate & Wattage Badge */}
                <div className="mt-4 p-3 rounded-xl bg-[#090d16] border border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Hashrate</span>
                    <span className="font-extrabold text-amber-400 text-base">
                      {bench.hashrate} {bench.hashrateUnit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Power Draw</span>
                    <span className="font-extrabold text-cyan-400 text-base">
                      {bench.powerWatts}W
                    </span>
                  </div>
                </div>

                {/* Efficiency & MSRP */}
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Algorithm:</span>
                    <span className="text-slate-200 font-semibold">{bench.algorithm}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Efficiency Metric:</span>
                    <span className="text-emerald-400 font-bold">{bench.efficiency}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Estimated Hardware MSRP:</span>
                    <span className="text-white font-bold">${bench.msrpUsd.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Financial Returns Bottom Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/40 p-3 rounded-xl">
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-slate-400">Est. Daily Profit:</span>
                  <span className="text-emerald-400 font-black text-sm">
                    +${bench.dailyProfitUsd.toFixed(2)}/day
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                  <span>Payback Period:</span>
                  <span className="font-bold text-amber-400">
                    ≈ {bench.paybackDays} Days to ROI
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
