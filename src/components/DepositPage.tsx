import React, { useState } from 'react';
import {
  ArrowLeft, Copy, Check, QrCode, Clock, ShieldCheck, AlertCircle, CheckCircle2,
  Sparkles, Zap, DollarSign, Wallet, ArrowRight, Flame, Timer
} from 'lucide-react';
import { MiningPackage, DepositRequest, UserProfile } from '../types';

interface DepositPageProps {
  selectedPackage: MiningPackage;
  user: UserProfile;
  onBack: () => void;
  onSubmitDeposit: (deposit: DepositRequest) => Promise<boolean> | void;
  pendingDeposits: DepositRequest[];
  allDeposits?: DepositRequest[];
  onGoToDashboard: () => void;
}

export const DepositPage: React.FC<DepositPageProps> = ({
  selectedPackage,
  user,
  onBack,
  onSubmitDeposit,
  pendingDeposits,
  allDeposits = [],
  onGoToDashboard,
}) => {
  const [network, setNetwork] = useState<'TRC20' | 'ERC20' | 'POLYGON'>('TRC20');
  const [amount, setAmount] = useState<number>(selectedPackage.priceUsd);
  const [senderTxid, setSenderTxid] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  React.useEffect(() => {
    if (selectedPackage && selectedPackage.priceUsd) {
      setAmount(selectedPackage.priceUsd);
    }
  }, [selectedPackage]);

  const isFlash = selectedPackage.planType === 'flash_48h';
  const isCustom = selectedPackage.planType === 'custom_pool';

  const depositAddresses: Record<'TRC20' | 'ERC20' | 'POLYGON', string> = {
    TRC20: 'TGgfnPVkq3P3L7ZXGR74ikNwxmPCm8SxT1',
    ERC20: '0x91D8d6C4DD87B1Cf676FfE85887818802535fBf8',
    POLYGON: '0x91D8d6C4DD87B1Cf676FfE85887818802535fBf8',
  };
  const currentAddress = depositAddresses[network];

  const userPendingDeposit = pendingDeposits.find(
    (d) => (d.userId === user.id || d.userName === user.name) && d.status === 'pending'
  );

  const isAlreadyApproved = allDeposits.some(
    (d) => (d.userId === user.id || d.userName === user.name) &&
           d.status === 'approved' &&
           (d.packageId === selectedPackage.id || d.packageName === selectedPackage.name || (d.vipLevel === selectedPackage.vipLevel && d.planType === selectedPackage.planType))
  );

  // If user already owns this package, prevent re-purchase
  if (isAlreadyApproved) {
    return (
      <div id="deposit-already-owned-page" className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Packages</span>
        </button>

        <div className="rounded-3xl bg-[#0f172a] border border-emerald-500/40 p-6 sm:p-8 space-y-6 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Contract Already Active
            </span>
            <h2 className="text-2xl font-black text-white">You Already Own This Package</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              You already have an active mining contract for <strong>{selectedPackage.name} (${selectedPackage.priceUsd.toLocaleString()} USDT)</strong>. Each package tier can only be purchased once per client.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button onClick={onBack} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer">
              Choose Another Tier
            </button>
            <button onClick={onGoToDashboard} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-2">
              <span>Go to Mining Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!amount || amount <= 0) {
      setSubmitError('Please enter a valid deposit amount.');
      return;
    }
    if (isCustom && (amount < 10000 || amount > 200000)) {
      setSubmitError('Custom package deposit amount must be between $10,000 and $200,000 USDT.');
      return;
    }
    if (!senderTxid.trim()) {
      setSubmitError('Please enter your transaction TXID.');
      return;
    }

    setIsSubmitting(true);

    const newDeposit: DepositRequest = {
      id: `dep-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      planType: selectedPackage.planType,
      vipLevel: selectedPackage.vipLevel,
      amountUsd: amount,
      network,
      depositAddress: currentAddress,
      senderTxid: senderTxid.trim(),
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    try {
      await onSubmitDeposit(newDeposit);
    } catch (err) {
      setSubmitError('Failed to submit deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pending status screen — honest single state, no fake intermediate "verified" step
  if (userPendingDeposit) {
    return (
      <div id="deposit-pending-status-page" className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Packages</span>
        </button>

        <div className="rounded-3xl bg-[#0f172a] border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Status: Pending Admin Verification
                </span>
                <h2 className="text-xl font-black text-white mt-1">Deposit Submitted</h2>
              </div>
            </div>
            <div className="text-left sm:text-right font-mono">
              <div className="text-xs text-slate-400">Order Amount</div>
              <div className="text-2xl font-black text-amber-400">${userPendingDeposit.amountUsd.toLocaleString()} USDT</div>
            </div>
          </div>

          <div className="space-y-3 bg-[#131d35] p-4 sm:p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">What happens next</h3>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                <div>
                  <div className="text-xs font-bold text-white">Deposit details submitted</div>
                  <div className="text-[11px] text-slate-400 font-mono">TXID: {userPendingDeposit.senderTxid}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 animate-pulse">⏳</div>
                <div>
                  <div className="text-xs font-bold text-amber-400">Awaiting admin verification</div>
                  <div className="text-[11px] text-slate-400">
                    An admin will manually check this transaction on the blockchain explorer before it is approved. This has not happened yet.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="text-slate-500 text-[10px]">Package</div>
              <div className="font-bold text-white mt-0.5 truncate">{userPendingDeposit.packageName}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Plan</div>
              <div className="font-bold text-amber-400 mt-0.5">
                {userPendingDeposit.planType === 'flash_48h' ? '48H Flash' : `VIP ${userPendingDeposit.vipLevel}`}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Network</div>
              <div className="font-bold text-white mt-0.5">USDT-{userPendingDeposit.network}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Submitted At</div>
              <div className="font-bold text-slate-300 mt-0.5 text-[11px]">{userPendingDeposit.createdAt}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button onClick={onBack} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer">
              ← Choose Another Package
            </button>
            <button onClick={onGoToDashboard} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-2">
              <span>View Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="deposit-submit-page" className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Packages</span>
      </button>

      <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isCustom 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : isFlash 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}>
                {isCustom ? 'Custom Institutional Rig ($10k - $200k)' : isFlash ? '48H Flash Contract' : `Daily Mining VIP ${selectedPackage.vipLevel}`}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Deposit for {selectedPackage.name}</h2>
          </div>
          <div className="text-left sm:text-right font-mono">
            <div className="text-xs text-slate-400">{isCustom ? 'Configured Amount' : 'Suggested Amount'}</div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 sm:text-amber-400">
              ${selectedPackage.priceUsd.toLocaleString()} USDT
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">1. Select USDT Deposit Network</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'TRC20' as const, label: 'USDT-TRC20', desc: 'Tron Network' },
              { id: 'ERC20' as const, label: 'USDT-ERC20', desc: 'Ethereum Network' },
              { id: 'POLYGON' as const, label: 'USDT-POLYGON', desc: 'Polygon POS' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setNetwork(item.id)}
                className={`py-3 px-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                  network === item.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-black'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <span className={`text-xs font-mono font-black ${network === item.id ? 'text-slate-950' : 'text-white'}`}>
                  {item.label}
                </span>
                <span className={`text-[10px] font-mono mt-0.5 ${network === item.id ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">2. Send Payment to Platform Address</label>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {network === 'TRC20' ? 'Tron (TRC-20)' : network === 'ERC20' ? 'Ethereum (ERC-20)' : 'Polygon POS'}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#090d16] border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">USDT-{network} Deposit Address:</span>
              <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-amber-300 break-all select-all border border-slate-800 font-bold tracking-wide">
              {currentAddress}
            </div>
            <p className="text-[11px] text-slate-400">
              ⚠️ Only send <strong>USDT ({network === 'TRC20' ? 'Tron TRC-20' : network === 'ERC20' ? 'Ethereum ERC-20' : 'Polygon POS'})</strong> to this exact address. Your balance updates after admin verification on the blockchain explorer.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">3. Submit Your Transaction Details</div>

          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">{submitError}</div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Deposit Amount (USDT):</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={10} required className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Your Transaction Hash (TXID):</label>
              <input type="text" value={senderTxid} onChange={(e) => setSenderTxid(e.target.value)} placeholder="e.g. 0x8a94e... or a1b2c3..." required className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
              <p className="text-[10px] text-slate-500 mt-1">Enter the real transaction hash from your wallet/exchange — this is what the admin will look up on the blockchain explorer.</p>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <><Clock className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
            ) : (
              <><span>Submit for Admin Verification</span><ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
