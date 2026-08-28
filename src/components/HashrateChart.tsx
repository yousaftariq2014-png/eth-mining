import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Activity, BarChart2, TrendingUp } from 'lucide-react';
import { Language } from '../types';

interface HashrateChartProps {
  language: Language;
  isMiningActive: boolean;
}

export const HashrateChart: React.FC<HashrateChartProps> = ({ isMiningActive }) => {
  const [metricView, setMetricView] = useState<'hashrate' | 'shares' | 'revenue'>('hashrate');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');

  // Simulated 24-hour datapoints
  const data = [
    { time: '00:00', hashrate: isMiningActive ? 342 : 0, acceptedShares: 1240, rejectedShares: 2, revenue: 1.45 },
    { time: '02:00', hashrate: isMiningActive ? 348 : 0, acceptedShares: 1310, rejectedShares: 1, revenue: 1.52 },
    { time: '04:00', hashrate: isMiningActive ? 355 : 0, acceptedShares: 1405, rejectedShares: 3, revenue: 1.58 },
    { time: '06:00', hashrate: isMiningActive ? 350 : 0, acceptedShares: 1390, rejectedShares: 2, revenue: 1.55 },
    { time: '08:00', hashrate: isMiningActive ? 362 : 0, acceptedShares: 1490, rejectedShares: 4, revenue: 1.68 },
    { time: '10:00', hashrate: isMiningActive ? 358 : 0, acceptedShares: 1460, rejectedShares: 1, revenue: 1.62 },
    { time: '12:00', hashrate: isMiningActive ? 365 : 0, acceptedShares: 1530, rejectedShares: 2, revenue: 1.74 },
    { time: '14:00', hashrate: isMiningActive ? 352 : 0, acceptedShares: 1420, rejectedShares: 3, revenue: 1.59 },
    { time: '16:00', hashrate: isMiningActive ? 359 : 0, acceptedShares: 1475, rejectedShares: 2, revenue: 1.65 },
    { time: '18:00', hashrate: isMiningActive ? 368 : 0, acceptedShares: 1580, rejectedShares: 1, revenue: 1.78 },
    { time: '20:00', hashrate: isMiningActive ? 362 : 0, acceptedShares: 1510, rejectedShares: 3, revenue: 1.70 },
    { time: 'Now', hashrate: isMiningActive ? 366.5 : 0, acceptedShares: 1560, rejectedShares: 2, revenue: 1.75 },
  ];

  return (
    <div id="hashrate-chart-card" className="rounded-xl bg-[#111726] border border-slate-800 p-5 shadow-sm">
      
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Cluster Hashrate & Performance Graph
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-algorithmic throughput normalized against global pool difficulty.
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          {/* Metric Selector */}
          <div className="flex bg-[#0b0f17] p-1 rounded-lg border border-slate-800 text-xs">
            <button
              id="chart-metric-hashrate"
              onClick={() => setMetricView('hashrate')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                metricView === 'hashrate' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hashrate (TH/s)
            </button>
            <button
              id="chart-metric-shares"
              onClick={() => setMetricView('shares')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                metricView === 'shares' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Valid Shares
            </button>
            <button
              id="chart-metric-revenue"
              onClick={() => setMetricView('revenue')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                metricView === 'revenue' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yield ($)
            </button>
          </div>

          {/* Time range */}
          <div className="flex bg-[#0b0f17] p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {(['1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                id={`chart-range-${range}`}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 rounded font-semibold transition-colors ${
                  timeRange === range ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHashrate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0b0f17',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
            
            {metricView === 'hashrate' && (
              <Area
                type="monotone"
                dataKey="hashrate"
                name="Hashrate (TH/s)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorHashrate)"
              />
            )}

            {metricView === 'shares' && (
              <>
                <Area
                  type="monotone"
                  dataKey="acceptedShares"
                  name="Accepted Shares"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorShares)"
                />
                <Area
                  type="monotone"
                  dataKey="rejectedShares"
                  name="Rejected Shares"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  fillOpacity={0.3}
                  fill="#f43f5e"
                />
              </>
            )}

            {metricView === 'revenue' && (
              <Area
                type="monotone"
                dataKey="revenue"
                name="Yield / Hour ($)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer summary */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span>Min: <strong className="text-slate-200">342.0 TH/s</strong></span>
          <span>Avg: <strong className="text-amber-400">357.2 TH/s</strong></span>
          <span>Peak: <strong className="text-emerald-400">368.0 TH/s</strong></span>
        </div>
        <div className="text-slate-500">
          Stratum v2 Sampling Frequency: 1.0s
        </div>
      </div>

    </div>
  );
};
