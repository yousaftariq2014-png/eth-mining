import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Flame, 
  Fan, 
  Zap, 
  AlertTriangle, 
  Check,
  ShieldCheck 
} from 'lucide-react';
import { Language, MiningRig } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface OverclockModalProps {
  rig: MiningRig | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSaveOverclock: (rigId: string, overclockData: MiningRig['overclock'], newHashrate: number, newWatts: number) => void;
}

export const OverclockModal: React.FC<OverclockModalProps> = ({
  rig,
  isOpen,
  onClose,
  language,
  onSaveOverclock,
}) => {
  const t = TRANSLATIONS[language];
  if (!isOpen || !rig) return null;

  const [coreClock, setCoreClock] = useState<number>(rig.overclock.coreClockOffsetMhz);
  const [memoryClock, setMemoryClock] = useState<number>(rig.overclock.memoryClockOffsetMhz);
  const [powerLimit, setPowerLimit] = useState<number>(rig.overclock.powerLimitPercent);
  const [voltageOffset, setVoltageOffset] = useState<number>(rig.overclock.voltageOffsetMv);
  const [fanMode, setFanMode] = useState<'auto' | 'manual'>(rig.overclock.fanSpeedMode);

  // Compute live simulated effect on hashrate and wattage
  const hashrateMultiplier = 1 + (coreClock * 0.0004) + (memoryClock * 0.0003) + ((powerLimit - 100) * 0.003);
  const calculatedHashrate = Math.max(1, rig.hashrate * hashrateMultiplier);
  const calculatedWatts = Math.round(rig.powerWatts * (powerLimit / 100) * (1 + voltageOffset * 0.002));
  const estimatedTemp = Math.round(rig.tempCelsius + (powerLimit - 100) * 0.3 + (coreClock * 0.05));

  const isDangerous = estimatedTemp > 72 || powerLimit > 110;

  const handleApply = () => {
    onSaveOverclock(
      rig.id,
      {
        coreClockOffsetMhz: coreClock,
        memoryClockOffsetMhz: memoryClock,
        powerLimitPercent: powerLimit,
        fanSpeedMode: fanMode,
        voltageOffsetMv: voltageOffset,
      },
      Number(calculatedHashrate.toFixed(1)),
      calculatedWatts
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0e1422] border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Overclock & Tuning Lab</h3>
              <p className="text-xs text-slate-400">{rig.name} ({rig.algorithm})</p>
            </div>
          </div>
          
          <button
            id="close-oc-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders Body */}
        <div className="p-6 space-y-5">
          
          {/* Simulated Impact Preview */}
          <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Projected Hash</span>
              <span className="text-sm font-extrabold text-amber-400">
                {calculatedHashrate.toFixed(1)} {rig.hashrateUnit}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Power Draw</span>
              <span className="text-sm font-extrabold text-cyan-400">
                {calculatedWatts}W
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Target Temp</span>
              <span className={`text-sm font-extrabold ${isDangerous ? 'text-rose-400' : 'text-emerald-400'}`}>
                {estimatedTemp}°C
              </span>
            </div>
          </div>

          {/* Danger alert if overclock is too aggressive */}
          {isDangerous && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Thermal Envelope High! Recommend setting Fan curve to 85%+ or reducing Power Limit to prevent HW errors.</span>
            </div>
          )}

          {/* Core Clock Offset */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300 font-bold uppercase">Core Clock Offset (MHz)</span>
              <span className="text-amber-400 font-bold">{coreClock > 0 ? `+${coreClock}` : coreClock} MHz</span>
            </div>
            <input
              id="oc-core-clock-slider"
              type="range"
              min="-200"
              max="350"
              step="10"
              value={coreClock}
              onChange={(e) => setCoreClock(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Memory Clock Offset */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300 font-bold uppercase">Memory / VRAM Offset (MHz)</span>
              <span className="text-amber-400 font-bold">+{memoryClock} MHz</span>
            </div>
            <input
              id="oc-mem-clock-slider"
              type="range"
              min="0"
              max="1500"
              step="50"
              value={memoryClock}
              onChange={(e) => setMemoryClock(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Power Limit % */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300 font-bold uppercase">Power Target Limit (%)</span>
              <span className="text-cyan-400 font-bold">{powerLimit}%</span>
            </div>
            <input
              id="oc-power-limit-slider"
              type="range"
              min="65"
              max="125"
              step="1"
              value={powerLimit}
              onChange={(e) => setPowerLimit(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Voltage Offset (Undervolting) */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300 font-bold uppercase">Voltage Offset (Undervolt mV)</span>
              <span className="text-emerald-400 font-bold">{voltageOffset} mV</span>
            </div>
            <input
              id="oc-voltage-slider"
              type="range"
              min="-100"
              max="20"
              step="5"
              value={voltageOffset}
              onChange={(e) => setVoltageOffset(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Fan Mode */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
            <span className="text-slate-300 font-bold uppercase">Cooling Fan Profile</span>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setFanMode('auto')}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  fanMode === 'auto' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Auto Adaptive
              </button>
              <button
                type="button"
                onClick={() => setFanMode('manual')}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  fanMode === 'manual' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                High RPM (100%)
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            id="apply-overclock-btn"
            onClick={handleApply}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-md shadow-amber-500/20 cursor-pointer transition-all mt-4"
          >
            <Check className="w-4 h-4" />
            <span>Apply Silicon Profile to Rig</span>
          </button>

        </div>

      </div>
    </div>
  );
};
