import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Plus, 
  Server, 
  Zap, 
  Flame, 
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, MiningRig, SupportedCoin } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface NewRigModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onDeployRig: (newRig: MiningRig) => void;
}

export const NewRigModal: React.FC<NewRigModalProps> = ({
  isOpen,
  onClose,
  language,
  onDeployRig,
}) => {
  const t = TRANSLATIONS[language];
  if (!isOpen) return null;

  const [name, setName] = useState('Antminer S21 Immersion #2');
  const [type, setType] = useState<MiningRig['type']>('ASIC');
  const [coin, setCoin] = useState<SupportedCoin>('BTC');
  const [hashrate, setHashrate] = useState<number>(335);
  const [hashrateUnit, setHashrateUnit] = useState<'TH/s' | 'GH/s' | 'MH/s' | 'kH/s'>('TH/s');
  const [powerWatts, setPowerWatts] = useState<number>(5360);
  const [poolUrl, setPoolUrl] = useState('stratum+tcp://us-east.hashforge.io:3333');
  const [workerName, setWorkerName] = useState('hashforge_user.rig02');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const algoMap: Record<SupportedCoin, string> = {
      ETH: 'Ethash / PoS Stratum',
      BTC: 'SHA-256',
      KAS: 'kHeavyHash',
      ETC: 'Etchash',
      XMR: 'RandomX',
      LTC: 'Scrypt',
      DOGE: 'Scrypt (AuxPoW)',
      RVN: 'KawPOW',
    };

    const newRig: MiningRig = {
      id: `rig-${Date.now()}`,
      name,
      type,
      coin,
      algorithm: algoMap[coin] || 'SHA-256',
      hashrate,
      hashrateUnit,
      status: 'mining',
      tempCelsius: 56,
      targetTempCelsius: 60,
      powerWatts,
      fanSpeedPercent: 75,
      efficiencyJperTH: Number((powerWatts / Math.max(1, hashrate)).toFixed(1)),
      acceptedShares: 0,
      rejectedShares: 0,
      uptimeHours: 0,
      poolUrl,
      workerName,
      overclock: {
        coreClockOffsetMhz: 0,
        memoryClockOffsetMhz: 0,
        powerLimitPercent: 100,
        fanSpeedMode: 'auto',
        voltageOffsetMv: 0,
      },
    };

    onDeployRig(newRig);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0e1422] border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.add_rig}</h3>
              <p className="text-xs text-slate-400">Deploy ASIC, GPU Farm, or CPU node to HashForge Cluster</p>
            </div>
          </div>
          
          <button
            id="close-new-rig-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-mono">
          
          {/* Rig Name */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
              Rig Identifier Name
            </label>
            <input
              id="new-rig-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Hardware Type & Coin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                Hardware Category
              </label>
              <select
                id="new-rig-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="ASIC">ASIC Miner</option>
                <option value="GPU_RIG">GPU Mining Rig</option>
                <option value="CPU_ARRAY">CPU Array</option>
                <option value="CLOUD_CLUSTER">Cloud Cluster</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                Target Coin
              </label>
              <select
                id="new-rig-coin-select"
                value={coin}
                onChange={(e) => {
                  const newCoin = e.target.value as SupportedCoin;
                  setCoin(newCoin);
                  if (newCoin === 'BTC') { setHashrate(335); setHashrateUnit('TH/s'); setPowerWatts(5360); }
                  else if (newCoin === 'KAS') { setHashrate(21); setHashrateUnit('TH/s'); setPowerWatts(3150); }
                  else if (newCoin === 'ETC') { setHashrate(980); setHashrateUnit('MH/s'); setPowerWatts(1920); }
                  else if (newCoin === 'XMR') { setHashrate(180); setHashrateUnit('kH/s'); setPowerWatts(720); }
                }}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="KAS">KAS (Kaspa)</option>
                <option value="ETC">ETC (Ethereum Classic)</option>
                <option value="XMR">XMR (Monero)</option>
                <option value="LTC">LTC (Litecoin)</option>
                <option value="DOGE">DOGE (Dogecoin)</option>
              </select>
            </div>
          </div>

          {/* Hashrate & Wattage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                Hashrate ({hashrateUnit})
              </label>
              <input
                id="new-rig-hashrate-input"
                type="number"
                step="any"
                required
                value={hashrate}
                onChange={(e) => setHashrate(Number(e.target.value))}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                Power Draw (Watts)
              </label>
              <input
                id="new-rig-watts-input"
                type="number"
                required
                value={powerWatts}
                onChange={(e) => setPowerWatts(Number(e.target.value))}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Stratum Pool URL */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
              Stratum Pool URL
            </label>
            <input
              id="new-rig-pool-input"
              type="text"
              required
              value={poolUrl}
              onChange={(e) => setPoolUrl(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Submit */}
          <button
            id="submit-deploy-rig-btn"
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-md shadow-amber-500/20 cursor-pointer transition-all mt-4 font-sans"
          >
            <Zap className="w-4 h-4" />
            <span>Deploy & Start PoW Mining</span>
          </button>
        </form>

      </div>
    </div>
  );
};
