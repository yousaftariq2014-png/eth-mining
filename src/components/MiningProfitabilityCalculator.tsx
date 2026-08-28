import React, { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Zap, 
  Coins, 
  Flame, 
  TrendingUp, 
  ArrowRight,
  Sliders,
  Check
} from 'lucide-react';
import { Language, SupportedCoin, CoinInfo } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface MiningProfitabilityCalculatorProps {
  language: Language;
  coins: Record<string, CoinInfo>;
}

export const MiningProfitabilityCalculator: React.FC<MiningProfitabilityCalculatorProps> = ({
  language,
  coins,
}) => {
  const t = TRANSLATIONS[language];

  // Form states
  const [selectedCoin, setSelectedCoin] = useState<SupportedCoin>('BTC');
  const [hashrate, setHashrate] = useState<number>(335);
  const [hashrateUnit, setHashrateUnit] = useState<string>('TH/s');
  const [powerWatts, setPowerWatts] = useState<number>(5360);
  const [electricityCostKwh, setElectricityCostKwh] = useState<number>(0.055);
  const [poolFeePercent, setPoolFeePercent] = useState<number>(1.0);

  const coin = coins[selectedCoin] || coins['BTC'];

  // Preset hardware selector
  const applyPreset = (presetName: string) => {
    if (presetName === 's21') {
      setSelectedCoin('BTC');
      setHashrate(335);
      setHashrateUnit('TH/s');
      setPowerWatts(5360);
    } else if (presetName === 'ks5') {
      setSelectedCoin('KAS');
      setHashrate(21);
      setHashrateUnit('TH/s');
      setPowerWatts(3150);
    } else if (presetName === 'rtx4090') {
      setSelectedCoin('ETC');
      setHashrate(980);
      setHashrateUnit('MH/s');
      setPowerWatts(1920);
    } else if (presetName === 'epyc') {
      setSelectedCoin('XMR');
      setHashrate(180);
      setHashrateUnit('kH/s');
      setPowerWatts(720);
    }
  };

  // Calculate gross daily coin yield based on simulated difficulty factor
  const calculateDailyYield = () => {
    let baseDailyCoin = 0;
    if (selectedCoin === 'BTC') {
      baseDailyCoin = (hashrate / 335) * 0.000128;
    } else if (selectedCoin === 'KAS') {
      baseDailyCoin = (hashrate / 21) * 92.5;
    } else if (selectedCoin === 'ETC') {
      baseDailyCoin = (hashrate / 980) * 0.285;
    } else if (selectedCoin === 'XMR') {
      baseDailyCoin = (hashrate / 180) * 0.026;
    } else if (selectedCoin === 'LTC') {
      baseDailyCoin = (hashrate / 100) * 0.082;
    } else {
      baseDailyCoin = (hashrate / 100) * 45;
    }

    const feeMultiplier = (100 - poolFeePercent) / 100;
    const netDailyCoin = baseDailyCoin * feeMultiplier;
    const dailyGrossUsd = netDailyCoin * coin.priceUsd;
    const dailyPowerCostUsd = ((powerWatts * 24) / 1000) * electricityCostKwh;
    const dailyNetProfitUsd = dailyGrossUsd - dailyPowerCostUsd;

    return {
      dailyCoin: netDailyCoin,
      dailyGrossUsd,
      dailyPowerCostUsd,
      dailyNetProfitUsd,
    };
  };

  const { dailyCoin, dailyGrossUsd, dailyPowerCostUsd, dailyNetProfitUsd } = calculateDailyYield();

  const periods = [
    { label: '1 Day (24 Hours)', factor: 1 },
    { label: '7 Days (1 Week)', factor: 7 },
    { label: '30 Days (1 Month)', factor: 30 },
    { label: '365 Days (1 Year)', factor: 365 },
  ];

  return (
    <div id="profitability-calculator-section" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <span>{t.calculator}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional Proof-of-Work profitability engine factoring live network difficulty and electricity costs.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-400 mr-1 font-mono">Presets:</span>
          <button
            id="preset-s21"
            onClick={() => applyPreset('s21')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-500/40 cursor-pointer"
          >
            Antminer S21 (BTC)
          </button>
          <button
            id="preset-ks5"
            onClick={() => applyPreset('ks5')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-200 border border-slate-700 hover:border-teal-500/40 cursor-pointer"
          >
            KS5 Pro (KAS)
          </button>
          <button
            id="preset-rtx4090"
            onClick={() => applyPreset('rtx4090')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-200 border border-slate-700 hover:border-emerald-500/40 cursor-pointer"
          >
            RTX 4090 8x (ETC)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Inputs */}
        <div className="lg:col-span-5 rounded-2xl bg-[#111726] border border-slate-800 p-6 space-y-5 shadow-sm">
          
          {/* Coin Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Mineable Coin & Algorithm
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(coins) as SupportedCoin[]).map((cSym) => {
                const c = coins[cSym];
                const isSel = selectedCoin === cSym;
                return (
                  <button
                    key={cSym}
                    id={`calc-coin-select-${cSym}`}
                    onClick={() => {
                      setSelectedCoin(cSym);
                      if (cSym === 'BTC') { setHashrate(335); setHashrateUnit('TH/s'); setPowerWatts(5360); }
                      else if (cSym === 'KAS') { setHashrate(21); setHashrateUnit('TH/s'); setPowerWatts(3150); }
                      else if (cSym === 'ETC') { setHashrate(980); setHashrateUnit('MH/s'); setPowerWatts(1920); }
                      else if (cSym === 'XMR') { setHashrate(180); setHashrateUnit('kH/s'); setPowerWatts(720); }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSel
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-black">{c.symbol}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.algorithm}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hashrate Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Mining Hashrate
            </label>
            <div className="flex items-center gap-2">
              <input
                id="calc-hashrate-input"
                type="number"
                value={hashrate}
                onChange={(e) => setHashrate(Number(e.target.value) || 0)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="px-3 py-2.5 bg-slate-800 text-amber-400 font-mono text-sm font-bold rounded-xl border border-slate-700">
                {hashrateUnit}
              </span>
            </div>
          </div>

          {/* Power Consumption (Watts) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Power Consumption
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">{powerWatts} Watts</span>
            </div>
            <input
              id="calc-power-slider"
              type="range"
              min="50"
              max="15000"
              step="50"
              value={powerWatts}
              onChange={(e) => setPowerWatts(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Electricity Cost ($/kWh) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Electricity Rate ($/kWh)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">${electricityCostKwh.toFixed(3)}/kWh</span>
            </div>
            <input
              id="calc-electricity-slider"
              type="range"
              min="0.01"
              max="0.25"
              step="0.005"
              value={electricityCostKwh}
              onChange={(e) => setElectricityCostKwh(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>$0.01 (Hydro/Renewable)</span>
              <span>$0.06 (Industrial)</span>
              <span>$0.25 (Residential)</span>
            </div>
          </div>

          {/* Pool Fee */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Mining Pool Fee (%)
              </label>
              <span className="text-xs font-mono font-bold text-slate-200">{poolFeePercent}%</span>
            </div>
            <input
              id="calc-pool-fee-slider"
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={poolFeePercent}
              onChange={(e) => setPoolFeePercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

        </div>

        {/* Right Output: Profit Projections */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Banner Outcome */}
          <div className="rounded-2xl bg-gradient-to-br from-[#111726] to-[#182238] border border-slate-800 p-6 shadow-md">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">
              Projected 24-Hour Net Earnings ({coin.name})
            </span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className={`text-4xl sm:text-5xl font-black font-mono ${dailyNetProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dailyNetProfitUsd >= 0 ? '+' : ''}${dailyNetProfitUsd.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-400 font-mono">/ Day Net</span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-2">
              Est. Yield: <strong className="text-amber-400">{dailyCoin.toFixed(6)} {coin.symbol}</strong> ($
              {dailyGrossUsd.toFixed(2)}) minus Electricity (-${dailyPowerCostUsd.toFixed(2)})
            </p>
          </div>

          {/* Comprehensive Multi-Period Breakdown Table */}
          <div className="rounded-2xl bg-[#111726] border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 bg-[#0e1422] border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Full Financial Forecast Timeline
              </h3>
              <span className="text-xs font-mono text-slate-400">
                1 {coin.symbol} = ${coin.priceUsd.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="p-3 font-semibold">Timeframe</th>
                    <th className="p-3 font-semibold">Coins Mined</th>
                    <th className="p-3 font-semibold">Gross Revenue</th>
                    <th className="p-3 font-semibold">Power Cost</th>
                    <th className="p-3 font-semibold text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {periods.map((p) => {
                    const coinMined = dailyCoin * p.factor;
                    const gross = dailyGrossUsd * p.factor;
                    const power = dailyPowerCostUsd * p.factor;
                    const net = dailyNetProfitUsd * p.factor;
                    const isPositive = net >= 0;

                    return (
                      <tr key={p.label} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-white whitespace-nowrap">{p.label}</td>
                        <td className="p-3 text-amber-400">{coinMined.toFixed(4)} {coin.symbol}</td>
                        <td className="p-3 text-slate-200">${gross.toFixed(2)}</td>
                        <td className="p-3 text-rose-400">-${power.toFixed(2)}</td>
                        <td className={`p-3 font-black text-right ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}${net.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
