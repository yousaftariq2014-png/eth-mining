import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Trash2, 
  ArrowDownCircle, 
  Copy, 
  Check, 
  Wifi, 
  Zap,
  Filter
} from 'lucide-react';
import { Language, MiningLogEntry } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface LiveMiningConsoleProps {
  language: Language;
  logs: MiningLogEntry[];
  clearLogs: () => void;
  isMiningActive: boolean;
}

export const LiveMiningConsole: React.FC<LiveMiningConsoleProps> = ({
  language,
  logs,
  clearLogs,
  isMiningActive,
}) => {
  const t = TRANSLATIONS[language];
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.tag}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = filterTag === 'ALL' ? logs : logs.filter((l) => l.tag === filterTag);

  const getTagColor = (tag: MiningLogEntry['tag']) => {
    switch (tag) {
      case 'STRATUM': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'SOLVER': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'SHARE': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'RIG': return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
      case 'PAYOUT': return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
    }
  };

  return (
    <div id="live-mining-console-card" className="rounded-xl bg-[#090d16] border border-slate-800 flex flex-col h-[420px] shadow-lg overflow-hidden font-mono">
      
      {/* Console Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1422] border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-200">{t.live_terminal}</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-400">
            <Wifi className={`w-3 h-3 ${isMiningActive ? 'text-emerald-400' : 'text-slate-500'}`} />
            {isMiningActive ? 'TCP/SSL LIVE' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Tag Filter */}
          <div className="flex items-center gap-1 text-[10px]">
            {['ALL', 'SHARE', 'SOLVER', 'STRATUM'].map((tag) => (
              <button
                key={tag}
                id={`filter-${tag}`}
                onClick={() => setFilterTag(tag)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  filterTag === tag
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Autoscroll */}
          <button
            id="terminal-autoscroll-btn"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded text-xs border ${
              autoScroll ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'text-slate-500 border-slate-800'
            }`}
            title={t.auto_scroll}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Copy Logs */}
          <button
            id="terminal-copy-btn"
            onClick={handleCopyLogs}
            className="p-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            title="Copy Terminal Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Logs */}
          <button
            id="terminal-clear-btn"
            onClick={clearLogs}
            className="p-1.5 rounded text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800"
            title={t.clear_logs}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed text-slate-300 bg-[#070a10]">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs">
            No logs captured yet. Toggle mining to start streaming PoW telemetry.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/40 p-0.5 rounded">
              <span className="text-slate-600 select-none shrink-0 font-mono text-[10px]">
                {log.timestamp}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${getTagColor(log.tag)}`}>
                {log.tag}
              </span>
              <span className={`flex-1 break-all ${
                log.level === 'error' ? 'text-rose-400 font-semibold' :
                log.level === 'warn' ? 'text-yellow-400' :
                log.level === 'success' ? 'text-emerald-300' : 'text-slate-300'
              }`}>
                {log.message}
              </span>
              {log.latencyMs && (
                <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                  {log.latencyMs}ms
                </span>
              )}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Console Bottom Bar */}
      <div className="px-4 py-1.5 bg-[#0b0f17] border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {t.terminal_connected} (Stratum v2 Protocol Active)
        </span>
        <span className="text-slate-400 font-semibold">
          {filteredLogs.length} Events Logged
        </span>
      </div>

    </div>
  );
};
