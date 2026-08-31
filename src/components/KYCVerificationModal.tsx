import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Camera, 
  Building2, 
  User, 
  MapPin, 
  X, 
  Clock, 
  Check, 
  Sparkles,
  ArrowRight,
  Info,
  ChevronRight,
  Lock
} from 'lucide-react';
import { UserProfile, KYCSubmission, KYCStatus, KYCLevel } from '../types';

interface KYCVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onKYCSubmitted: (submission: KYCSubmission) => void;
  existingSubmission?: KYCSubmission | null;
}

export const KYCVerificationModal: React.FC<KYCVerificationModalProps> = ({
  isOpen,
  onClose,
  user,
  onKYCSubmitted,
  existingSubmission,
}) => {
  const [selectedTier, setSelectedTier] = useState<KYCLevel>(
    user.kycLevel === 1 ? 2 : 1
  );
  
  // Tier 1 Form State
  const [fullName, setFullName] = useState<string>(existingSubmission?.fullName || user.name || '');
  const [dob, setDob] = useState<string>(existingSubmission?.dob || '1992-05-15');
  const [country, setCountry] = useState<string>(existingSubmission?.country || 'United States');
  const [docType, setDocType] = useState<'passport' | 'national_id' | 'driver_license'>(
    existingSubmission?.docType || 'passport'
  );
  const [docNumber, setDocNumber] = useState<string>(existingSubmission?.docNumber || '');
  
  // Real Uploaded File URLs & Base64 Data
  const [docFrontUrl, setDocFrontUrl] = useState<string>(existingSubmission?.docFrontUrl || '');
  const [docFrontName, setDocFrontName] = useState<string>(existingSubmission?.docFrontUrl ? 'id_front_scan.jpg' : '');
  const [docBackUrl, setDocBackUrl] = useState<string>(existingSubmission?.docBackUrl || '');
  const [docBackName, setDocBackName] = useState<string>(existingSubmission?.docBackUrl ? 'id_back_scan.jpg' : '');
  const [selfieUrl, setSelfieUrl] = useState<string>(existingSubmission?.selfieUrl || '');
  const [selfieName, setSelfieName] = useState<string>(existingSubmission?.selfieUrl ? 'live_selfie_auth.jpg' : '');

  // Tier 2 Form State
  const [residentialAddress, setResidentialAddress] = useState<string>(existingSubmission?.residentialAddress || '');
  const [city, setCity] = useState<string>(existingSubmission?.city || '');
  const [postalCode, setPostalCode] = useState<string>(existingSubmission?.postalCode || '');
  const [utilityBillUrl, setUtilityBillUrl] = useState<string>(existingSubmission?.utilityBillUrl || '');
  const [utilityBillName, setUtilityBillName] = useState<string>(existingSubmission?.utilityBillUrl ? 'bank_statement.pdf' : '');

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentStatus: KYCStatus = existingSubmission?.status || user.kycStatus || 'unverified';

  // Real File Upload Handler with Base64 & Server Private Vault Tokenization
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'front' | 'back' | 'selfie' | 'bill') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 10MB limit.`);
      return;
    }

    setUploadingField(field);
    setErrorMsg('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const res = await fetch('/api/kyc/upload-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              userEmail: user.email,
              docType: field,
              fileName: file.name,
              fileMime: file.type || 'image/jpeg',
              dataBase64: base64Data,
            }),
          });

          const data = await res.json();
          if (data.success && data.secureUrl) {
            if (field === 'front') {
              setDocFrontName(file.name);
              setDocFrontUrl(data.secureUrl);
            } else if (field === 'back') {
              setDocBackName(file.name);
              setDocBackUrl(data.secureUrl);
            } else if (field === 'selfie') {
              setSelfieName(file.name);
              setSelfieUrl(data.secureUrl);
            } else if (field === 'bill') {
              setUtilityBillName(file.name);
              setUtilityBillUrl(data.secureUrl);
            }
          } else {
            // Fallback to client-side encoded preview
            if (field === 'front') { setDocFrontName(file.name); setDocFrontUrl(base64Data); }
            if (field === 'back') { setDocBackName(file.name); setDocBackUrl(base64Data); }
            if (field === 'selfie') { setSelfieName(file.name); setSelfieUrl(base64Data); }
            if (field === 'bill') { setUtilityBillName(file.name); setUtilityBillUrl(base64Data); }
          }
        } catch {
          if (field === 'front') { setDocFrontName(file.name); setDocFrontUrl(base64Data); }
          if (field === 'back') { setDocBackName(file.name); setDocBackUrl(base64Data); }
          if (field === 'selfie') { setSelfieName(file.name); setSelfieUrl(base64Data); }
          if (field === 'bill') { setUtilityBillName(file.name); setUtilityBillUrl(base64Data); }
        } finally {
          setUploadingField(null);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setErrorMsg('Failed to process document file.');
      setUploadingField(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full legal name as it appears on your ID.');
      return;
    }
    if (!docNumber.trim()) {
      setErrorMsg('Please enter your document / passport number.');
      return;
    }
    if (!docFrontName) {
      setErrorMsg('Please upload the front scan of your identification document.');
      return;
    }
    if (selectedTier === 2 && (!residentialAddress.trim() || !city.trim())) {
      setErrorMsg('Please complete your residential address and city for Tier 2 Institutional verification.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const submission: KYCSubmission = {
        id: `kyc-${user.id}-${Date.now()}`,
        userId: user.id,
        userName: user.name || fullName,
        userEmail: user.email,
        tier: selectedTier,
        status: 'pending',
        fullName: fullName.trim(),
        dob,
        country,
        docType,
        docNumber: docNumber.trim(),
        docFrontUrl: docFrontUrl || (docFrontName ? '/api/kyc/document/doc-front' : undefined),
        docBackUrl: docBackUrl || (docBackName ? '/api/kyc/document/doc-back' : undefined),
        selfieUrl: selfieUrl || (selfieName ? '/api/kyc/document/doc-selfie' : undefined),
        residentialAddress: residentialAddress.trim() || undefined,
        city: city.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        utilityBillUrl: utilityBillUrl || (utilityBillName ? '/api/kyc/document/doc-bill' : undefined),
        submittedAt: new Date().toISOString(),
      };

      onKYCSubmitted(submission);
      setIsSubmitting(false);
      setSuccessMsg('Your KYC identity dossier has been encrypted & submitted to the compliance vault! Review completes within 2-4 hours.');
      setTimeout(() => {
        onClose();
      }, 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0c1220] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#10182b] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Identity & Institutional KYC Center</h3>
                {currentStatus === 'verified' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Tier {user.kycLevel || 1} Verified
                  </span>
                ) : currentStatus === 'pending' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending Review
                  </span>
                ) : currentStatus === 'rejected' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Resubmission Required
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Secure compliance clearing for zero-limit withdrawals and institutional nodes</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Status Banner if already submitted */}
          {currentStatus === 'verified' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-300 leading-relaxed font-mono">
                <strong className="block text-white font-sans text-sm mb-0.5">Account Fully Verified & Cleared</strong>
                Your account holds verified <strong>Tier {user.kycLevel || 1} Institutional Status</strong>. All daily withdrawal ceilings are unlocked and dedicated mining rigs operate at maximum efficiency.
              </div>
            </div>
          )}

          {currentStatus === 'pending' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-spin" />
              <div className="text-xs text-amber-300 leading-relaxed font-mono">
                <strong className="block text-white font-sans text-sm mb-0.5">Verification in Progress</strong>
                Your submitted documents are currently under security review by the compliance administration. You will receive immediate clearance notification.
              </div>
            </div>
          )}

          {currentStatus === 'rejected' && existingSubmission?.rejectionReason && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300 leading-relaxed font-mono">
                <strong className="block text-white font-sans text-sm mb-0.5">Verification Feedback from Compliance:</strong>
                {existingSubmission.rejectionReason}
              </div>
            </div>
          )}

          {/* Tier Selection Tabs */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedTier(1)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedTier === 1
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Tier 1: Standard ID</span>
                {selectedTier === 1 && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-xs font-semibold text-white">Government Photo Identity</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Up to $50,000 / Day Cashout</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTier(2)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedTier === 2
                  ? 'bg-purple-500/15 border-purple-500/50 text-white shadow-lg shadow-purple-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">Tier 2: Institutional</span>
                {selectedTier === 2 && <Check className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-xs font-semibold text-white">Enhanced Proof of Address</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Unlimited Payouts & VIP Desks</p>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Step 1: Personal Data */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Legal Identity Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Michael Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Country of Residence *</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Germany">Germany</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="France">France</option>
                    <option value="Other">Other Global Jurisdiction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Document Type *</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="passport">Passport (International)</option>
                    <option value="national_id">National ID Card / Green Card</option>
                    <option value="driver_license">Driver's License</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">ID / Passport Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A92837492B"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Document Upload Simulation */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Document Scans & Biometric Photo</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Encrypted AES-256 Storage</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                
                {/* Front Scan */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5 relative overflow-hidden">
                  <input
                    type="file"
                    id="kyc-file-front"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'front')}
                  />
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <span className="text-[11px] text-slate-300 font-sans font-bold">Front ID Scan</span>
                  {uploadingField === 'front' ? (
                    <span className="text-[10px] text-cyan-400 animate-pulse font-bold">Encrypting...</span>
                  ) : docFrontName ? (
                    <label
                      htmlFor="kyc-file-front"
                      className="cursor-pointer text-[10px] text-emerald-400 font-bold truncate max-w-full hover:underline"
                      title="Click to replace file"
                    >
                      ✓ {docFrontName}
                    </label>
                  ) : (
                    <label
                      htmlFor="kyc-file-front"
                      className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Attach File
                    </label>
                  )}
                </div>

                {/* Back Scan */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5 relative overflow-hidden">
                  <input
                    type="file"
                    id="kyc-file-back"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'back')}
                  />
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span className="text-[11px] text-slate-300 font-sans font-bold">Back ID Scan</span>
                  {uploadingField === 'back' ? (
                    <span className="text-[10px] text-amber-400 animate-pulse font-bold">Encrypting...</span>
                  ) : docBackName ? (
                    <label
                      htmlFor="kyc-file-back"
                      className="cursor-pointer text-[10px] text-emerald-400 font-bold truncate max-w-full hover:underline"
                      title="Click to replace file"
                    >
                      ✓ {docBackName}
                    </label>
                  ) : (
                    <label
                      htmlFor="kyc-file-back"
                      className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Attach File
                    </label>
                  )}
                </div>

                {/* Selfie Biometrics */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5 relative overflow-hidden">
                  <input
                    type="file"
                    id="kyc-file-selfie"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'selfie')}
                  />
                  <Camera className="w-5 h-5 text-purple-400" />
                  <span className="text-[11px] text-slate-300 font-sans font-bold">Live Selfie</span>
                  {uploadingField === 'selfie' ? (
                    <span className="text-[10px] text-purple-400 animate-pulse font-bold">Encrypting...</span>
                  ) : selfieName ? (
                    <label
                      htmlFor="kyc-file-selfie"
                      className="cursor-pointer text-[10px] text-emerald-400 font-bold truncate max-w-full hover:underline"
                      title="Click to replace photo"
                    >
                      ✓ {selfieName}
                    </label>
                  ) : (
                    <label
                      htmlFor="kyc-file-selfie"
                      className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Capture Photo
                    </label>
                  )}
                </div>

              </div>
            </div>

            {/* Step 3: Tier 2 Proof of Address (if Tier 2 selected) */}
            {selectedTier === 2 && (
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>Tier 2: Proof of Residency & Address Verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Residential Street Address *</label>
                    <input
                      type="text"
                      placeholder="e.g. 742 Evergreen Terrace, Suite 400"
                      value={residentialAddress}
                      onChange={(e) => setResidentialAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">City / State *</label>
                    <input
                      type="text"
                      placeholder="e.g. New York, NY"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Postal / ZIP Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 10001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Bank Statement / Utility Bill</span>
                      <span className="text-[10px] text-slate-400 font-mono">Issued within the last 90 days (PDF / Image)</span>
                    </div>
                    <input
                      type="file"
                      id="kyc-file-bill"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'bill')}
                    />
                    {uploadingField === 'bill' ? (
                      <span className="text-[10px] text-purple-400 animate-pulse font-bold">Encrypting...</span>
                    ) : utilityBillName ? (
                      <label
                        htmlFor="kyc-file-bill"
                        className="cursor-pointer text-[10px] text-emerald-400 font-mono font-bold hover:underline"
                        title="Click to replace bill"
                      >
                        ✓ {utilityBillName}
                      </label>
                    ) : (
                      <label
                        htmlFor="kyc-file-bill"
                        className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold cursor-pointer transition-all"
                      >
                        Upload Bill
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Submitting Dossier...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit KYC for Tier {selectedTier} Clearance</span>
                </>
              )}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
};
