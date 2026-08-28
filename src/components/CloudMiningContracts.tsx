import React, { useState } from 'react';
import { 
  Zap, 
  Check, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, CloudContract, SupportedCoin } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface CloudMiningContractsProps {
  language: Language;
  contracts: CloudContract[];
  onPurchaseContract: (contract: CloudContract) => void;
}

export const CloudMiningContracts: React.FC<CloudMiningContractsProps> = ({
  language,
  contracts,
  onPurchaseContract,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedCoin, setSelectedCoin] = useState<string>('ALL');
  const [purchasedId, setPurchasedId] = useState<string | null>(null);

  const handleBuy = (contract: CloudContract) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#06b6d4', '#ec4899'],
    });

    setPurchasedId(contract.id);
    onPurchaseContract(contract);
    setTimeout(() => setPurchasedId(null), 3000);
  };

  const filteredContracts = selectedCoin === 'ALL'
    ? contracts
    : contracts.filter((c) => c.coin === selectedCoin);

  return (
    <div id="cloud-contracts-section" className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-6 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              PACKAGES START FROM $100
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> 100% Guaranteed Hashrate Uptime
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Institutional Cloud Hashrate Contracts
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Rent high-efficiency hydro-cooled ASIC & GPU hashrate clusters located in carbon-neutral renewable facilities. Daily automated direct payouts to your wallet with zero maintenance fees.
          </p>
        </div>

        {/* Coin filter tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {['ALL', 'BTC', 'KAS'].map((coin) => (
            <button
              key={coin}
              id={`contract-filter-${coin}`}
              onClick={() => setSelectedCoin(coin)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedCoin === coin
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {coin === 'ALL' ? 'All Packages (5 Total)' : `${coin} Cloud Mining`}
            </button>
          ))}
        </div>
      </div>

      {/* Contract Cards Grid - 5 packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {filteredContracts.map((contract) => {
          const isPurchased = purchasedId === contract.id;

          return (
            <div
              key={contract.id}
              id={`contract-card-${contract.id}`}
              className={`relative flex flex-col justify-between rounded-2xl bg-[#111726] border p-5 transition-all ${
                contract.badge
                  ? 'border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Badge if hot */}
              {contract.badge && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md uppercase tracking-wider">
                  {contract.badge}
                </div>
              )}

              <div>
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                    {contract.tier}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-amber-400 font-mono border border-slate-700">
                    {contract.coin}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white mt-1">
                  {contract.title}
                </h3>

                {/* Hashrate display */}
                <div className="mt-3 p-3 rounded-xl bg-[#090d16] border border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-mono text-slate-400">Power:</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {contract.hashrate} {contract.hashrateUnit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                    <span>Algorithm:</span>
                    <span className="text-slate-200 font-semibold">{contract.algorithm}</span>
                  </div>
                </div>

                {/* Pricing & Projected Daily ROI */}
                <div className="mt-3 space-y-1.5 text-xs font-mono">
                  <div className="flex items-baseline justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">Price:</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-white font-mono">${contract.priceUsd}</span>
                      <span className="text-[10px] text-slate-400 block">/ {contract.durationDays} Days</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-emerald-400 pt-0.5">
                    <span>Est. Yield:</span>
                    <span className="font-bold">
                      +${contract.dailyEstimatedEarningsUsd.toFixed(2)}/day
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-cyan-400">
                    <span>Est. ROI:</span>
                    <span className="font-bold">
                      {contract.netEstimatedRoiPercent}%
                    </span>
                  </div>
                </div>

                {/* Features list */}
                <div className="mt-4 space-y-1.5">
                  {contract.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-[11px]">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <button
                  id={`buy-contract-btn-${contract.id}`}
                  onClick={() => handleBuy(contract)}
                  disabled={isPurchased}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isPurchased
                      ? 'bg-emerald-500 text-slate-950 font-extrabold'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {isPurchased ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Deployed to Cluster!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Deploy Contract</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
