import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap, 
  Check, 
  ExternalLink, 
  Coins, 
  Copy,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, SupportedCoin, WalletBalance, PayoutTransaction } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface WalletPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  wallets: WalletBalance[];
  transactions: PayoutTransaction[];
  onExecutePayout: (tx: PayoutTransaction) => void;
}

export const WalletPayoutModal: React.FC<WalletPayoutModalProps> = ({
  isOpen,
  onClose,
  language,
  wallets,
  transactions,
  onExecutePayout,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedCoin, setSelectedCoin] = useState<SupportedCoin>('BTC');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [payoutType, setPayoutType] = useState<'instant' | 'lightning'>('instant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTx, setSuccessTx] = useState<PayoutTransaction | null>(null);

  if (!isOpen) return null;

  const currentWallet = wallets.find((w) => w.coin === selectedCoin) || wallets[0];

  const [errorNotice, setErrorNotice] = useState<string>('');

  const handleMax = () => {
    setWithdrawAmount(currentWallet.amount.toString());
    setErrorNotice('');
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) return;

    const coinPrice = selectedCoin === 'BTC' ? 96450 : selectedCoin === 'KAS' ? 0.168 : 30;
    const usdVal = amountNum * coinPrice;
    if (usdVal < 10) {
      setErrorNotice(`Minimum withdrawal limit is $10.00 USD (Your current amount is ~$${usdVal.toFixed(2)} USD). Please increase withdrawal amount.`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Generate random simulated tx hash
      const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newTx: PayoutTransaction = {
        id: `tx-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        coin: selectedCoin,
        amount: amountNum,
        amountUsd: amountNum * (selectedCoin === 'BTC' ? 96450 : selectedCoin === 'KAS' ? 0.168 : 30),
        txHash: randomHex,
        destinationAddress: destinationAddress || currentWallet.walletAddress,
        status: 'completed',
        networkFee: selectedCoin === 'BTC' ? 0.00002 : 0.001,
        payoutType: payoutType === 'lightning' ? 'lightning' : 'instant',
      };

      onExecutePayout(newTx);
      setIsSubmitting(false);
      setSuccessTx(newTx);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0e1422] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.payout_title}</h3>
              <p className="text-xs text-slate-400">{t.payout_desc}</p>
            </div>
          </div>
          
          <button
            id="close-wallet-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Coin Selector Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Asset to Withdraw
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {wallets.map((w) => {
                const isSel = selectedCoin === w.coin;
                return (
                  <button
                    key={w.coin}
                    id={`wallet-select-${w.coin}`}
                    onClick={() => {
                      setSelectedCoin(w.coin);
                      setSuccessTx(null);
                      setWithdrawAmount('');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSel
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-black">{w.coin}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ${w.usdValue.toFixed(0)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balance Preview Card */}
          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">Available Mined Balance:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {currentWallet.amount.toFixed(6)} {currentWallet.coin}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (≈ ${currentWallet.usdValue.toFixed(2)} USD)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                0% Mining Pool Fee
              </span>
            </div>
          </div>

          {/* Form */}
          {successTx ? (
            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Transaction Broadcasted Successfully to Mempool!</span>
              </div>
              <div className="text-xs font-mono space-y-1 text-slate-300">
                <div>Amount: <strong className="text-white">{successTx.amount} {successTx.coin}</strong> (${successTx.amountUsd.toFixed(2)})</div>
                <div>Destination: <strong className="text-slate-200">{successTx.destinationAddress}</strong></div>
                <div className="truncate text-slate-400">Tx Hash: <span className="text-amber-400 font-mono">{successTx.txHash}</span></div>
              </div>
              <button
                id="withdraw-another-btn"
                onClick={() => { setSuccessTx(null); setWithdrawAmount(''); }}
                className="mt-2 text-xs font-bold text-emerald-400 hover:underline"
              >
                Make another withdrawal &rarr;
              </button>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              {/* Route: On-Chain vs Lightning */}
              {selectedCoin === 'BTC' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Settlement Network
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setPayoutType('instant')}
                      className={`p-2.5 rounded-xl border text-center font-bold ${
                        payoutType === 'instant'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      On-Chain (Layer 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutType('lightning')}
                      className={`p-2.5 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 ${
                        payoutType === 'lightning'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Lightning Network (Instant)
                    </button>
                  </div>
                </div>
              )}

              {/* Destination Address */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.enter_address}
                </label>
                <input
                  id="payout-address-input"
                  type="text"
                  required
                  placeholder={`Enter your ${selectedCoin} receiving address`}
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.amount_to_withdraw} ({selectedCoin})
                  </label>
                  <button
                    type="button"
                    onClick={handleMax}
                    className="text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    Use Max ({currentWallet.amount.toFixed(6)})
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="payout-amount-input"
                    type="number"
                    step="any"
                    required
                    min="0.000001"
                    max={currentWallet.amount}
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    {selectedCoin}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>Minimum threshold:</span>
                  <span className="text-amber-400 font-bold">$10.00 USD</span>
                </div>
              </div>

              {errorNotice && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                  {errorNotice}
                </div>
              )}

              {/* Submit Button */}
              <button
                id="submit-payout-btn"
                type="submit"
                disabled={isSubmitting || !withdrawAmount}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Signing & Broadcasting to Mempool...</span>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{t.confirm_withdrawal}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Recent Payout History Ledger */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.recent_transactions}</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="py-2">Time</th>
                    <th className="py-2">Asset</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Tx Hash</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {transactions.slice(0, 4).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40">
                      <td className="py-2 text-slate-500 text-[11px] whitespace-nowrap">{tx.timestamp.substring(11)}</td>
                      <td className="py-2 font-bold text-amber-400">{tx.coin}</td>
                      <td className="py-2 font-semibold text-white">{tx.amount}</td>
                      <td className="py-2 text-slate-400 truncate max-w-[120px] font-mono text-[10px]">
                        {tx.txHash}
                      </td>
                      <td className="py-2 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
