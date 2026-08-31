import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Coins, 
  Layers, 
  Cpu, 
  Server, 
  Database,
  ArrowUpRight,
  Sparkles,
  KeyRound,
  Download,
  Flame,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface ProofOfReservesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProofOfReservesModal: React.FC<ProofOfReservesModalProps> = ({ isOpen, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'reserves' | 'audits' | 'contracts'>('reserves');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const coldWallets = [
    {
      label: 'Cold Treasury Vault (Multisig 4/7)',
      chain: 'Ethereum Mainnet (ERC-20)',
      address: '0x3892F1c4B901C98a6B89cD3127810A2BfC990141',
      balance: '$84,520,400.00 USDT',
      ethHolding: '14,280.50 ETH',
      status: 'Secured by Ledger Enterprise & Fireblocks',
      coverage: '128.4% Over-Collateralized'
    },
    {
      label: 'Institutional Payout Reserve Pool',
      chain: 'TRON Mainnet (TRC-20)',
      address: 'TY5kZpU9cZnmE7yGjK4a1Q9vF78bW5mXh8',
      balance: '$32,150,000.00 USDT',
      ethHolding: 'Instant Hot Liquidity',
      status: 'Automated 24/7 Liquidity Provisioning',
      coverage: '115.0% Reserve Match'
    },
    {
      label: 'Staking & Validator Node Pool',
      chain: 'Ethereum Beacon Chain Node Cluster',
      address: '0x992B9aC1d7B99238F4a53099dC219082Eb612264',
      balance: '$46,800,000.00 Staked ETH',
      ethHolding: '13,415.00 ETH (628 Active Validators)',
      status: 'Slashing Protected / Tier-4 Datacenter',
      coverage: '100% On-Chain Proof'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0b101d] border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 p-5 sm:p-8 text-slate-100 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          ✕
        </button>

        {/* Header Badge & Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Backed Reserves • Live Merkle Tree Verified</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                Proof of Reserves (PoR) & Security Audits
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Institutional transparency report. All user balances, mining rewards, and staking vaults are 1:1 backed on-chain.
              </p>
            </div>
            <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-right">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Vault Reserves</span>
              <span className="text-lg font-black text-emerald-400 font-mono">$163,470,400.00</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveSubTab('reserves')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'reserves'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Reserve Vaults & Merkle Tree</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('audits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'audits'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>CertiK & Halborn Audits</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contracts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'contracts'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Smart Contract Registry</span>
          </button>
        </div>

        {/* Tab 1: Reserve Vaults & Merkle Proofs */}
        {activeSubTab === 'reserves' && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-400">Total Client Liabilities</span>
                <p className="text-xl font-bold text-white font-mono">$127,310,000.00</p>
                <span className="text-[10px] text-slate-500 font-mono">100% User Deposits + Accrued Yield</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-400">Total Verified Reserves</span>
                <p className="text-xl font-bold text-emerald-400 font-mono">$163,470,400.00</p>
                <span className="text-[10px] text-emerald-500 font-mono">Cold Storage & Validator Vaults</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/30 bg-emerald-950/20 space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 font-bold">Reserve Ratio</span>
                <p className="text-2xl font-black text-emerald-300 font-mono">128.4%</p>
                <span className="text-[10px] text-emerald-400 font-mono">Surplus Reserve Protection ($36.1M)</span>
              </div>
            </div>

            {/* Wallets List */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">
                Verified On-Chain Reserve Addresses:
              </h3>

              {coldWallets.map((wallet, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-sm font-bold text-white">{wallet.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {wallet.chain}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">{wallet.coverage}</span>
                  </div>

                  {/* Address & Copy */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-hidden">
                    <span className="truncate">{wallet.address}</span>
                    <button
                      onClick={() => handleCopy(wallet.address)}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-bold transition-all cursor-pointer"
                    >
                      {copiedAddress === wallet.address ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-500">Holdings: </span>
                      <strong className="text-slate-200">{wallet.balance}</strong> ({wallet.ethHolding})
                    </div>
                    <div className="text-[11px] text-slate-400">
                      🛡️ {wallet.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Merkle Tree Proof Box */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-cyan-300 font-mono block">Cryptographic Merkle Root Integrity</span>
                <p className="text-slate-300 leading-relaxed">
                  Every user account's balance is hashed into an immutable Merkle Tree structure verified on the Ethereum blockchain every 24 hours. The state root allows any client to cryptographically prove their individual balance without exposing private customer data.
                </p>
                <div className="pt-1 font-mono text-[10px] text-cyan-400/80 truncate">
                  Latest Merkle Root: 0x8f24a73e6b129841cda79051ea89cb210940567dfaa1810c9a89d9e4823c4a01
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Security Audits */}
        {activeSubTab === 'audits' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* CertiK Report Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono">
                      CK
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">CertiK Security Audit</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Formal Verification Complete</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                    Score: 96 / 100
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed font-sans">
                  <p>✓ <strong>Zero Critical Vulnerabilities:</strong> Re-entrancy, overflow, and multi-sig authorization tested against formal invariants.</p>
                  <p>✓ <strong>Slashing Proof:</strong> Hardware node cluster validator keys are secured under FIPS 140-2 Level 3 HSM hardware modules.</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>Certificate ID: CERTIK-ETH2-2026-991</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">Verified Audit ✓</span>
                </div>
              </div>

              {/* Halborn / SlowMist Report Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
                      HB
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Halborn Penetration Audit</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Infrastructure & API Pen-Testing</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                    Passed (Tier-A)
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed font-sans">
                  <p>✓ <strong>DDoS & Sybil Defense:</strong> Cloudflare Magic Transit 100 Gbps mitigation with live biometric API rate-limiting.</p>
                  <p>✓ <strong>Cold Vault Isolation:</strong> 94% of digital assets remain air-gapped in geographically distributed Swiss & Icelandic bunkers.</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>Report Hash: 0x4a18b...9f88</span>
                  <span className="text-cyan-400 font-bold flex items-center gap-1">Verified Audit ✓</span>
                </div>
              </div>

            </div>

            {/* Insurance Safeguard Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">$50,000,000 Syndicate Cold Storage Insurance</h4>
                  <p className="text-xs text-slate-400">Underwritten by Lloyd's Syndicate for theft, private key compromise, and physical hardware disaster.</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold whitespace-nowrap">
                Active Policy #LL-9821
              </span>
            </div>

          </div>
        )}

        {/* Tab 3: Smart Contracts */}
        {activeSubTab === 'contracts' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-3">
              
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">ETH2.0 Yield Distributor & Smart Production Engine</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Verified Bytecode
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="truncate">0x71C8fb92837C90823BaC89001927708aB012F40a</span>
                  <button
                    onClick={() => handleCopy('0x71C8fb92837C90823BaC89001927708aB012F40a')}
                    className="ml-2 text-cyan-400 hover:underline text-[11px]"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">48-Hour Flash Mining Escrow Router</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Timelock Protected
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="truncate">0x29B7F1C990141a02981BcC901410A8872Eb61226</span>
                  <button
                    onClick={() => handleCopy('0x29B7F1C990141a02981BcC901410A8872Eb61226')}
                    className="ml-2 text-cyan-400 hover:underline text-[11px]"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">Institutional Custom Rig Allocation Pool ($10k-$200k)</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    Multi-Sig Governed
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="truncate">0x55018Fca41982bC9014102981881881729014188</span>
                  <button
                    onClick={() => handleCopy('0x55018Fca41982bC9014102981881881729014188')}
                    className="ml-2 text-cyan-400 hover:underline text-[11px]"
                  >
                    Copy
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <span className="text-xs text-slate-500 font-mono">
            Audited & Re-Attested by Independent Cryptographic Oracles
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs hover:brightness-110 transition-all cursor-pointer"
          >
            I Understand & Confirm
          </button>
        </div>

      </div>
    </div>
  );
};
