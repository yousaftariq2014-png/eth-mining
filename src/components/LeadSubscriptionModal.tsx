import React, { useState } from 'react';
import { 
  X, 
  BellRing, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Zap, 
  ArrowRight 
} from 'lucide-react';
import { LeadSubscriber, LeadPopupConfig } from '../types';

interface LeadSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (lead: { name: string; email: string; phone: string }) => void;
  config?: LeadPopupConfig;
}

export const LeadSubscriptionModal: React.FC<LeadSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  config
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 7) {
      setError('Please enter a valid phone number or WhatsApp number.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      onSubscribe({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone
      });
      setIsSubmitting(false);
      setIsSubmitted(true);

      // Auto close after 2.5s if user doesn't click
      setTimeout(() => {
        onClose();
      }, 2500);
    }, 600);
  };

  const title = config?.title || 'Subscribe for VIP Mining & Production Updates';
  const subtitle = config?.subtitle || 'Get instant real-time notifications for daily ETH yield rates, pool difficulty adjustments, exclusive VIP bonuses, and network announcements.';
  const badgeText = config?.badgeText || '⚡ REAL-TIME UPDATES';
  const buttonText = config?.buttonText || 'Subscribe for VIP Updates';

  return (
    <div 
      id="lead-subscription-modal-backdrop"
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div 
        id="lead-subscription-modal-card"
        className="relative w-full max-w-md bg-[#0c1222] border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100"
      >
        {/* Glow Header Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400" />

        {/* Close Button */}
        <button
          id="lead-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-10 border border-slate-700/60"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          /* SUCCESS STATE */
          <div className="p-8 text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">
                You're Subscribed!
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Thank you, <span className="text-amber-400 font-semibold">{name}</span>. Your details have been securely logged. You will now receive priority updates regarding ETH2.0 mining nodes, payout events, and VIP promotions.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Contact details registered in Admin Portal</span>
            </div>

            <button
              id="lead-modal-continue-btn"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Mining Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* SUBSCRIPTION FORM STATE */
          <div className="p-6 sm:p-7 space-y-5">
            {/* Header / Badge */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-400 tracking-wider">
                <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{badgeText}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Value Bullets */}
            <div className="grid grid-cols-2 gap-2 py-1">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-300">
                <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="truncate">Instant Node Yield Alerts</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">VIP Bonus Drops</span>
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Inputs Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Name</span>
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="lead-input-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (e.g. John Doe)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Email Address</span>
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="lead-input-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone / WhatsApp input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Phone / WhatsApp Number</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-400/80 font-mono">Include country code</span>
                </div>
                <div className="relative">
                  <input
                    id="lead-input-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900 or +92 300 1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                id="lead-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Contact Info...</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    <span>{buttonText}</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer / Privacy Guarantee */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Spam &bull; 100% Privacy Protected</span>
              </span>
              <button
                id="lead-dismiss-text-btn"
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 cursor-pointer underline text-[11px]"
              >
                Dismiss for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
