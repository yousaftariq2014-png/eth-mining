import React, { useState } from 'react';
import { 
  Server, 
  Wifi, 
  ShieldCheck, 
  Copy, 
  Check, 
  Globe, 
  Zap, 
  Activity,
  Layers,
  Terminal
} from 'lucide-react';
import { Language, StratumPool, SupportedCoin } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface MiningPoolsMonitorProps {
  language: Language;
  pools: StratumPool[];
}

export const MiningPoolsMonitor: React.FC<MiningPoolsMonitorProps> = ({
  language,
  pools,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedMinerSoft, setSelectedMinerSoft] = useState<'asic' | 'gminer' | 'trex' | 'lolminer'>('asic');
  const [selectedPool, setSelectedPool] = useState<StratumPool>(pools[0]);
  const [selectedCoin, setSelectedCoin] = useState<SupportedCoin>('BTC');
  const [workerName, setWorkerName] = useState<string>('miner01');
  const [walletAddress, setWalletAddress] = useState<string>('bc1q9x7g84hf98a4z70lqk883m230vd4sq587pql');
  const [copiedConfig, setCopiedConfig] = useState(false);

  const generateConfigString = () => {
    const url = `${selectedPool.endpoint}:${selectedPool.port}`;
    if (selectedMinerSoft === 'asic') {
      return `URL: stratum+tcp://${url}\nWorker: ${walletAddress}.${workerName}\nPassword: x`;
    }
    if (selectedMinerSoft === 'gminer') {
      return `miner.exe --algo sha256 --server ${url} --user ${walletAddress}.${workerName} --pass x`;
    }
    if (selectedMinerSoft === 'trex') {
      return `t-rex.exe -a etchash -o stratum+tcp://${url} -u ${walletAddress}.${workerName} -p x`;
    }
    return `lolMiner.exe --algo KASPA --pool ${url} --user ${walletAddress}.${workerName}`;
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(generateConfigString());
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div id="mining-pools-section" className="space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            <span>{t.stratum_pools}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Distributed low-latency stratum nodes with multi-route failover, PPS+ / PPLNS payout schemes, and real-time luck telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>Global Stratum SLA: 99.98%</span>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pools.map((pool) => {
          const isSelected = selectedPool.id === pool.id;

          return (
            <div
              key={pool.id}
              id={`pool-node-${pool.id}`}
              onClick={() => setSelectedPool(pool)}
              className={`cursor-pointer rounded-2xl bg-[#111726] border p-5 transition-all ${
                isSelected
                  ? 'border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Region & Flag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{pool.flag}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{pool.region}</h3>
                    <span className="text-[10px] font-mono text-slate-400">{pool.endpoint}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-amber-400 border border-slate-700">
                  {pool.payoutScheme}
                </span>
              </div>

              {/* Latency / Ping indicator */}
              <div className="mt-4 p-2.5 rounded-xl bg-[#090d16] border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <Wifi className={`w-3.5 h-3.5 ${pool.latencyMs < 35 ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-slate-400">Ping:</span>
                  <span className={`font-bold ${pool.latencyMs < 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {pool.latencyMs} ms
                  </span>
                </div>
                <div className="text-slate-400">
                  Fee: <strong className="text-slate-200">{pool.feePercent}%</strong>
                </div>
              </div>

              {/* Pool Hashrate & Luck */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">Pool Hashrate</span>
                  <span className="font-bold text-slate-200">{pool.poolHashrate}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">24h Pool Luck</span>
                  <span className="font-bold text-emerald-400">{pool.luck24h}%</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Active Miners: {pool.activeMiners.toLocaleString()}</span>
                <span className="text-emerald-400 font-bold">PORT: {pool.port} / {pool.sslPort}</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Stratum Connection & Quick Config Generator */}
      <div className="rounded-2xl bg-[#111726] border border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">
            Quick Stratum Miner Config Generator
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls */}
          <div className="lg:col-span-6 space-y-4 text-xs">
            {/* Mining Software Preset */}
            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                Target Mining Hardware / Software
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'asic', label: 'ASIC Firmware' },
                  { id: 'gminer', label: 'GMiner (NVIDIA)' },
                  { id: 'trex', label: 'T-Rex Miner' },
                  { id: 'lolminer', label: 'lolMiner (Multi)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    id={`miner-soft-${s.id}`}
                    onClick={() => setSelectedMinerSoft(s.id as any)}
                    className={`py-2 px-2 text-center rounded-lg border font-semibold transition-all ${
                      selectedMinerSoft === s.id
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Address Input */}
            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                Payout Wallet Address
              </label>
              <input
                id="stratum-wallet-input"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Worker Name Input */}
            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                Worker Identifier
              </label>
              <input
                id="stratum-worker-input"
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Generated Code Snippet */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-xl bg-[#090d16] border border-slate-800 p-4 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="text-slate-400 font-bold">Ready Stratum Payload ({selectedPool.region})</span>
              <button
                id="copy-stratum-config-btn"
                onClick={handleCopyConfig}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedConfig ? 'Copied!' : 'Copy Config'}</span>
              </button>
            </div>

            <pre className="text-xs text-amber-300 py-3 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {generateConfigString()}
            </pre>

            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
              * Supports automatic Stratum v1 and v2 header renegotiation.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
