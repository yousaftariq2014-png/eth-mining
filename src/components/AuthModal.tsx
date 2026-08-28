import React, { useState } from 'react';
import { 
  X as XIcon, 
  Lock as LockIcon, 
  Mail as MailIcon, 
  User as UserIcon, 
  Sparkles as SparklesIcon, 
  ArrowRight as ArrowRightIcon, 
  ShieldCheck as ShieldCheckIcon, 
  Eye as EyeIcon, 
  EyeOff as EyeOffIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  Zap as ZapIcon, 
  ShieldAlert as ShieldAlertIcon,
  HelpCircle as HelpCircleIcon,
  RefreshCw as RefreshCwIcon,
  Send as SendIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../locales/translations';
import { 
  signUpWithSupabase, 
  signInWithSupabase, 
  sendSupabasePasswordReset, 
  resendSupabaseActivation,
  saveSupabaseUser
} from '../lib/supabase';

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

  // Sub-screens: 'forgot_password' | 'activation_pending'
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isActivationPending, setIsActivationPending] = useState(false);
  const [activationEmail, setActivationEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setSuccessMsg('');
    setIsForgotPasswordOpen(false);
    setIsActivationPending(false);
  }, [initialMode, isOpen]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  // Handle Form Submit (Sign In or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('Please accept the Terms of Service & Privacy Policy.');
        return;
      }
      if (cleanPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }

      setIsLoading(true);
      const res = await signUpWithSupabase(cleanEmail, cleanPassword, name.trim());
      setIsLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account. Please try again.');
        return;
      }

      // Always show activation instruction if needsActivation or standard signup
      setActivationEmail(cleanEmail);
      setIsActivationPending(true);
      setSuccessMsg(`Activation email sent to ${cleanEmail}! Please verify your email to log in.`);
      
      // Also save to registered users store in browser for instant recognition
      if (res.user) {
        try {
          const existingUsersStr = localStorage.getItem('hashforge_registered_users');
          const existingUsers: UserProfile[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];
          if (!existingUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
            existingUsers.unshift(res.user);
            localStorage.setItem('hashforge_registered_users', JSON.stringify(existingUsers));
          }
        } catch (err) {
          console.warn('Local register sync error:', err);
        }
      }
      return;
    }

    // ----------------------------------------------------
    // SIGN IN FLOW WITH STRICT RESTRICTIONS
    // ----------------------------------------------------
    setIsLoading(true);
    const res = await signInWithSupabase(cleanEmail, cleanPassword);
    setIsLoading(false);

    if (!res.success) {
      if (res.notActivated) {
        setActivationEmail(cleanEmail);
        setErrorMsg(res.error || 'Your account is not activated. Please click the activation link in your email.');
      } else {
        setErrorMsg(res.error || 'Unable to sign in. Please verify your credentials.');
      }
      return;
    }

    if (res.user) {
      if (rememberMe) {
        localStorage.setItem('hashforge_user', JSON.stringify(res.user));
      }

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#6366f1'],
      });

      onLoginSuccess(res.user);
      onClose();
    }
  };

  // Handle Resend Activation Email
  const handleResendActivation = async () => {
    if (resendCooldown > 0) return;
    const target = activationEmail || email.trim();
    if (!target) {
      setErrorMsg('Please enter your email to resend activation link.');
      return;
    }

    setIsLoading(true);
    const res = await resendSupabaseActivation(target);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`New activation email successfully dispatched to ${target}!`);
      setResendCooldown(60);
    } else {
      setErrorMsg(res.error || 'Failed to resend activation email.');
    }
  };

  // Handle Forgot Password Submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    const res = await sendSupabasePasswordReset(cleanEmail);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to send password reset email.');
      return;
    }

    setSuccessMsg(`Password reset link has been dispatched to ${cleanEmail}. Please check your inbox.`);
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
          <XIcon className="w-5 h-5" />
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
                  <ZapIcon className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-white tracking-tight leading-none">
                    ETH2.0 <span className="text-amber-400">SMART</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Verified Cloud Infrastructure</span>
                </div>
              </div>

              {/* Bonus Highlight Card */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400">
                  <SparklesIcon className="w-4 h-4" />
                  <span>Secure Gmail & Email Activation</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  All accounts are protected by Supabase security and verified via instant email activation.
                </p>
              </div>

              {/* Trust Checkpoints */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Strict Client Verification:</strong> Only registered & activated accounts can access mining nodes.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Daily & 48H Plans:</strong> 2%–3% daily yield or 10%–25% 48-hour flash returns.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Direct Non-Custodial:</strong> Fast USDT withdrawals to your personal TRC20/ERC20 wallet.</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Badge */}
            <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Supabase Cloud Database & SSL 256-Bit Encrypted</span>
            </div>

          </div>

          {/* Right Form Column */}
          <div className="col-span-1 md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            
            <div>
              {/* Mode Switcher Tabs (Hidden if in activation pending or forgot password) */}
              {!isForgotPasswordOpen && !isActivationPending && (
                <div className="flex items-center p-1 bg-[#070b14] border border-slate-800 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'login'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <LockIcon className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'signup'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="mb-5">
                {isActivationPending ? (
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <MailIcon className="w-5 h-5 text-amber-400" />
                      <span>Account Activation Pending</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      An activation email has been dispatched. Please verify your email before logging in.
                    </p>
                  </div>
                ) : isForgotPasswordOpen ? (
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <LockIcon className="w-5 h-5 text-amber-400" />
                      <span>Reset Your Password</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your registered email address to receive password recovery instructions.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {mode === 'signup' ? 'Create New Client Account' : 'Sign In to Your Account'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {mode === 'signup' 
                        ? 'Register with your verified email to deploy cloud contracts & receive daily returns.'
                        : 'Enter your registered credentials to access your live mining dashboard.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback Alert Messages */}
              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                  <ShieldAlertIcon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p>{errorMsg}</p>
                    {errorMsg.toLowerCase().includes('not activated') && (
                      <button
                        type="button"
                        onClick={handleResendActivation}
                        disabled={resendCooldown > 0 || isLoading}
                        className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer inline-flex items-center gap-1 mt-1 text-[11px]"
                      >
                        <RefreshCwIcon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Activation Email'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
                  <CheckCircle2Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* VIEW A: ACTIVATION PENDING CARD */}
              {isActivationPending ? (
                <div className="space-y-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <SendIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-200">
                        We sent a verification link to: <strong className="text-amber-400 font-mono">{activationEmail}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        1. Open your email inbox (and check Spam/Junk folder if needed).<br />
                        2. Click on the <strong>Confirm Email / Activate Account</strong> link.<br />
                        3. Return here and sign in with your email and password.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActivationPending(false);
                        setMode('login');
                        setEmail(activationEmail);
                        setErrorMsg('');
                        setSuccessMsg('Email activation sent! Sign in once you have clicked the link.');
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <LockIcon className="w-3.5 h-3.5" />
                      <span>Proceed to Sign In</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResendActivation}
                      disabled={resendCooldown > 0 || isLoading}
                      className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>{resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Email'}</span>
                    </button>
                  </div>
                </div>
              ) : isForgotPasswordOpen ? (
                /* VIEW B: FORGOT PASSWORD FORM */
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <MailIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Sending Recovery Link...</span>
                      </div>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsForgotPasswordOpen(false); setErrorMsg(''); setSuccessMsg(''); }}
                    className="w-full text-center text-xs text-amber-400 hover:underline cursor-pointer pt-1"
                  >
                    &larr; Back to Sign In
                  </button>
                </form>
              ) : (
                /* VIEW C: STANDARD SIGN IN & SIGN UP FORM */
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  
                  {/* Full Name (Sign Up only) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="auth-name-input"
                          type="text"
                          required
                          placeholder="Your Full Name"
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
                      <MailIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-email-input"
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
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
                          onClick={() => { 
                            setIsForgotPasswordOpen(true); 
                            setForgotEmail(email); 
                            setErrorMsg(''); 
                            setSuccessMsg(''); 
                          }}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <LockIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                        {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
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
                        placeholder="VIP-PARTNER-2026"
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
                          I agree to ETH2.0 Smart <span className="text-amber-400 underline">Terms of Service</span> and <span className="text-amber-400 underline">Privacy Policy</span>.
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
                        <span>Verifying with Database...</span>
                      </div>
                    ) : (
                      <>
                        <span>{mode === 'signup' ? 'Create Account & Send Activation' : 'Sign In to Dashboard'}</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>

            {/* Bottom Help & Switch Mode Prompt */}
            {!isForgotPasswordOpen && !isActivationPending && (
              <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                {mode === 'signup' ? (
                  <span>
                    Already registered an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer ml-1"
                    >
                      Sign In here
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer ml-1"
                    >
                      Create account here
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
