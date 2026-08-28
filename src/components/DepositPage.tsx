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
  ArrowRight
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

  // Address map
  const depositAddresses = {
    TRC20: 'TQn9Y2khEsLJW1ChV8N8N6uG2X734fjk',
    ERC20: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    BEP20: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  };

  const currentAddress = depositAddresses[network];

  // Check if there is an active pending deposit for this package or recent
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
              <div className="text-2xl font-black text-amber-400">${userPendingDeposit.amountUsd} USDT</div>
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
                  <div className="text-xs font-bold text-amber-400">Admin Review & Cloud Hashrate Allocation</div>
                  <div className="text-[11px] text-slate-400">Admin is verifying your deposit to activate your live mining dashboard.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Details Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="text-slate-500 text-[10px]">Package</div>
              <div className="font-bold text-white mt-0.5">{userPendingDeposit.packageName}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Tier</div>
              <div className="font-bold text-amber-400 mt-0.5">VIP {userPendingDeposit.vipLevel}</div>
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                VIP {selectedPackage.vipLevel}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                +{selectedPackage.dailyReturnPercent}% Daily Yield
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Deposit & Activate {selectedPackage.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hashrate: <span className="text-amber-400 font-bold font-mono">{selectedPackage.hashrate} {selectedPackage.hashrateUnit}</span> • 4 Cycle Payouts Every 6 Hours
            </p>
          </div>

          <div className="text-left sm:text-right font-mono bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Required Deposit</div>
            <div className="text-2xl font-black text-white">${selectedPackage.priceUsd} <span className="text-xs text-amber-400">USDT</span></div>
          </div>
        </div>

        {/* Network Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Select Deposit Network</label>
          <div className="grid grid-cols-3 gap-2">
            {(['TRC20', 'ERC20', 'BEP20'] as const).map((net) => (
              <button
                key={net}
                type="button"
                onClick={() => setNetwork(net)}
                className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border text-center ${
                  network === net
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black shadow-md shadow-amber-500/10'
                    : 'bg-[#131d35] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>USDT - {net}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {net === 'TRC20' ? 'Low Fee (Fast)' : net === 'ERC20' ? 'Ethereum Mainnet' : 'BNB Smart Chain'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deposit Address & QR Code Box */}
        <div className="rounded-2xl bg-[#131d35] border border-slate-700/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            
            {/* QR code */}
            <div className="w-28 h-28 bg-white rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-lg">
              <QrCode className="w-24 h-24 text-slate-950" />
            </div>

            {/* Address Info */}
            <div className="space-y-2 flex-1 w-full text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-between">
                <span className="text-xs font-bold text-slate-400">Official USDT ({network}) Receiving Address:</span>
                <span className="hidden sm:inline text-[10px] font-mono text-emerald-400 font-bold">● Network Online</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-amber-300 font-mono text-xs sm:text-sm font-bold break-all select-all flex items-center justify-between gap-2">
                <span>{currentAddress}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Send exactly <strong className="text-white font-mono">${selectedPackage.priceUsd} USDT</strong> via the <strong className="text-amber-300">{network}</strong> network to the address above.
              </p>
            </div>
          </div>
        </div>

        {/* Deposit Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Deposit Amount (USDT)</span>
              <span className="text-[11px] text-slate-400 font-mono font-normal">Package Price: ${selectedPackage.priceUsd}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={selectedPackage.priceUsd}
                required
                className="w-full bg-[#131d35] border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                USDT
              </span>
            </div>
          </div>

          {/* TXID / Sender Hash Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Your Sender Wallet Address / Transaction Hash (TXID)</span>
              <span className="text-[11px] text-amber-400 font-normal">Required for verification</span>
            </label>
            <input
              type="text"
              value={senderTxid}
              onChange={(e) => setSenderTxid(e.target.value)}
              placeholder="e.g. 0x8f2a... or TQv97... or TXID hash"
              required
              className="w-full bg-[#131d35] border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              After submitting, the deposit will be marked as <strong className="text-amber-300">Pending</strong>. Once reviewed and approved by the admin, your mining node will immediately activate.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Deposit...</span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Submit ${amount} USDT Deposit for Approval</span>
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
};
