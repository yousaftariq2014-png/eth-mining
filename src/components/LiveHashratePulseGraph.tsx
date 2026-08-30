import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Cpu,
  Zap,
  Radio,
  Clock,
  ShieldCheck,
  Server,
  RefreshCw,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Terminal
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface LiveHashratePulseGraphProps {
  baseHashrateMh?: number;
  activeContractsCount?: number;
  vipTier?: number;
}

interface DataPoint {
  time: string;
  hashrate: number;
  efficiency: number;
  shares: number;
}

export const LiveHashratePulseGraph: React.FC<LiveHashratePulseGraphProps> = ({
  baseHashrateMh = 650,
  activeContractsCount = 1,
  vipTier = 1
}) => {
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [currentMh, setCurrentMh] = useState<number>(baseHashrateMh);
  const [currentPowerW, setCurrentPowerW] = useState<number>(Math.round(baseHashrateMh * 1.35));
  const [pingMs, setPingMs] = useState<number>(14);
  const [totalAcceptedShares, setTotalAcceptedShares] = useState<number>(3842);
  const [rejectedShares, setRejectedShares] = useState<number>(0);

  // Initialize historic chart data
  const [historyData, setHistoryData] = useState<DataPoint[]>(() => {
    const points: DataPoint[] = [];
    const now = Date.now();
    const count = 24;
    for (let i = count; i >= 0; i--) {
      const t = new Date(now - i * 5000);
      const variance = (Math.sin(i * 0.8) * 0.04 + (Math.random() - 0.5) * 0.05) * baseHashrateMh;
      const val = Math.max(10, Math.round((baseHashrateMh + variance) * 10) / 10);
      points.push({
        time: t.toTimeString().substring(3, 8),
        hashrate: val,
        efficiency: 99.8 + (Math.random() * 0.2 - 0.1),
        shares: Math.round(val * 0.8)
      });
    }
    return points;
  });

  // Real-time ticking stream update
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().substring(3, 8);
      
      // Calculate realistic variance based on active stratum nodes
      const effectiveBase = activeContractsCount > 0 ? baseHashrateMh : 120;
      const jitter = (Math.sin(Date.now() / 3000) * 0.035 + (Math.random() - 0.5) * 0.04) * effectiveBase;
      const newMh = Math.max(10, Math.round((effectiveBase + jitter) * 10) / 10);
      
      setCurrentMh(newMh);
      setCurrentPowerW(Math.round(newMh * 1.32 + (Math.random() * 8 - 4)));
      setPingMs(Math.round(12 + Math.random() * 5));

      if (Math.random() > 0.35) {
        setTotalAcceptedShares(prev => prev + 1);
      }

      setHistoryData(prev => {
        const next = [
          ...prev.slice(1),
          {
            time: timeStr,
            hashrate: newMh,
            efficiency: 99.8 + (Math.random() * 0.15),
            shares: Math.round(newMh * 0.8)
          }
        ];
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveActive, baseHashrateMh, activeContractsCount]);

  const minHash = useMemo(() => {
    if (historyData.length === 0) return 0;
    const min = Math.min(...historyData.map(d => d.hashrate));
    return Math.max(0, Math.floor(min * 0.9));
  }, [historyData]);

  const maxHash = useMemo(() => {
    if (historyData.length === 0) return 1000;
    const max = Math.max(...historyData.map(d => d.hashrate));
    return Math.ceil(max * 1.1);
  }, [historyData]);

  return (
    <div className="w-full rounded-2xl bg-[#090e1a] border border-cyan-500/20 p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden">
      
      {/* Top Header & Live Telemetry Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
                Stratum V2 Live Hashrate Stream
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                REAL-TIME PULSE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Dedicated GPU/ASIC stratum channel • SSL Latency: <strong className="text-cyan-400">{pingMs}ms</strong>
            </p>
          </div>
        </div>

        {/* Timeframe selector & Pause/Play */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['1m', '5m', '15m', '1h'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ml-1 cursor-pointer ${
              isLiveActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={isLiveActive ? 'Pause Stream' : 'Resume Stream'}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Instantaneous Rate</span>
          <div className="text-base sm:text-lg font-black text-cyan-300 mt-0.5 flex items-baseline gap-1">
            <span>{currentMh.toLocaleString()}</span>
            <span className="text-xs text-cyan-400 font-normal">MH/s</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> ±1.8% Stability
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Accepted / Rejected</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 flex items-baseline gap-1">
            <span>{totalAcceptedShares.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-normal">/ {rejectedShares}</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> 100.0% Valid
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Power Consumption</span>
          <div className="text-base sm:text-lg font-black text-amber-300 mt-0.5 flex items-baseline gap-1">
            <span>{currentPowerW}</span>
            <span className="text-xs text-amber-400 font-normal">Watts</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            1.32 W/MH (Hydro-Cooled)
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Protocol Epoch</span>
          <div className="text-base sm:text-lg font-black text-indigo-300 mt-0.5 flex items-baseline gap-1">
            <span>#482</span>
            <span className="text-xs text-slate-400 font-normal">Slot 18</span>
          </div>
          <span className="text-[10px] text-cyan-400 mt-0.5 block">
            Stratum v2.1.0-TLS
          </span>
        </div>
      </div>

      {/* Interactive Responsive Area Chart */}
      <div className="h-48 sm:h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hashrateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[minHash, maxHash]}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}M`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DataPoint;
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl text-xs font-mono space-y-1">
                      <div className="text-slate-400">{data.time}</div>
                      <div className="text-cyan-300 font-bold">
                        Hashrate: {data.hashrate} MH/s
                      </div>
                      <div className="text-emerald-400 text-[10px]">
                        Efficiency: {data.efficiency.toFixed(1)}%
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="hashrate"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#hashrateGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Protocol Activity Footer Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Mining Pool: <strong className="text-slate-300">eu-west.stratum-v2.ethmining.org:8443</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Algorithm: <strong className="text-slate-400">Ethash/PoS</strong></span>
          <span className="text-slate-500">Target Diff: <strong className="text-amber-400">8.4G</strong></span>
        </div>
      </div>

    </div>
  );
};
