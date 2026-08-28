import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  QrCode, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  DollarSign, 
  Wallet,
  ArrowRight,
  Flame,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MiningPackage, DepositRequest, UserProfile } from '../types';

interface DepositPageProps {
  selectedPackage: MiningPackage;
  user: UserProfile;
  onBack: () => void;
  onSubmitDeposit: (deposit: DepositRequest) => void;
  pendingDeposits: DepositRequest[];
  onGoToDashboard: () => void;
}

export const DepositPage: React.FC<DepositPageProps> = ({
  selectedPackage,
  user,
  onBack,
  onSubmitDeposit,
  pendingDeposits,
  onGoToDashboard,
}) => {
  const [network, setNetwork] = useState<'TRC20' | 'ERC20' | 'BEP20'>('TRC20');
  const [amount, setAmount] = useState<number>(selectedPackage.priceUsd);
  const [senderTxid, setSenderTxid] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isFlash = selectedPackage.planType === 'flash_48h';

  // Address map
  const depositAddresses = {
    TRC20: 'TQn9Y2khEsLJW1ChV8N8N6uG2X734fjk',
    ERC20: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    BEP20: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  };

  const currentAddress = depositAddresses[network];

  // Check if there is an active pending deposit for this user
  const userPendingDeposit = pendingDeposits.find(
    (d) => d.userId === user.id && d.status === 'pending'
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }
    if (!senderTxid.trim()) {
      alert('Please enter your transaction TXID or sender wallet address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
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

      onSubmitDeposit(newDeposit);
      setIsSubmitting(false);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 600);
  };

  // If user already has a pending deposit, show the Pending Status Screen
  if (userPendingDeposit) {
    return (
      <div id="deposit-pending-status-page" className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Packages</span>
        </button>

        {/* Pending Status Card */}
        <div className="rounded-3xl bg-[#0f172a] border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Status: Pending Admin Approval
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  Deposit Submitted Successfully
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono">
              <div className="text-xs text-slate-400">Order Amount</div>
              <div className="text-2xl font-black text-amber-400">${userPendingDeposit.amountUsd.toLocaleString()} USDT</div>
            </div>
          </div>

          {/* Verification Timeline */}
          <div className="space-y-3 bg-[#131d35] p-4 sm:p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Activation Progress
            </h3>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Deposit Details Registered</div>
                  <div className="text-[11px] text-slate-400 font-mono">TXID: {userPendingDeposit.senderTxid}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Network Broadcast Verified</div>
                  <div className="text-[11px] text-slate-400 font-mono">USDT-{userPendingDeposit.network} network confirmation received</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 animate-pulse">
                  ⏳
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-400">Admin Review & Allocation</div>
                  <div className="text-[11px] text-slate-400">
                    Admin is reviewing your transaction to activate your contract.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Details Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="text-slate-500 text-[10px]">Package</div>
              <div className="font-bold text-white mt-0.5 truncate">{userPendingDeposit.packageName}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Plan Model</div>
              <div className="font-bold text-amber-400 mt-0.5">
                {userPendingDeposit.planType === 'flash_48h' ? '48H Flash Contract' : `Daily Mining VIP ${userPendingDeposit.vipLevel}`}
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              ← Choose Another Package
            </button>
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Mining Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    );
  }

  // Regular Deposit Form Screen
  return (
    <div id="deposit-submit-page" className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Back Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Packages</span>
      </button>

      {/* Main Deposit Box */}
      <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header Summary of Selected Package */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isFlash 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}>
                {isFlash ? '48H Flash Contract' : `Daily Mining VIP ${selectedPackage.vipLevel}`}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {isFlash ? `+${selectedPackage.profitPercent}% in 48 Hours` : selectedPackage.profitRangeText || `+${selectedPackage.dailyReturnPercent}% Daily`}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              Deposit & Activate {selectedPackage.name}
            </h2>
          </div>

          <div className="text-left sm:text-right font-mono">
            <div className="text-xs text-slate-400">Required Capital</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              ${selectedPackage.priceUsd.toLocaleString()} USDT
            </div>
          </div>
        </div>

        {/* 48H Flash Return Breakdown Box */}
        {isFlash && selectedPackage.totalPayoutUsd && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-slate-900 border border-rose-500/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>48-Hour Return Breakdown (Automated Lump Sum Settlement):</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400">Your Capital</span>
                <div className="text-sm font-black text-white mt-0.5">${selectedPackage.priceUsd.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400">Fixed Profit ({selectedPackage.profitPercent}%)</span>
                <div className="text-sm font-black text-emerald-400 mt-0.5">+${selectedPackage.oneTimeProfitUsd?.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-rose-900/60">
                <span className="text-[10px] text-rose-300">Total Return</span>
                <div className="text-sm font-black text-amber-400 mt-0.5">${selectedPackage.totalPayoutUsd.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Network Selection: TRC20 | ERC20 | BEP20 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Select USDT Deposit Network
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['TRC20', 'ERC20', 'BEP20'] as const).map((net) => (
              <button
                key={net}
                type="button"
                onClick={() => setNetwork(net)}
                className={`py-3 rounded-2xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                  network === net
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                USDT-{net}
              </button>
            ))}
          </div>
        </div>

        {/* Deposit Address Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Send Payment to Platform Address
          </label>

          <div className="p-4 rounded-2xl bg-[#090d16] border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">USDT-{network} Official Deposit Address:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-amber-300 break-all select-all border border-slate-800">
              {currentAddress}
            </div>

            <p className="text-[11px] text-slate-400">
              ⚠️ Please transfer only <strong>USDT ({network})</strong> to this address. Funds will be credited after network broadcast confirmation and admin approval.
            </p>
          </div>
        </div>

        {/* Deposit Proof Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            3. Submit Deposit Transaction Details
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Deposit Amount (USDT):
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={10}
                required
                className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Your Transfer Transaction Hash (TXID) or Sender Address:
              </label>
              <input
                type="text"
                value={senderTxid}
                onChange={(e) => setSenderTxid(e.target.value)}
                placeholder="e.g. 0x8a94e... or TX7894291..."
                required
                className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Broadcasting to Blockchain...</span>
              </>
            ) : (
              <>
                <span>Submit Deposit for Activation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
