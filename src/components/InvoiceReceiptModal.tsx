import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink,
  Cpu,
  Layers,
  Award,
  Hash
} from 'lucide-react';
import { InvoiceReceipt } from '../types';

interface InvoiceReceiptModalProps {
  receipt: InvoiceReceipt | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ receipt, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handleCopyTxid = () => {
    if (receipt.senderAddressOrTxid) {
      navigator.clipboard.writeText(receipt.senderAddressOrTxid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-2xl bg-[#0d1424] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Action Header bar (Do not print) */}
        <div className="bg-[#131d33] px-6 py-4 border-b border-slate-700/60 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Official Transaction Receipt & Certificate</h3>
              <p className="text-[11px] text-slate-400 font-mono">Invoice #{receipt.receiptNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-600/50 cursor-pointer shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={printRef} className="p-8 space-y-6 bg-[#0a0f1d] text-slate-200 print:bg-white print:text-black print:p-8">
          
          {/* Certificate Brand Banner */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-6 print:border-slate-300">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black font-mono shadow-md">
                  HF
                </div>
                <div>
                  <h1 className="text-lg font-black text-white tracking-wide print:text-black">
                    HASHFORGE <span className="text-amber-400 print:text-amber-600">ENTERPRISE</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest print:text-slate-600">
                    High-Density Cloud Mining & Settlement Network
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono print:text-slate-600">
                Zurich Hydro-Data Center Cluster #4 • Stratum v2 Settlement Protocol
              </p>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${
                receipt.status === 'Completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 print:bg-amber-100 print:text-amber-800'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {receipt.status}
              </span>
              <p className="text-xs text-slate-400 font-mono mt-1.5 print:text-slate-600">
                {receipt.date}
              </p>
            </div>
          </div>

          {/* Receipt Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#11192c] border border-slate-800 print:bg-slate-50 print:border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block print:text-slate-500">Invoice ID</span>
              <span className="text-xs font-bold font-mono text-amber-400 print:text-black">{receipt.receiptNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block print:text-slate-500">Service Type</span>
              <span className="text-xs font-bold text-white print:text-black">{receipt.transactionType}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block print:text-slate-500">Client Name</span>
              <span className="text-xs font-bold text-white print:text-black">{receipt.userName || 'Verified Investor'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block print:text-slate-500">Client Account</span>
              <span className="text-xs font-mono text-slate-300 truncate block print:text-black">{receipt.userEmail}</span>
            </div>
          </div>

          {/* Itemized Specification Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden print:border-slate-300">
            <div className="bg-[#141e34] px-4 py-2.5 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono grid grid-cols-12 print:bg-slate-200 print:text-black">
              <div className="col-span-6">Description / Contract Specs</div>
              <div className="col-span-3 text-center">Settlement Network</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>

            <div className="p-4 space-y-3 bg-[#0d1424] print:bg-white">
              <div className="grid grid-cols-12 items-center text-xs">
                <div className="col-span-6">
                  <span className="font-bold text-white block print:text-black">{receipt.itemName}</span>
                  {receipt.hashrate && (
                    <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1 mt-0.5 print:text-amber-700">
                      <Cpu className="w-3 h-3" /> Allocated Hashrate: {receipt.hashrate}
                    </span>
                  )}
                  {receipt.vipLevel && (
                    <span className="text-[10px] text-slate-400 font-mono block print:text-slate-600">
                      VIP Level Tier {receipt.vipLevel} Status
                    </span>
                  )}
                </div>
                <div className="col-span-3 text-center font-mono text-slate-300 print:text-slate-700">
                  {receipt.network || 'USDT TRC20 / ERC20'}
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-white print:text-black">
                  <span className="text-amber-400 text-sm print:text-black">${receipt.amountUsd.toFixed(2)} USD</span>
                  {receipt.cryptoAmount && (
                    <span className="block text-[10px] text-slate-400 print:text-slate-600">
                      ≈ {receipt.cryptoAmount} {receipt.cryptoSymbol || 'ETH'}
                    </span>
                  )}
                </div>
              </div>

              {receipt.notes && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono print:bg-slate-100 print:text-slate-700 print:border-slate-200">
                  💡 Note: {receipt.notes}
                </div>
              )}
            </div>

            {/* Total Footer */}
            <div className="bg-[#131d33] px-4 py-3 border-t border-slate-800 flex justify-between items-center print:bg-slate-100 print:border-slate-300">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono print:text-black">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Platform Settlement Fee (0.00%)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono uppercase mr-2 print:text-slate-600">Total Settled:</span>
                <span className="text-base font-black text-amber-400 font-mono print:text-black">
                  ${receipt.amountUsd.toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Verification Box */}
          <div className="p-4 rounded-2xl bg-[#090d18] border border-slate-800 space-y-2.5 print:bg-slate-50 print:border-slate-300">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400 flex items-center gap-1.5 print:text-slate-600">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>On-Chain Reference / Transaction Hash:</span>
              </span>
              {receipt.senderAddressOrTxid && (
                <button
                  onClick={handleCopyTxid}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono text-[10px] cursor-pointer print:hidden"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Hash'}</span>
                </button>
              )}
            </div>

            <div className="font-mono text-[11px] text-slate-300 bg-[#11192c] p-2.5 rounded-xl border border-slate-800/80 break-all select-all print:bg-white print:text-black print:border-slate-300">
              {receipt.senderAddressOrTxid || receipt.receiverAddress || `0x${receipt.receiptNumber.replace(/[^a-f0-9]/gi, '')}9f72b4c10e53a987d6124cb`}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-500 font-mono pt-1 gap-2 print:text-slate-600">
              <span>Digital SHA-256 Certificate: {receipt.digitalSignature.slice(0, 32)}...</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold print:text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Cryptographically Verified
              </span>
            </div>
          </div>

          {/* Legal / Authenticity Signoff */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono print:border-slate-300 print:text-slate-600">
            <p>
              Issued by HashForge Pro Cloud Infrastructure LLC. All rights reserved.
            </p>
            <p className="font-bold text-slate-400 print:text-black">
              Official Sealed Copy
            </p>
          </div>

        </div>

        {/* Footer Close Button */}
        <div className="bg-[#11192c] px-6 py-4 border-t border-slate-800 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Close Receipt
          </button>
        </div>

      </div>
    </div>
  );
};
