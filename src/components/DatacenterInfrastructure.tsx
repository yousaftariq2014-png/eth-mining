import React, { useState } from 'react';
import {
  Server,
  ShieldCheck,
  Zap,
  Globe,
  CheckCircle2,
  Wind,
  Droplets,
  Flame,
  Activity,
  Layers,
  Award,
  Cpu,
  ArrowUpRight,
  Lock
} from 'lucide-react';

interface DatacenterNode {
  id: string;
  name: string;
  location: string;
  country: string;
  powerSource: string;
  powerIcon: 'hydro' | 'geothermal' | 'wind';
  totalHashrate: string;
  pueRating: string;
  status: 'ONLINE' | 'OPTIMAL' | 'SCALING';
  asicUnits: string;
  coolingTech: string;
  uptime: string;
}

const DATACENTERS: DatacenterNode[] = [
  {
    id: 'dc-1',
    name: 'Alpine Hydro Cluster #4',
    location: 'Zurich & Valais Alps',
    country: 'Switzerland',
    powerSource: '100% Glacial Hydroelectric',
    powerIcon: 'hydro',
    totalHashrate: '450.8 TH/s',
    pueRating: '1.05 PUE',
    status: 'ONLINE',
    asicUnits: '1,420 Antminer S21 Pro / Hydro Units',
    coolingTech: 'Closed-Loop Alpine Deionized Water',
    uptime: '99.99%'
  },
  {
    id: 'dc-2',
    name: 'Nordic Geothermal Sub-Station',
    location: 'Reykjavik Energy Basin',
    country: 'Iceland',
    powerSource: '100% Zero-Carbon Geothermal',
    powerIcon: 'geothermal',
    totalHashrate: '820.4 TH/s',
    pueRating: '1.04 PUE',
    status: 'OPTIMAL',
    asicUnits: '2,800 WhatsMiner M66S Immersion Clusters',
    coolingTech: 'Dual-Phase Dielectric Immersion',
    uptime: '99.98%'
  },
  {
    id: 'dc-3',
    name: 'Sub-Zero Hydro-Wind Matrix',
    location: 'Quebec North Corridor',
    country: 'Canada',
    powerSource: 'Hydro-Wind Dual Grid',
    powerIcon: 'wind',
    totalHashrate: '610.2 TH/s',
    pueRating: '1.07 PUE',
    status: 'ONLINE',
    asicUnits: '1,950 Bitmain Hydro Racks',
    coolingTech: 'Free-Air Natural Sub-Zero Convection',
    uptime: '99.99%'
  }
];

export const DatacenterInfrastructure: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('dc-1');

  return (
    <section id="infrastructure-section" className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0a0f1d] via-[#0e1628] to-[#070b14] border border-slate-800/90 shadow-2xl space-y-8 relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>Global Mining Rig Infrastructure</span>
        </div>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          Enterprise Data Centers & Proof of Reserves
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
          Backed by multi-megawatt renewable mining facilities across zero-carbon jurisdictions with 24/7 on-chain proof of hash power.
        </p>
      </div>

      {/* Proof of Reserves / Trust Badge Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 relative z-10 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Reserved</span>
          </div>
          <div className="text-lg font-black text-white">1,881.4 TH/s</div>
          <div className="text-[10px] text-slate-500">Live Audited Network Hash</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-center">
          <div className="flex items-center justify-center gap-1 text-cyan-400 text-xs font-bold">
            <Zap className="w-4 h-4" />
            <span>Clean Energy</span>
          </div>
          <div className="text-lg font-black text-white">100% Zero-Carbon</div>
          <div className="text-[10px] text-slate-500">Hydro & Geothermal Grid</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
            <Activity className="w-4 h-4" />
            <span>Uptime SLA</span>
          </div>
          <div className="text-lg font-black text-white">99.99%</div>
          <div className="text-[10px] text-slate-500">Tier-IV Redundant Power</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-center">
          <div className="flex items-center justify-center gap-1 text-indigo-400 text-xs font-bold">
            <Lock className="w-4 h-4" />
            <span>Security Standard</span>
          </div>
          <div className="text-lg font-black text-white">SOC2 & ISO 27001</div>
          <div className="text-[10px] text-slate-500">Encrypted Stratum V2</div>
        </div>
      </div>

      {/* 3 Interactive Global Data Centers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {DATACENTERS.map(dc => {
          const isSelected = selectedNode === dc.id;
          return (
            <div
              key={dc.id}
              onClick={() => setSelectedNode(dc.id)}
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer space-y-4 flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#111a30] border-cyan-500/60 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="space-y-3">
                
                {/* Header with Flag / Icon & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                      {dc.powerIcon === 'hydro' && <Droplets className="w-4 h-4" />}
                      {dc.powerIcon === 'geothermal' && <Flame className="w-4 h-4" />}
                      {dc.powerIcon === 'wind' && <Wind className="w-4 h-4" />}
                    </span>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">{dc.country}</span>
                      <h4 className="text-sm font-bold text-white leading-tight">{dc.name}</h4>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {dc.status}
                  </span>
                </div>

                {/* Specs list */}
                <div className="space-y-1.5 text-xs font-mono pt-1">
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-500">Hash Capacity:</span>
                    <strong className="text-cyan-300">{dc.totalHashrate}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-500">Power Source:</span>
                    <span className="text-emerald-400 truncate max-w-[140px] text-right">{dc.powerSource}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-500">Efficiency PUE:</span>
                    <span className="text-white font-bold">{dc.pueRating}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span className="text-slate-500">Hardware Fleet:</span>
                    <span className="text-slate-400 truncate max-w-[140px] text-right">{dc.asicUnits.split('/')[0]}</span>
                  </div>
                </div>

              </div>

              {/* Cooling & Uptime Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> {dc.uptime} Uptime
                </span>
                <span className="text-cyan-400/90 text-[10px]">
                  {dc.coolingTech.split(' ')[0]} Cooling
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
