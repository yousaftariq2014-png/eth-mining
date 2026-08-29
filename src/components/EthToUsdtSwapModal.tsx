import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDown,
  ArrowRightLeft,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExchangeRecordItem } from '../types';

interface EthToUsdtSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  ethBalance: number;
  ethPriceUsd: number;
  onExecuteSwap: (ethAmount: number, usdtAmount: number, rate: number) => Promise<ExchangeRecordItem | null>;
  onProceedToWithdraw?: () => void;
}

export const EthToUsdtSwapModal: React.FC<EthToUsdtSwapModalProps> = ({
  isOpen,
  onClose,
  ethBalance,
  ethPriceUsd,
  onExecuteSwap,
  onProceedToWithdraw,
}) => {
  const [ethInput, setEthInput] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<ExchangeRecordItem | null>(null);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEthInput('');
      setErrorMsg(null);
      setCompletedTx(null);
      setIsSwapping(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedEthInput = parseFloat(ethInput) || 0;
  const calculatedUsdt = parsedEthInput * ethPriceUsd;

  const handleSetPercentage = (pct: number) => {
    const calculated = (ethBalance * pct).toFixed(6);
    setEthInput(calculated);
    setErrorMsg(null);
  };

  const handleMax = () => {
    setEthInput(ethBalance.toFixed(6));
    setErrorMsg(null);
  };

  const handleSwapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (parsedEthInput <= 0) {
      setErrorMsg('Please enter a valid ETH amount to exchange.');
      return;
    }

    if (parsedEthInput > ethBalance + 0.0000001) {
      setErrorMsg(`Insufficient ETH balance. You only have ${ethBalance.toFixed(6)} ETH.`);
      return;
    }

    if (calculatedUsdt < 1.0) {
      setErrorMsg('Minimum exchange value is $1.00 USDT equivalent.');
      return;
    }

    setIsSwapping(true);

    try {
      // Simulate quick DEX execution delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const record = await onExecuteSwap(parsedEthInput, calculatedUsdt, ethPriceUsd);
      setIsSwapping(false);

      if (record) {
        setCompletedTx(record);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      setIsSwapping(false);
      setErrorMsg(err?.message || 'Exchange failed. Please try again.');
    }
  };

  const handleCopyTx = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e1628] border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Instant Crypto Exchange</h3>
              <p className="text-xs text-slate-400 font-mono">Convert Mined ETH to Withdrawable USDT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 relative z-10">

          {/* Success State Screen */}
          {completedTx ? (
            <div className="space-y-5 py-2 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-white">Exchange Successful!</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Your mined ETH has been converted to USDT and credited to your Available Wallet.
                </p>
              </div>

              {/* Conversion Receipt Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-left font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Swapped Amount:</span>
                  <span className="text-cyan-300 font-bold">{completedTx.fromAmount.toFixed(6)} ETH</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Received USDT:</span>
                  <span className="text-emerald-400 font-black text-sm">+{completedTx.toAmount.toFixed(2)} USDT</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Exchange Rate:</span>
                  <span className="text-slate-200">1 ETH = ${completedTx.rate.toFixed(2)} USDT</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Network Fee:</span>
                  <span className="text-emerald-400 font-bold">$0.00 (Fee-Free)</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 text-[10px]">Swap TXID:</span>
                  <button
                    onClick={() => handleCopyTx(completedTx.txHash)}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <span>{completedTx.txHash.substring(0, 10)}...{completedTx.txHash.substring(completedTx.txHash.length - 6)}</span>
                    {copiedTx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    onClose();
                    if (onProceedToWithdraw) onProceedToWithdraw();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Withdraw USDT Now</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSwapSubmit} className="space-y-4">
              
              {/* Live Rate Pill */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Live Pool Rate:
                </span>
                <span className="font-bold text-white">
                  1 ETH = <strong className="text-emerald-400 font-black">${ethPriceUsd.toFixed(2)}</strong> USDT
                </span>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Box 1: FROM ETH (Mined Balance) */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-slate-400">You Pay (Mined ETH):</label>
                  <span className="text-cyan-400">
                    Balance: <strong>{ethBalance.toFixed(6)} ETH</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#121c32] px-3 py-2 rounded-xl border border-slate-700 shrink-0 font-mono font-bold text-xs text-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>ETH</span>
                  </div>

                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.000000"
                    value={ethInput}
                    onChange={(e) => {
                      setEthInput(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full bg-transparent text-right text-lg sm:text-xl font-mono font-black text-white focus:outline-none placeholder:text-slate-600"
                  />
                </div>

                {/* Percentage Quick Shortcuts */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  {[0.25, 0.50, 0.75].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSetPercentage(pct)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer"
                    >
                      {pct * 100}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleMax}
                    className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Swap Down Arrow Icon */}
              <div className="flex justify-center -my-2 relative z-20">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 shadow-md">
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>

              {/* Box 2: TO USDT (Available Withdrawable Wallet) */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-slate-400">You Receive (USDT):</label>
                  <span className="text-emerald-400">
                    Est. Value: <strong>${calculatedUsdt.toFixed(2)} USDT</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#0c241b] px-3 py-2 rounded-xl border border-emerald-500/40 shrink-0 font-mono font-bold text-xs text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>USDT</span>
                  </div>

                  <div className="w-full text-right text-lg sm:text-xl font-mono font-black text-emerald-400">
                    ${calculatedUsdt.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Swap Details Summary */}
              <div className="p-3.5 rounded-2xl bg-[#090e1a] border border-slate-800/80 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Exchange Protocol:</span>
                  <span className="text-slate-200">ETH2.0 Instant Smart Swap</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Price Slippage:</span>
                  <span className="text-emerald-400">&lt; 0.01% Guaranteed</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Platform Fee:</span>
                  <span className="text-emerald-400 font-bold">$0.00 (0.00% Zero Fee Promo)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Settlement Speed:</span>
                  <span className="text-cyan-300">Instant to USDT Balance</span>
                </div>
              </div>

              {/* Convert Submit Button */}
              <button
                type="submit"
                disabled={isSwapping || parsedEthInput <= 0}
                className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 ${
                  isSwapping || parsedEthInput <= 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 cursor-pointer active:scale-95'
                }`}
              >
                {isSwapping ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Executing Instant Exchange...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Convert {parsedEthInput > 0 ? `${parsedEthInput.toFixed(4)} ETH` : 'ETH'} to USDT</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
