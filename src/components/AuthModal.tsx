import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Zap, 
  KeyRound, 
  Wallet, 
  Globe, 
  ShieldAlert,
  Server,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  language?: Language;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  language = 'en',
  onLoginSuccess,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Sync mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setSuccessMsg('');
    setIsForgotPasswordOpen(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Password strength calculation
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 25;
    return score;
  };

  const passStrength = calculatePasswordStrength(password);

  const getStrengthLabel = (score: number) => {
    if (score < 25) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score < 75) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-400' };
    return { label: 'Strong (Secure)', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strengthInfo = getStrengthLabel(passStrength);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (mode === 'signup' && !agreeTerms) {
      setErrorMsg('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const userProfile: UserProfile = {
        id: `user-${Date.now()}`,
        name: mode === 'signup' ? name.trim() : (email.split('@')[0] || 'Miner User'),
        email: email.trim(),
        isLoggedIn: true,
        joinedDate: new Date().toISOString().split('T')[0],
        plan: 'VIP 1 Starter',
        vipLevel: 1,
        hasClaimedFreeBonus: true,
      };

      // Save to global registered clients database in localStorage
      try {
        const existingUsersStr = localStorage.getItem('hashforge_registered_users');
        const existingUsers: UserProfile[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];
        if (!existingUsers.some(u => u.email.toLowerCase() === userProfile.email.toLowerCase())) {
          existingUsers.unshift(userProfile);
          localStorage.setItem('hashforge_registered_users', JSON.stringify(existingUsers));
        }
      } catch (err) {
        console.error('Error saving user to DB', err);
      }

      if (rememberMe) {
        localStorage.setItem('hashforge_user', JSON.stringify(userProfile));
      }

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#6366f1'],
      });

      onLoginSuccess(userProfile);
      onClose();
    }, 600);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg('Please enter your registered email.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg(`Password reset instructions sent to ${forgotEmail}`);
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
        setSuccessMsg('');
      }, 3000);
    }, 800);
  };

  const handleOAuthSimulate = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const userProfile: UserProfile = {
        id: `user-oauth-${Date.now()}`,
        name: provider === 'Google' ? 'Google Miner' : 'Web3 Wallet User',
        email: provider === 'Google' ? 'user@gmail.com' : '0x71C...49A1',
        isLoggedIn: true,
        joinedDate: new Date().toISOString().split('T')[0],
        plan: 'Starter Free 10 TH/s',
        hasClaimedFreeBonus: true,
      };

      localStorage.setItem('hashforge_user', JSON.stringify(userProfile));
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981'],
      });
      onLoginSuccess(userProfile);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0d1424] border border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500" />

        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Feature Showcase Column (Desktop/Tablet) */}
          <div className="hidden md:flex md:col-span-5 bg-gradient-to-b from-[#111a33] via-[#0e162b] to-[#0a101f] p-8 border-r border-slate-800/80 flex-col justify-between relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Brand Top */}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                  <Zap className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-white tracking-tight leading-none">
                    HASH<span className="text-amber-400">FORGE</span> PRO
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Institutional Cloud Mining</span>
                </div>
              </div>

              {/* Bonus Highlight Card */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Free Welcome Bonus</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Get <strong className="text-white font-mono">10 TH/s SHA-256</strong> instant hashrate allocated to your account upon registration.
                </p>
              </div>

              {/* Trust Checkpoints */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>$100 Minimum Package:</strong> Start real cloud mining with low entry cost and daily payouts.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Maintenance Fees:</strong> 100% transparent daily PoW yield calculation.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Multi-Algorithm Rigs:</strong> Bitcoin (SHA-256), Kaspa (kHeavyHash), ETC & Monero.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Direct Non-Custodial:</strong> Withdraw anytime to your personal cold/hot wallet.</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Badge */}
            <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>256-Bit SSL Encrypted & SOC-2 Verified</span>
            </div>

          </div>

          {/* Right Form Column */}
          <div className="col-span-1 md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            
            <div>
              {/* Mode Switcher Tabs */}
              {!isForgotPasswordOpen && (
                <div className="flex items-center p-1 bg-[#070b14] border border-slate-800 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'login'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'signup'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="mb-5">
                {isForgotPasswordOpen ? (
                  <div>
                    <h3 className="text-xl font-black text-white">Reset Password</h3>
                    <p className="text-xs text-slate-400 mt-1">Enter your registered email to receive a recovery link.</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {mode === 'signup' ? 'Create Your Miner Account' : 'Welcome Back to HashForge'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {mode === 'signup' 
                        ? 'Deploy contracts, monitor stratum pools, and collect daily crypto payouts.'
                        : 'Enter your credentials to access your active rigs and wallet balance.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Forgot Password View */}
              {isForgotPasswordOpen ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-[#080c16] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsForgotPasswordOpen(false); setErrorMsg(''); }}
                    className="w-full text-center text-xs text-amber-400 hover:underline cursor-pointer pt-2"
                  >
                    &larr; Back to Sign In
                  </button>
                </form>
              ) : (
                /* Main Login & Signup Form */
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  
                  {/* Full Name (Sign Up only) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="auth-name-input"
                          type="text"
                          required
                          placeholder="Satoshi Nakamoto"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#080c16] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-email-input"
                        type="email"
                        required
                        placeholder="miner@hashforge.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#080c16] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Password Field with Show/Hide Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => { setIsForgotPasswordOpen(true); setErrorMsg(''); }}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#080c16] border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator (Signup Mode) */}
                    {mode === 'signup' && password.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">Security Strength:</span>
                          <span className={`font-bold font-mono ${strengthInfo.text}`}>
                            {strengthInfo.label}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strengthInfo.color} transition-all duration-300`}
                            style={{ width: `${passStrength}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Referral Code (Optional on Signup) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Referral / Partner Code (Optional)
                      </label>
                      <input
                        id="auth-referral-input"
                        type="text"
                        placeholder="HASH-PRO-2026"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        className="w-full bg-[#080c16] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder:text-slate-600 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Checkboxes: Remember Me & Terms */}
                  <div className="space-y-2 pt-1">
                    {mode === 'login' ? (
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500/20"
                        />
                        <span>Remember this device for 30 days</span>
                      </label>
                    ) : (
                      <label className="flex items-start gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="w-3.5 h-3.5 mt-0.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500/20"
                        />
                        <span>
                          I agree to HashForge <span className="text-amber-400 underline">Terms of Service</span> and <span className="text-amber-400 underline">Privacy Policy</span>.
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Submit Action Button */}
                  <button
                    id="auth-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all disabled:opacity-60 mt-2"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      <>
                        <span>{mode === 'signup' ? 'Create Account & Claim 10 TH/s' : 'Sign In to Mining Dashboard'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Social / Web3 Fast Connect */}
              {!isForgotPasswordOpen && (
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="relative flex items-center justify-center mb-3">
                    <span className="bg-[#0d1424] px-2 text-[10px] font-mono text-slate-500 uppercase">
                      Or Connect With
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleOAuthSimulate('Google')}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#080c16] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-rose-400" />
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuthSimulate('Web3')}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#080c16] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Wallet className="w-3.5 h-3.5 text-amber-400" />
                      <span>Web3 Wallet</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Help & Switch Mode Prompt */}
            {!isForgotPasswordOpen && (
              <div className="mt-5 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
                {mode === 'signup' ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrorMsg(''); }}
                      className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer ml-1"
                    >
                      Sign In here
                    </button>
                  </span>
                ) : (
                  <span>
                    New to HashForge?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setErrorMsg(''); }}
                      className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer ml-1"
                    >
                      Create free account
                    </button>
                  </span>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
