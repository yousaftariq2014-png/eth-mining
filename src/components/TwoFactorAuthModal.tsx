import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Copy, 
  Check, 
  QrCode, 
  Smartphone, 
  X, 
  Lock, 
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { TwoFactorAuthSettings } from '../types';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  currentSettings: TwoFactorAuthSettings;
  onSaveSettings: (settings: TwoFactorAuthSettings) => void;
  // Verification mode (e.g. For verifying withdrawal)
  isVerificationOnly?: boolean;
  onVerificationSuccess?: () => void;
  verificationTitle?: string;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  currentSettings,
  onSaveSettings,
  isVerificationOnly = false,
  onVerificationSuccess,
  verificationTitle = 'Confirm 2FA Code to Authorize'
}) => {
  const [step, setStep] = useState<'setup' | 'backup' | 'manage' | 'verify'>('setup');
  const [tempSecret, setTempSecret] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setInputCode('');
      setCopiedSecret(false);
      setCopiedBackup(false);

      if (isVerificationOnly) {
        setStep('verify');
      } else if (currentSettings.isEnabled) {
        setStep('manage');
        setBackupCodes(currentSettings.backupCodes || []);
      } else {
        setStep('setup');
        // Generate pseudo-random Base32 secret
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 16; i++) {
          secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setTempSecret(secret.match(/.{1,4}/g)?.join(' ') || secret);

        // Generate 4 backup recovery codes
        const codes = Array.from({ length: 4 }, () => 
          Math.floor(10000000 + Math.random() * 90000000).toString()
        );
        setBackupCodes(codes);
      }
    }
  }, [isOpen, currentSettings, isVerificationOnly]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(tempSecret.replace(/\s+/g, ''));
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleVerifyAndEnable = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Verification check: accept any 6-digit code or standard test code
    const cleanCode = inputCode.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanCode) && !backupCodes.includes(cleanCode)) {
      setErrorMsg('Please enter a valid 6-digit authenticator code.');
      return;
    }

    const updated: TwoFactorAuthSettings = {
      isEnabled: true,
      secret: tempSecret.replace(/\s+/g, ''),
      backupCodes: backupCodes,
      activatedAt: new Date().toISOString()
    };

    onSaveSettings(updated);
    setStep('backup');
    setSuccessMsg('Two-Factor Authentication (2FA) successfully activated!');
  };

  const handleDisable2FA = () => {
    const updated: TwoFactorAuthSettings = {
      isEnabled: false,
      secret: '',
      backupCodes: [],
      activatedAt: undefined
    };
    onSaveSettings(updated);
    setSuccessMsg('2FA has been disabled.');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = inputCode.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanCode) && !currentSettings.backupCodes?.includes(cleanCode)) {
      setErrorMsg('Invalid 6-digit authenticator or backup recovery code.');
      return;
    }

    setSuccessMsg('Identity verified successfully!');
    setTimeout(() => {
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1424] border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090e1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isVerificationOnly ? verificationTitle : 'Google Authenticator 2FA'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Multi-Factor Military Grade Protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: VERIFICATION CHALLENGE */}
          {step === 'verify' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-xs font-bold text-white">Security Verification Required</h4>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  Enter the 6-digit code from Google Authenticator, Authy, or one of your emergency backup codes to authorize this action.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400">6-Digit Authenticator Code:</label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="000 000"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-lg font-mono font-black tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Confirm Withdrawal</span>
              </button>
            </form>
          )}

          {/* VIEW: SETUP NEW 2FA */}
          {step === 'setup' && (
            <form onSubmit={handleVerifyAndEnable} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Step 1: Scan QR or Enter Secret Key</span>
                </div>
                
                {/* SVG QR Code Simulation Graphic */}
                <div className="p-3 bg-white rounded-xl mx-auto w-36 h-36 flex flex-col items-center justify-center shadow-inner">
                  <div className="grid grid-cols-6 gap-1 w-28 h-28 p-1 bg-slate-950 rounded">
                    {Array.from({ length: 36 }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`rounded-xs ${((idx % 2 === 0 && idx % 3 === 0) || idx === 0 || idx === 5 || idx === 30 || idx === 35) ? 'bg-emerald-400' : 'bg-slate-800'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Secret Key with Copy */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">Manual Entry Secret Key:</span>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b101c] border border-slate-700">
                    <span className="text-xs font-mono font-bold text-amber-300 tracking-wider">
                      {tempSecret}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Verification Code Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400">
                  Step 2: Enter 6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-base font-mono font-black tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={inputCode.length < 6}
                className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                  inputCode.length === 6
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Activate 2FA Security</span>
              </button>
            </form>
          )}

          {/* VIEW: BACKUP RECOVERY CODES */}
          {step === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Important: Save Your Backup Codes</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  If you lose access to your authenticator app, these emergency backup codes are the only way to access your wallet.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center text-amber-300 font-bold">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBackup ? 'Backup Codes Copied!' : 'Copy All Backup Codes'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                I Have Saved My Backup Codes &bull; Done
              </button>
            </div>
          )}

          {/* VIEW: MANAGE EXISTING 2FA */}
          {step === 'manage' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-300">2FA Protection Active</h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Withdrawals & security modifications are strictly protected.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase font-mono">
                  ACTIVE
                </span>
              </div>

              {backupCodes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Emergency Recovery Codes ({backupCodes.length})</span>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="text-amber-400 hover:underline text-[10px] cursor-pointer"
                    >
                      {copiedBackup ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    {backupCodes.map((c, i) => (
                      <div key={i} className="p-1.5 bg-slate-950 border border-slate-800 rounded text-center text-slate-300">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleDisable2FA}
                className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 cursor-pointer transition-colors"
              >
                Disable 2FA Protection
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
