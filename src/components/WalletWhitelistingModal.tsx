import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  Check, 
  Copy, 
  X, 
  AlertTriangle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { WhitelistedWalletAddress } from '../types';

interface WalletWhitelistingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  whitelist: WhitelistedWalletAddress[];
  onSaveWhitelist: (whitelist: WhitelistedWalletAddress[]) => void;
  strictMode: boolean;
  onToggleStrictMode: (enabled: boolean) => void;
  onSelectAddressForWithdraw?: (address: string, network: 'USDT-TRC20' | 'USDT-ERC20' | 'USDT-POLYGON') => void;
}

export const WalletWhitelistingModal: React.FC<WalletWhitelistingModalProps> = ({
  isOpen,
  onClose,
  userId,
  whitelist,
  onSaveWhitelist,
  strictMode,
  onToggleStrictMode,
  onSelectAddressForWithdraw
}) => {
  const [label, setLabel] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [network, setNetwork] = useState<'USDT-TRC20' | 'USDT-ERC20' | 'USDT-POLYGON'>('USDT-TRC20');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanLabel = label.trim();
    const cleanAddress = address.trim();

    if (!cleanLabel) {
      setErrorMsg('Please enter a label for this address (e.g. Binance TRC20, Trust Wallet, Polygon).');
      return;
    }

    if (!cleanAddress || cleanAddress.length < 24) {
      setErrorMsg('Please enter a valid crypto wallet address.');
      return;
    }

    // Network format sanity checks
    if (network === 'USDT-TRC20' && !cleanAddress.startsWith('T')) {
      setErrorMsg('Tron (TRC-20) addresses usually start with uppercase "T".');
      return;
    }
    if ((network === 'USDT-ERC20' || network === 'USDT-POLYGON') && !cleanAddress.startsWith('0x')) {
      setErrorMsg('Ethereum ERC-20 and Polygon POS addresses must start with "0x".');
      return;
    }

    // Check duplicates
    if (whitelist.some(w => w.address.toLowerCase() === cleanAddress.toLowerCase())) {
      setErrorMsg('This wallet address is already added in your whitelist.');
      return;
    }

    const newItem: WhitelistedWalletAddress = {
      id: `wl-${Date.now()}`,
      userId,
      label: cleanLabel,
      address: cleanAddress,
      network,
      isLocked: true,
      addedAt: new Date().toISOString().substring(0, 10)
    };

    const updated = [newItem, ...whitelist];
    onSaveWhitelist(updated);
    setLabel('');
    setAddress('');
    setSuccessMsg(`"${cleanLabel}" successfully whitelisted!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveAddress = (id: string) => {
    const updated = whitelist.filter(w => w.id !== id);
    onSaveWhitelist(updated);
  };

  const handleCopy = (addr: string, id: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (item: WhitelistedWalletAddress) => {
    if (onSelectAddressForWithdraw) {
      onSelectAddressForWithdraw(item.address, item.network);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0d1424] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090e1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Wallet Address Whitelist & Security Lock
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Anti-Phishing & Clipboard Hijack Defense
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

        {/* Strict Whitelist Switch Banner */}
        <div className="bg-[#10192e] px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Strict Whitelist Mode</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              When enabled, payouts are exclusively permitted to pre-approved addresses.
            </p>
          </div>

          <button
            onClick={() => onToggleStrictMode(!strictMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
              strictMode
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {strictMode ? 'STRICT: ON' : 'OPTIONAL: OFF'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form: Add New Whitelisted Address */}
          <form onSubmit={handleAddAddress} className="p-4 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-3">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Whitelist New Withdrawal Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">Address Label / Tag:</label>
                <input
                  type="text"
                  placeholder="e.g. Binance TRC20, Trust Wallet"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">Network:</label>
                <select
                  value={network}
                  onChange={(e: any) => setNetwork(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="USDT-TRC20">USDT (Tron TRC-20)</option>
                  <option value="USDT-ERC20">USDT (Ethereum ERC-20)</option>
                  <option value="USDT-POLYGON">USDT (Polygon POS)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">Wallet Address:</label>
              <input
                type="text"
                placeholder={network === 'USDT-TRC20' ? 'TGgfnP... (TRC-20 Address)' : '0x91D8... (ERC-20 / Polygon POS)'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Trusted Whitelist</span>
            </button>
          </form>

          {/* List of Saved Addresses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Saved Verified Addresses ({whitelist.length})</span>
              <span className="text-[10px] text-slate-400 font-mono">Click to autofill withdrawal</span>
            </div>

            {whitelist.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#090e1a] border border-slate-800 text-center space-y-1.5">
                <Wallet className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">No whitelisted addresses yet.</p>
                <p className="text-[10px] text-slate-500 font-mono">Add your primary wallet addresses above to simplify cashouts.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {whitelist.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#090e1a] border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div 
                      onClick={() => handleSelect(item)}
                      className="space-y-1 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{item.label}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                          {item.network.replace('USDT-', '')}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Whitelisted</span>
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 truncate hover:text-amber-300">
                        {item.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(item.address, item.id)}
                        title="Copy address"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleSelect(item)}
                        title="Use for withdrawal"
                        className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Select
                      </button>

                      <button
                        onClick={() => handleRemoveAddress(item.id)}
                        title="Delete from whitelist"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
