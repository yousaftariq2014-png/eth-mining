import React, { useState } from 'react';
import { 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  Zap, 
  Tag,
  Flame,
  Award
} from 'lucide-react';
import { UserProfile, PromoCode } from '../types';

interface PromoRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onRedeemSuccess: (promo: PromoCode, bonusAmount: number) => void;
  activePromoCodes: PromoCode[];
}

export const PromoRedeemModal: React.FC<PromoRedeemModalProps> = ({
  isOpen,
  onClose,
  user,
  onRedeemSuccess,
  activePromoCodes,
}) => {
  const [code, setCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  if (!isOpen) return null;

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter a valid promotional coupon or institutional voucher code.');
      return;
    }

    // Check redeemed history in localStorage
    try {
      const redeemedList: string[] = JSON.parse(
        localStorage.getItem(`hashforge_redeemed_promos_${user.id}`) || '[]'
      );
      if (redeemedList.includes(cleanCode)) {
        setErrorMsg('You have already claimed this promotional code on your account.');
        return;
      }
    } catch {}

    const matchedPromo = activePromoCodes.find(
      p => p.code.toUpperCase() === cleanCode && p.isActive
    );

    if (!matchedPromo) {
      // Allow fallback sample codes for testing
      if (cleanCode === 'INST2026' || cleanCode === 'VIP500' || cleanCode === 'ETHBONUS' || cleanCode === 'HASH100') {
        const bonusVal = cleanCode === 'VIP500' ? 500 : cleanCode === 'INST2026' ? 250 : 100;
        const tempPromo: PromoCode = {
          id: `promo-preset-${cleanCode}`,
          code: cleanCode,
          type: 'bonus_usdt',
          value: bonusVal,
          minDepositUsd: 0,
          maxUses: 500,
          usedCount: 1,
          isActive: true,
          description: `${cleanCode} Instant Mining & Trading Grant`,
          createdAt: new Date().toISOString()
        };
        executeBonusCredit(tempPromo, bonusVal);
        return;
      }

      setErrorMsg('Invalid or expired promotional code. Please check and try again.');
      return;
    }

    executeBonusCredit(matchedPromo, matchedPromo.value);
  };

  const executeBonusCredit = (promo: PromoCode, bonusAmount: number) => {
    setIsSubmitting(true);
    setTimeout(() => {
      // Record redeemed
      try {
        const key = `hashforge_redeemed_promos_${user.id}`;
        const redeemedList: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        redeemedList.push(promo.code.toUpperCase());
        localStorage.setItem(key, JSON.stringify(redeemedList));
      } catch {}

      setAppliedPromo(promo);
      setSuccessMsg(`🎉 Success! Promo code "${promo.code}" applied. +$${bonusAmount.toFixed(2)} USDT credited to your wallet balance!`);
      setIsSubmitting(false);
      onRedeemSuccess(promo, bonusAmount);

      setTimeout(() => {
        onClose();
      }, 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#0c1220] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#10182b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Redeem Promo Voucher</h3>
              <p className="text-xs text-slate-400">Claim instant USDT balance or hashrate boost</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          <form onSubmit={handleRedeem} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Enter Promotional / Institutional Code:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. INST2026, VIP500"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold uppercase tracking-wider text-amber-300 focus:outline-none focus:border-amber-500 pl-9"
                />
                <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-slate-500">Popular Codes:</span>
              {['INST2026', 'VIP500', 'ETHBONUS'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCode(preset)}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-[10px] font-mono text-amber-400 hover:text-amber-300 transition-all"
                >
                  +{preset}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying Voucher...' : 'Claim Voucher & Inject Bonus'}</span>
            </button>
          </form>

          {/* Info Card */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Wallet Credit</span>
            </div>
            <p>
              Claimed promotional credits are automatically deposited into your Available USDT wallet balance and can be utilized for package deployment or direct cashout.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
