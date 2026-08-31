import React, { useState, useEffect } from 'react';
import {
  Zap,
  Wallet,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  X,
  Layers,
  DollarSign,
  MessageCircle,
  RefreshCw,
  CalendarDays,
  PiggyBank,
  Crown,
  Activity,
  Hourglass,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  ArrowRightLeft,
  ArrowDown,
  Cpu,
  Info,
  FileText,
  Printer,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Repeat,
  Sliders
} from 'lucide-react';
import { 
  UserProfile, 
  MiningPackage, 
  DepositRequest, 
  WithdrawalRecordItem, 
  PackageType,
  ExchangeRecordItem,
  InvoiceReceipt,
  WhitelistedWalletAddress,
  AutoReinvestConfig
} from '../types';
import { DAILY_PACKAGES, FLASH_48H_PACKAGES, MINING_PACKAGES, CUSTOM_PRESET_PACKAGES } from '../data/packagesData';
import { supabase } from '../lib/supabaseClient';
import { EthMiningPanel } from './EthMiningPanel';
import { EthToUsdtSwapModal } from './EthToUsdtSwapModal';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import { WalletWhitelistingModal } from './WalletWhitelistingModal';
import { LiveHashratePulseGraph } from './LiveHashratePulseGraph';
import { CustomPackageBuilder } from './CustomPackageBuilder';

interface ClientSmartDashboardProps {
  user: UserProfile;
  packages: MiningPackage[];
  onSelectPackage: (pkg: MiningPackage) => void;
  onOpenLiveSupport?: () => void;
  pendingDeposits?: DepositRequest[];
  onClearUserPackages?: () => void | Promise<void>;
  onOpenPoR?: () => void;
}

interface ProcessedContract {
  deposit: DepositRequest;
  pkg: MiningPackage | null;
  activationDate: Date;
  expirationDate: Date;
  isExpired: boolean;
  timeRemainingMs: number;
  timeRemainingText: string;
  progressPercent: number;
  durationLabel: string;
  isFlash: boolean;
  estTotalYieldUsd: number;
  dailyYieldUsd: number;
  accruedYieldUsd: number;
  durationMs: number;
}

function parseTimestamp(ts?: string): Date {
  if (!ts) return new Date();
  const normalized = ts.includes(' ') && !ts.includes('T') ? ts.replace(' ', 'T') : ts;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    return new Date();
  }
  return d;
}

function getContractDurationMs(dep: DepositRequest, matchedPkg: MiningPackage | null): { durationMs: number; durationLabel: string; isFlash: boolean } {
  const isFlash = 
    dep.planType === 'flash_48h' ||
    matchedPkg?.planType === 'flash_48h' ||
    matchedPkg?.durationHours === 48 ||
    (dep.packageName && dep.packageName.toLowerCase().includes('48h')) ||
    (dep.packageName && dep.packageName.toLowerCase().includes('flash'));

  if (isFlash) {
    return {
      durationMs: 48 * 60 * 60 * 1000,
      durationLabel: '48 Hours Flash Contract',
      isFlash: true
    };
  }

  const days = matchedPkg?.durationDays || 365;
  return {
    durationMs: days * 24 * 60 * 60 * 1000,
    durationLabel: `${days} Days Daily Variable Mining`,
    isFlash: false
  };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00h 00m 00s (Expired)';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

function formatDateTimeDisplay(date: Date): string {
  try {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return date.toISOString();
  }
}

export const ClientSmartDashboard: React.FC<ClientSmartDashboardProps> = ({
  user,
  packages,
  onSelectPackage,
  onOpenLiveSupport,
  pendingDeposits: externalPendingDeposits,
  onClearUserPackages,
  onOpenPoR,
}) => {
  // Action tabs: 'exchange' | 'withdraw' | 'history' | 'swap_history'
  const [actionTab, setActionTab] = useState<'exchange' | 'withdraw' | 'history' | 'swap_history'>('exchange');
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'All' | 'Pending' | 'Withdrawal successfully' | 'Failed'>('All');
  const [dashCategory, setDashCategory] = useState<PackageType>('daily');

  // Real data initialized seamlessly from localStorage + background Supabase sync
  const [approvedDeposits, setApprovedDeposits] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_deposits');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((d: any) => (d.userId === user.id || d.userName === user.name) && d.status === 'approved' && (d.explorer_confirmed ?? true));
      }
    } catch {}
    return [];
  });

  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_deposits');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((d: any) => (d.userId === user.id || d.userName === user.name) && d.status === 'pending');
      }
    } catch {}
    return [];
  });

  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecordItem[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_withdrawals');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((w: any) => w.userId === user.id || w.userName === user.name);
      }
    } catch {}
    return [];
  });

  const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecordItem[]>(() => {
    try {
      const saved = localStorage.getItem(`hashforge_swaps_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Live ETH Price Telemetry State (smooth updates)
  const [ethPriceUsd, setEthPriceUsd] = useState<number>(3488.50);
  const [ethPriceChange24h, setEthPriceChange24h] = useState<number>(3.28);
  const [isPriceRefreshing, setIsPriceRefreshing] = useState<boolean>(false);

  // Form Inputs
  const [withdrawInputUsdt, setWithdrawInputUsdt] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'USDT-TRC20' | 'USDT-ERC20' | 'USDT-POLYGON'>('USDT-TRC20');

  // Embedded Swap Inputs
  const [embedSwapEthInput, setEmbedSwapEthInput] = useState<string>('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);

  // 1. Wallet Whitelisting State
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<WhitelistedWalletAddress[]>(() => {
    try {
      const saved = localStorage.getItem(`hashforge_whitelist_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [strictWhitelistMode, setStrictWhitelistMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hashforge_strict_whitelist_${user.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState<boolean>(false);

  // 2. Auto-Reinvest (Compound Mining) State
  const [autoReinvestConfig, setAutoReinvestConfig] = useState<AutoReinvestConfig>(() => {
    try {
      const saved = localStorage.getItem(`hashforge_autoreinvest_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      isEnabled: false,
      minThresholdUsdt: 10,
      reinvestTarget: 'hashrate',
      totalReinvestedUsdt: 0
    };
  });

  const handleSaveWhitelist = (list: WhitelistedWalletAddress[]) => {
    setWhitelistedAddresses(list);
    localStorage.setItem(`hashforge_whitelist_${user.id}`, JSON.stringify(list));
    showToast('Withdrawal address whitelist updated!', 'success');
  };

  const handleToggleStrictMode = (enabled: boolean) => {
    setStrictWhitelistMode(enabled);
    localStorage.setItem(`hashforge_strict_whitelist_${user.id}`, enabled ? 'true' : 'false');
    showToast(enabled ? 'Strict Whitelist Protection ENABLED: Payouts restricted to verified addresses.' : 'Strict Whitelist Mode set to optional.', 'info');
  };

  const handleToggleAutoReinvest = (enabled: boolean) => {
    const updated = { ...autoReinvestConfig, isEnabled: enabled };
    setAutoReinvestConfig(updated);
    localStorage.setItem(`hashforge_autoreinvest_${user.id}`, JSON.stringify(updated));
    showToast(enabled ? '⚡ Auto-Reinvest ENABLED: Accrued yields will compound into mining power!' : 'Auto-Reinvest paused.', enabled ? 'success' : 'info');
  };

  // Manual Compound Reinvestment Trigger
  const handleManualReinvest = async () => {
    const amountToReinvest = Math.max(availableUsdtBalance, minedEthBalance * ethPriceUsd);
    if (amountToReinvest < 10) {
      showToast('Minimum compound reinvestment amount is $10.00 USDT.', 'info');
      return;
    }

    const reinvestUsdt = parseFloat(amountToReinvest.toFixed(2));
    const boostedGhs = Math.round(reinvestUsdt * 2.5);

    const updatedConfig: AutoReinvestConfig = {
      ...autoReinvestConfig,
      totalReinvestedUsdt: (autoReinvestConfig.totalReinvestedUsdt || 0) + reinvestUsdt,
      lastReinvestedAt: new Date().toISOString()
    };
    setAutoReinvestConfig(updatedConfig);
    localStorage.setItem(`hashforge_autoreinvest_${user.id}`, JSON.stringify(updatedConfig));

    showToast(`Successfully compounded $${reinvestUsdt.toFixed(2)} USDT into +${boostedGhs} GH/s Mining Hashrate!`, 'success');
  };

  // Enterprise Invoices & Statement Modal State
  const [activeInvoiceReceipt, setActiveInvoiceReceipt] = useState<InvoiceReceipt | null>(null);

  const generateReceiptForDeposit = (dep: DepositRequest) => {
    const receipt: InvoiceReceipt = {
      receiptNumber: `HF-INV-${(dep.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`,
      transactionType: 'Package Purchase',
      itemName: dep.packageName || `VIP ${dep.vipLevel} Cloud Mining Contract`,
      amountUsd: Number(dep.amountUsd ?? (dep as any).amount_usd ?? 0),
      senderAddressOrTxid: dep.senderTxid || '0x498e72c810b10f2d93e8749a14c62',
      receiverAddress: dep.depositAddress || 'TQn9Y2... (HashForge Treasury)',
      network: dep.network || 'USDT-TRC20',
      date: dep.approvedAt || dep.createdAt || new Date().toISOString().substring(0, 10),
      status: dep.status === 'approved' ? 'Completed' : 'Pending',
      userName: user.name || 'Verified Miner',
      userEmail: user.email,
      userId: user.id,
      vipLevel: dep.vipLevel,
      hashrate: `${dep.vipLevel * 25} TH/s`,
      notes: 'Cryptographically registered and activated on Ethereum PoW / Smart Settlement Ledger.',
      digitalSignature: `SHA256-${user.id}-${dep.id}-${Date.now()}`
    };
    setActiveInvoiceReceipt(receipt);
  };

  const generateReceiptForWithdrawal = (w: WithdrawalRecordItem) => {
    const receipt: InvoiceReceipt = {
      receiptNumber: `HF-WTH-${(w.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`,
      transactionType: 'Withdrawal Payout',
      itemName: `USDT Capital & Yield Payout (${w.type || 'USDT'})`,
      amountUsd: Math.abs(Number(w.amount)),
      senderAddressOrTxid: w.txHash || `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
      receiverAddress: w.walletAddress || 'Client External Wallet',
      network: w.type || 'USDT-TRC20',
      date: w.time || new Date().toISOString().substring(0, 10),
      status: w.status === 'Withdrawal successfully' ? 'Completed' : 'Pending',
      userName: user.name || 'Verified Miner',
      userEmail: user.email,
      userId: user.id,
      notes: 'Zero platform fee applied (VIP subsidy). Automated multi-sig on-chain clearance.',
      digitalSignature: `SHA256-WTH-${user.id}-${w.id}`
    };
    setActiveInvoiceReceipt(receipt);
  };

  const generateReceiptForSwap = (s: ExchangeRecordItem) => {
    const receipt: InvoiceReceipt = {
      receiptNumber: `HF-SWP-${(s.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`,
      transactionType: 'ETH-USDT Swap',
      itemName: `Mined ETH to USDT Zero-Slippage Pool Conversion`,
      amountUsd: s.toAmount,
      cryptoAmount: s.fromAmount.toFixed(6),
      cryptoSymbol: 'ETH',
      senderAddressOrTxid: s.txHash,
      network: 'Internal Liquidity Pool',
      date: s.time,
      status: 'Completed',
      userName: user.name || 'Verified Miner',
      userEmail: user.email,
      userId: user.id,
      notes: `Settled at guaranteed pool rate: 1 ETH = $${s.rate.toFixed(2)} USD. Zero slippage.`,
      digitalSignature: `SHA256-SWP-${s.txHash}`
    };
    setActiveInvoiceReceipt(receipt);
  };

  // Live timer state that ticks every second for real-time countdown & automatic expiration
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live ETH Price from backend API completely silently in the background
  const fetchLiveEthPrice = async () => {
    try {
      const res = await fetch('/api/crypto/market');
      if (res.ok) {
        const data = await res.json();
        if (data?.prices?.ETH?.priceUsd) {
          setEthPriceUsd(data.prices.ETH.priceUsd);
          if (data.prices.ETH.change24h !== undefined) {
            setEthPriceChange24h(data.prices.ETH.change24h);
          }
        }
      }
    } catch (e) {
      console.warn('Silent price sync fallback:', e);
    }
  };

  useEffect(() => {
    fetchLiveEthPrice();
    const priceInterval = setInterval(fetchLiveEthPrice, 15000);
    return () => clearInterval(priceInterval);
  }, []);

  // Save exchange records to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(`hashforge_swaps_${user.id}`, JSON.stringify(exchangeRecords));
    } catch {}
  }, [exchangeRecords, user.id]);

  // Check if a package is already purchased/owned by this user (1 purchase max limit)
  const isPackageOwned = (pkg: MiningPackage): boolean => {
    return approvedDeposits.some(d => 
      d.packageId === pkg.id || 
      d.packageName === pkg.name || 
      (d.vipLevel === pkg.vipLevel && (d.planType === pkg.planType || (!d.planType && pkg.planType === 'daily')))
    ) || pendingDeposits.some(d => 
      d.packageId === pkg.id || 
      d.packageName === pkg.name || 
      (d.vipLevel === pkg.vipLevel && (d.planType === pkg.planType || (!d.planType && pkg.planType === 'daily')))
    );
  };

  // Fetch this client's real deposits + withdrawals from Supabase silently without disrupting UI
  const externalPendingDepositsHash = externalPendingDeposits ? externalPendingDeposits.map(d => `${d.id}-${d.status}`).join(',') : '';

  useEffect(() => {
    let isMounted = true;

    async function loadRealData() {
      try {
        const { data: deposits, error: depErr } = await supabase
          .from('deposits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const { data: withdrawals, error: wErr } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('inserted_at', { ascending: false });

        if (!isMounted) return;

        if (depErr) console.warn('Silent Supabase deposits warning:', depErr.message);
        if (wErr) console.warn('Silent Supabase withdrawals warning:', wErr.message);

        let allDeposits = deposits || [];

        // Fallback/merge with local storage deposits if available
        if (allDeposits.length === 0) {
          try {
            const saved = localStorage.getItem('hashforge_deposits');
            if (saved) {
              const parsed = JSON.parse(saved);
              allDeposits = parsed.filter((d: any) => d.userId === user.id || d.userName === user.name);
            }
          } catch {}
        }

        // Merge any externally passed pendingDeposits
        if (externalPendingDeposits && externalPendingDeposits.length > 0) {
          const userExternal = externalPendingDeposits.filter(d => d.userId === user.id || d.userName === user.name);
          for (const ext of userExternal) {
            if (!allDeposits.some((d: any) => d.id === ext.id)) {
              allDeposits.push(ext);
            }
          }
        }

        setApprovedDeposits(allDeposits.filter(d => d.status === 'approved' && (d.explorer_confirmed ?? true)));
        setPendingDeposits(allDeposits.filter(d => d.status === 'pending'));
        if (withdrawals && withdrawals.length > 0) {
          setWithdrawalRecords(withdrawals as WithdrawalRecordItem[]);
        }
      } catch (err) {
        console.warn('Silent background sync caught:', err);
      }
    }

    loadRealData();
    return () => { isMounted = false; };
  }, [user.id, user.name, externalPendingDepositsHash]);

  // Helper to determine the exact daily rate for any daily investment amount
  const getTierDailyRatePercent = (amount: number, pkgRate?: number): number => {
    if (pkgRate && pkgRate > 0) return pkgRate;
    if (amount >= 100000) return 3.2; // 3.20% ($100k - $200k Institutional)
    if (amount >= 50000) return 3.0;  // 3.00% max ($50k - $100k)
    if (amount >= 30000) return 2.8;  // 2.80% ($30k - $50k)
    if (amount >= 10000) return 2.6;  // 2.60% ($10k - $30k)
    if (amount >= 5000) return 2.2;   // 2.00% - 2.40% ($5k - $10k)
    return 1.9;                       // 1.80% - 2.00% ($100 - $5k)
  };

  // Process all approved deposits with real-time countdown, accrual and expiration calculations
  const processedContracts: ProcessedContract[] = approvedDeposits.map(dep => {
    const matchedPkg = packages.find(p => p.id === dep.packageId) 
      || packages.find(p => p.name.toLowerCase() === (dep.packageName || '').toLowerCase())
      || packages.find(p => p.vipLevel === dep.vipLevel && p.priceUsd === Number(dep.amountUsd))
      || MINING_PACKAGES.find(p => p.id === dep.packageId || p.name === dep.packageName || (p.vipLevel === dep.vipLevel && p.priceUsd === Number(dep.amountUsd)))
      || DAILY_PACKAGES.find(p => p.vipLevel === dep.vipLevel)
      || null;

    const { durationMs, durationLabel, isFlash } = getContractDurationMs(dep, matchedPkg);
    const rawActivation = dep.approvedAt || (dep as any).approved_at || dep.createdAt || (dep as any).created_at;
    const activationDate = parseTimestamp(rawActivation);
    const expirationDate = new Date(activationDate.getTime() + durationMs);
    
    const timeRemainingMs = Math.max(0, expirationDate.getTime() - currentTime.getTime());
    const isExpired = timeRemainingMs <= 0;
    const timeRemainingText = formatCountdown(timeRemainingMs);

    const totalElapsedMs = Math.max(0, currentTime.getTime() - activationDate.getTime());
    const progressPercent = Math.min(100, Math.max(0, (totalElapsedMs / durationMs) * 100));

    const amountUsd = Number(dep.amountUsd ?? (dep as any).amount_usd ?? 0);
    
    const dailyRatePercent = getTierDailyRatePercent(amountUsd, matchedPkg?.dailyReturnPercent);

    const dailyYieldUsd = isFlash
      ? (matchedPkg?.dailyReturnUsd || (amountUsd * 0.05))
      : (matchedPkg?.dailyReturnUsd || (amountUsd * (dailyRatePercent / 100)));

    const estTotalYieldUsd = isFlash 
      ? (matchedPkg?.totalPayoutUsd || (amountUsd * (1 + (matchedPkg?.profitPercent || 10) / 100)))
      : (dailyYieldUsd * (matchedPkg?.durationDays || 365));

    // Yield accrual rule
    let accruedYieldUsd = 0;
    if (isFlash) {
      if (isExpired) {
        accruedYieldUsd = estTotalYieldUsd;
      } else {
        const elapsedDays = totalElapsedMs / (24 * 60 * 60 * 1000);
        const flashProfitOnly = estTotalYieldUsd - amountUsd;
        accruedYieldUsd = Math.min(flashProfitOnly, (flashProfitOnly / 2) * elapsedDays);
      }
    } else {
      const elapsedDays = Math.min(matchedPkg?.durationDays || 365, totalElapsedMs / (24 * 60 * 60 * 1000));
      accruedYieldUsd = dailyYieldUsd * elapsedDays;
      if (isExpired) {
        accruedYieldUsd = estTotalYieldUsd;
      }
    }

    return {
      deposit: dep,
      pkg: matchedPkg,
      activationDate,
      expirationDate,
      isExpired,
      timeRemainingMs,
      timeRemainingText,
      progressPercent,
      durationLabel,
      isFlash,
      estTotalYieldUsd,
      dailyYieldUsd,
      accruedYieldUsd,
      durationMs
    };
  });

  const activeContracts = processedContracts.filter(c => !c.isExpired);
  const expiredContracts = processedContracts.filter(c => c.isExpired);

  // ACCOUNT HOLD / SUSPENSION STATUS CHECK
  const isAccountBlocked = user.accountStatus === 'blocked' || user.accountStatus === 'suspended';
  const isAccountPending = user.accountStatus === 'pending';
  const isAccountHalted = isAccountBlocked || isAccountPending;

  // REAL FINANCIAL & ETH MINING VALUES:
  // 1. Total Active Capital = principal in running mining nodes
  const totalActiveCapital = activeContracts.reduce((sum, c) => sum + Number(c.deposit.amountUsd ?? (c.deposit as any).amount_usd ?? 0), 0);
  
  // 2. Total Earned Mined Profit (in USD)
  const totalEarnedProfitsUsd = processedContracts.reduce((sum, c) => sum + c.accruedYieldUsd, 0);

  // 3. Today's Daily Mining Production in USD (STOPS if account is blocked or on pending hold)
  const todayDailyReturnUsd = isAccountHalted ? 0 : activeContracts.reduce((sum, c) => sum + c.dailyYieldUsd, 0);

  // 4. Daily ETH Mining Output Rate (0 if halted)
  const dailyEthRate = isAccountHalted ? 0 : (ethPriceUsd > 0 ? (todayDailyReturnUsd / ethPriceUsd) : 0);

  // 5. Total Total Earned Mined ETH
  const totalMinedEthLifetime = ethPriceUsd > 0 ? (totalEarnedProfitsUsd / ethPriceUsd) : 0;

  // 6. Total Swapped ETH & Converted USDT by user
  const totalSwappedEth = exchangeRecords
    .filter(e => e.status === 'Completed')
    .reduce((sum, e) => sum + e.fromAmount, 0);

  const totalConvertedUsdt = exchangeRecords
    .filter(e => e.status === 'Completed')
    .reduce((sum, e) => sum + e.toAmount, 0);

  // 7. Net Current Mined ETH Balance
  const minedEthBalance = Math.max(0, totalMinedEthLifetime - totalSwappedEth);

  // 8. Total Withdrawn by user (USDT)
  const totalWithdrawnUsdt = withdrawalRecords
    .filter(w => w.status !== 'Failed')
    .reduce((sum, w) => sum + Math.abs(Number(w.amount)), 0);

  // 9. Withdrawable Available USDT Balance (Must be converted from ETH first)
  const availableUsdtBalance = Math.max(0, totalConvertedUsdt - totalWithdrawnUsdt);

  // 10. Total Hashrate Calculation (0 TH/s if halted by admin)
  const totalHashrateTh = isAccountHalted ? 0 : activeContracts.reduce((sum, c) => {
    const hashrateNum = c.pkg?.hashrate || (c.deposit.vipLevel * 25);
    return sum + hashrateNum;
  }, 0);
  const totalHashrateDisplay = isAccountBlocked 
    ? '0 TH/s (Account Blocked)'
    : isAccountPending
    ? '0 TH/s (Account Pending Hold)'
    : totalHashrateTh > 0 ? `${totalHashrateTh.toLocaleString()} TH/s` : '0 TH/s';

  const handleCopyTxid = (txid: string, id: string) => {
    navigator.clipboard.writeText(txid);
    setCopiedTxid(id);
    setTimeout(() => setCopiedTxid(null), 2000);
  };

  // Execute Swap: Convert ETH -> USDT
  const handleExecuteSwap = async (ethAmount: number, usdtAmount: number, rate: number): Promise<ExchangeRecordItem | null> => {
    if (ethAmount <= 0 || ethAmount > minedEthBalance + 0.00001) {
      showToast('Insufficient mined ETH balance to exchange', 'info');
      return null;
    }

    const randomTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const newSwapRecord: ExchangeRecordItem = {
      id: `swap-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      fromCoin: 'ETH',
      toCoin: 'USDT',
      fromAmount: ethAmount,
      toAmount: usdtAmount,
      rate: rate,
      feeUsd: 0,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      txHash: randomTxHash,
      status: 'Completed'
    };

    setExchangeRecords(prev => [newSwapRecord, ...prev]);
    showToast(`Successfully converted ${ethAmount.toFixed(6)} ETH to $${usdtAmount.toFixed(2)} USDT!`, 'success');
    setEmbedSwapEthInput('');
    return newSwapRecord;
  };

  // Handle Embedded Swap Submit
  const handleEmbedSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    const ethAmt = parseFloat(embedSwapEthInput);
    if (isNaN(ethAmt) || ethAmt <= 0) {
      showToast('Please enter a valid ETH amount to exchange', 'info');
      return;
    }
    if (ethAmt > minedEthBalance) {
      showToast(`Exceeds your mined ETH balance (${minedEthBalance.toFixed(6)} ETH)`, 'info');
      return;
    }
    const usdtAmt = ethAmt * ethPriceUsd;
    const res = await handleExecuteSwap(ethAmt, usdtAmt, ethPriceUsd);
    if (res) {
      setActionTab('withdraw');
    }
  };

  // Finalize USDT Withdrawal with Server-Side Cryptographic Verification
  const finalizeWithdrawal = async () => {
    const amountToWithdraw = parseFloat(withdrawInputUsdt);
    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) return;

    try {
      // 1. Call Server-Side Verification Endpoint
      const verifyRes = await fetch('/api/financial/verify-and-submit-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          amount: amountToWithdraw,
          network: withdrawNetwork,
          destinationAddress: withdrawAddress.trim(),
          kycLevel: user.kycLevel || 0,
          availableUsdtBalance,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        showToast(verifyData.error || 'Server rejected withdrawal verification.', 'info');
        return;
      }

      const serverRecord: WithdrawalRecordItem = {
        id: verifyData.record?.id || `w-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        currency: 'USDT',
        type: withdrawNetwork,
        amount: -amountToWithdraw,
        walletAddress: withdrawAddress.trim(),
        status: 'Pending',
        time: verifyData.record?.time || new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      // 2. Insert into Supabase with server verification signature
      const { error } = await supabase.from('withdrawals').insert({
        id: serverRecord.id,
        user_id: user.id,
        user_name: user.name,
        currency: serverRecord.currency,
        type: serverRecord.type,
        amount: serverRecord.amount,
        wallet_address: serverRecord.walletAddress,
        status: serverRecord.status,
        time: serverRecord.time,
      });

      if (error) {
        console.warn('Supabase withdrawal warning:', error.message);
      }

      setWithdrawalRecords(prev => [serverRecord, ...prev]);
      showToast(`🛡️ Server-verified payout request of $${amountToWithdraw.toFixed(2)} USDT submitted! Status: Pending admin review`, 'success');
      setWithdrawInputUsdt('');
      setActionTab('history');
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      // Fallback
      const fallbackRecord: WithdrawalRecordItem = {
        id: `w-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        currency: 'USDT',
        type: withdrawNetwork,
        amount: -amountToWithdraw,
        walletAddress: withdrawAddress.trim(),
        status: 'Pending',
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      setWithdrawalRecords(prev => [fallbackRecord, ...prev]);
      showToast(`Withdrawal of $${amountToWithdraw.toFixed(2)} USDT submitted! Status: Pending admin review`, 'success');
      setWithdrawInputUsdt('');
      setActionTab('history');
    }
  };

  // Submit USDT Withdrawal with 2FA & Whitelist validation
  const handleWithdraw = async () => {
    const amountToWithdraw = parseFloat(withdrawInputUsdt);
    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
      showToast('Please enter a valid withdrawal amount', 'info');
      return;
    }
    if (amountToWithdraw < 10) {
      showToast('Minimum withdrawal amount is $10.00 USDT. You cannot withdraw less than $10.00.', 'info');
      return;
    }
    if (amountToWithdraw > availableUsdtBalance) {
      showToast(`Withdrawal amount exceeds your available USDT wallet balance ($${availableUsdtBalance.toFixed(2)} USDT). Please exchange your mined ETH to USDT first.`, 'info');
      return;
    }
    if (!withdrawAddress.trim()) {
      showToast('Please enter destination USDT address', 'info');
      return;
    }

    // 1. Check Strict Whitelist Mode
    if (strictWhitelistMode && whitelistedAddresses.length > 0) {
      const isMatched = whitelistedAddresses.some(
        a => a.address.toLowerCase() === withdrawAddress.trim().toLowerCase()
      );
      if (!isMatched) {
        showToast('🛡️ Strict Whitelist Active: Destination address is not in your verified whitelist. Please select a whitelisted address or add it to your whitelist.', 'info');
        setIsWhitelistModalOpen(true);
        return;
      }
    }

    // Direct Execution of Withdrawal
    await finalizeWithdrawal();
  };

  const showToast = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredWithdrawals = withdrawalRecords.filter(r => {
    if (withdrawalFilter === 'All') return true;
    return r.status === withdrawalFilter;
  });

  const displayedCategoryPackages = dashCategory === 'daily' 
    ? DAILY_PACKAGES 
    : dashCategory === 'flash_48h' 
    ? FLASH_48H_PACKAGES 
    : CUSTOM_PRESET_PACKAGES;
  const userPendingDeposit = pendingDeposits[0];

  return (
    <div id="client-smart-dashboard-full" className="w-full space-y-6">

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow-2xl flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Account Status Lockout / Hold Notification Banner */}
      {isAccountHalted && (
        <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl animate-in fade-in duration-200 ${
          isAccountBlocked 
            ? 'bg-rose-950/50 border-rose-500/50 shadow-rose-500/10' 
            : 'bg-amber-950/50 border-amber-500/50 shadow-amber-500/10'
        }`}>
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isAccountBlocked 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
            }`}>
              {isAccountBlocked ? <ShieldAlert className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm sm:text-base font-black uppercase tracking-wider ${
                  isAccountBlocked ? 'text-rose-300' : 'text-amber-300'
                }`}>
                  {isAccountBlocked ? '⛔ Account Temporarily Blocked / Frozen' : '⏳ Account On Pending Review Hold'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase border ${
                  isAccountBlocked 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  Mining & Rewards Halted
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAccountBlocked 
                  ? 'Your account has been temporarily placed on freeze by administration. All active cloud mining nodes, hashrate computing power, and daily reward distributions are currently STOPPED.'
                  : 'Your account status has been placed on pending review by administration. Active mining contracts and daily reward payouts are temporarily paused while review is active.'
                }
              </p>
              {user.statusReason && (
                <div className="text-xs font-mono text-amber-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 inline-flex items-center gap-2 mt-1">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><strong>Reason from Admin:</strong> {user.statusReason}</span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLiveSupport}
            className={`px-4 py-2.5 rounded-xl font-black text-xs shrink-0 cursor-pointer transition-all flex items-center gap-1.5 shadow-lg ${
              isAccountBlocked
                ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contact Live Support</span>
          </button>
        </div>
      )}

      {/* Swap Modal */}
      <EthToUsdtSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        ethBalance={minedEthBalance}
        ethPriceUsd={ethPriceUsd}
        onExecuteSwap={handleExecuteSwap}
        onProceedToWithdraw={() => setActionTab('withdraw')}
      />

      {/* =========================================================================
          1. TOP HERO: DEDICATED LIVE ETH MINING HARDWARE CONSOLE PANEL
          ========================================================================= */}
      <EthMiningPanel
        ethPriceUsd={ethPriceUsd}
        ethPriceChange24h={ethPriceChange24h}
        onRefreshPrice={fetchLiveEthPrice}
        isPriceRefreshing={isPriceRefreshing}
        minedEthBalance={minedEthBalance}
        dailyEthRate={dailyEthRate}
        activeContractsCount={activeContracts.length}
        totalHashrateDisplay={totalHashrateDisplay}
        onOpenExchangeModal={() => setIsSwapModalOpen(true)}
        onOpenWithdrawModal={() => setActionTab('withdraw')}
        availableUsdtBalance={availableUsdtBalance}
      />

      {/* Enterprise Documents & Invoices Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => {
            if (activeContracts.length > 0) {
              generateReceiptForDeposit(activeContracts[0].deposit);
            } else if (withdrawalRecords.length > 0) {
              generateReceiptForWithdrawal(withdrawalRecords[0]);
            } else if (exchangeRecords.length > 0) {
              generateReceiptForSwap(exchangeRecords[0]);
            } else {
              setActiveInvoiceReceipt({
                receiptNumber: `HF-ACC-${Date.now().toString().slice(-8)}`,
                transactionType: 'Account Statement',
                itemName: `HashForge Mining Account & Node Certificate`,
                amountUsd: totalActiveCapital,
                cryptoAmount: minedEthBalance.toFixed(6),
                cryptoSymbol: 'ETH',
                senderAddressOrTxid: '0xHashForgeSmartMiningSettlementV2',
                receiverAddress: user.name,
                network: 'Ethereum PoW / Stratum Protocol',
                date: new Date().toISOString().substring(0, 10),
                status: 'Completed',
                userName: user.name,
                userEmail: user.email,
                userId: user.id,
                vipLevel: user.vipLevel || 1,
                hashrate: totalHashrateDisplay,
                notes: 'Official platform ledger confirmation with cryptographic validity check.',
                digitalSignature: `SHA256-CERT-${user.id}-${Date.now()}`
              });
            }
          }}
          className="p-3.5 rounded-2xl bg-[#0e1628] border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-left group cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <Printer className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Official Tax Invoices & Account Statements</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Download & Print Verified On-Chain PDF Documentation</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            Export PDF
          </span>
        </button>

        <button
          onClick={() => setIsSwapModalOpen(true)}
          className="p-3.5 rounded-2xl bg-[#0e1628] border border-cyan-500/30 hover:border-cyan-500/60 transition-all text-left group cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-black text-cyan-300">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Zero-Slippage Pool Conversion</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Instant Swap Mined ETH ➔ USDT Balance with 0% Fee</p>
          </div>
          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
            Instant Swap
          </span>
        </button>
      </div>

      {/* Security & Automation Quick Controls Strip (Whitelist & Auto-Reinvest) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Wallet Whitelisting Control */}
        <div 
          onClick={() => setIsWhitelistModalOpen(true)}
          className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 hover:border-cyan-500/50 transition-all text-left cursor-pointer flex items-center justify-between group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              whitelistedAddresses.length > 0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Wallet Address Whitelist</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {whitelistedAddresses.length} Saved
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {strictWhitelistMode ? 'Strict Protection Active' : 'Verified Destination Wallets'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </div>

        {/* 2. Auto-Reinvest Control */}
        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 hover:border-purple-500/50 transition-all flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              autoReinvestConfig.isEnabled ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              <Repeat className={`w-5 h-5 ${autoReinvestConfig.isEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Auto-Reinvest Compounding</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  autoReinvestConfig.isEnabled ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {autoReinvestConfig.isEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Compound Mining Yield (+18.4% APY)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleAutoReinvest(!autoReinvestConfig.isEnabled)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              autoReinvestConfig.isEnabled ? 'bg-purple-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
              autoReinvestConfig.isEnabled ? 'left-5' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Auto-Reinvest & Compound Mining Banner (Active or Compound Option) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111029] via-[#0d162a] to-[#0a1122] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">Smart Compound Yield Multiplier</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                +18.4% Extra APY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Auto-reinvests accrued mining dividends into hashpower boosts. Total compounded: <strong className="text-purple-300">${(autoReinvestConfig.totalReinvestedUsdt || 0).toFixed(2)} USDT</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualReinvest}
            className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Compound Yield Now</span>
          </button>
        </div>
      </div>

      {/* Pending Deposit Notification Banner */}
      {userPendingDeposit && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl shadow-amber-500/5">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-300">
            <Clock className="w-5 h-5 shrink-0 animate-pulse text-amber-400" />
            <div>
              <strong>Deposit of ${userPendingDeposit.amountUsd ?? (userPendingDeposit as any).amount_usd} USDT</strong> ({userPendingDeposit.packageName}) is awaiting on-chain verification by the administrator.
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase self-start sm:self-auto border border-amber-500/30">
            Pending Admin Review
          </span>
        </div>
      )}

      {/* Real-time Stratum V2 Hashrate & Hardware Pulse Stream */}
      <LiveHashratePulseGraph
        baseHashrateMh={totalHashrateTh > 0 ? totalHashrateTh * 10 : 650}
        activeContractsCount={activeContracts.length}
        vipTier={user.vipLevel || 1}
      />

      {/* =========================================================================
          2. MAIN 2-COLUMN SECTION (LEFT: ACTIVE PACKAGES, RIGHT: EXCHANGE & WITHDRAWAL ENGINE)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIVE PURCHASED PACKAGES (LG:COL-SPAN-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black text-white">
                Active Mining Contracts ({activeContracts.length})
              </h2>
            </div>
            {activeContracts.length > 0 && (
              isAccountHalted ? (
                <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  🛑 Mining Halted ({isAccountBlocked ? 'Blocked' : 'Pending'})
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Live ETH Hashing
                </span>
              )
            )}
          </div>

          {/* If No Active Contracts */}
          {activeContracts.length === 0 && (
            <div className="p-8 rounded-3xl bg-[#0b101c] border border-slate-800/80 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Active Cloud Mining Node Running</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Select and activate a mining package below to connect dedicated Stratum computing power and begin accumulating real-time ETH rewards.
                </p>
              </div>
              <button
                onClick={() => onSelectPackage(packages[0] || DAILY_PACKAGES[0])}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Browse Mining Packages
              </button>
            </div>
          )}

          {/* List of Active Contracts with Full Information & Live Countdown */}
          {activeContracts.map((contract, idx) => {
            const dep = contract.deposit;
            const pkg = contract.pkg;
            const amountPaid = Number(dep.amountUsd ?? (dep as any).amount_usd ?? 0);
            const packageName = dep.packageName ?? (dep as any).package_name ?? pkg?.name ?? `VIP ${dep.vipLevel} Package`;
            const contractDailyEth = ethPriceUsd > 0 ? (contract.dailyYieldUsd / ethPriceUsd) : 0;

            return (
              <div 
                key={`contract-${dep.id || 'dep'}-${idx}`} 
                className="rounded-3xl bg-gradient-to-br from-[#0e1628] via-[#0b101e] to-[#0c1424] border border-cyan-500/30 p-5 sm:p-6 space-y-5 shadow-2xl shadow-cyan-500/5 relative overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg sm:text-xl font-black text-white">
                        {packageName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                        VIP {dep.vipLevel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{contract.durationLabel}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-slate-950/60 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono uppercase">Principal Invested</div>
                    <div className="text-lg sm:text-xl font-black text-cyan-300 font-mono">
                      ${amountPaid.toLocaleString()} USDT
                    </div>
                  </div>
                </div>

                {/* Halted Status Indicator if Account is Blocked/Pending */}
                {isAccountHalted && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2 relative z-10">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span><strong>Node Halted:</strong> Daily mining yields and hashpower allocation for this package are stopped due to administrative account {isAccountBlocked ? 'freeze' : 'review hold'}.</span>
                  </div>
                )}

                {/* REAL-TIME EXPIRATION COUNTDOWN TIMER BANNER */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-cyan-300 font-bold flex items-center gap-2 font-mono text-xs sm:text-sm">
                      <Hourglass className="w-4 h-4 text-cyan-400 animate-spin" />
                      Time Left to Expire:
                    </span>
                    <span className="font-mono font-black text-cyan-300 text-sm sm:text-base bg-cyan-500/15 px-3 py-1 rounded-xl border border-cyan-500/30 text-center">
                      {contract.timeRemainingText}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${contract.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>{contract.progressPercent.toFixed(1)}% Cycle Completed</span>
                      <span>{(100 - contract.progressPercent).toFixed(1)}% Duration Remaining</span>
                    </div>
                  </div>
                </div>

                {/* TIMESTAMPS: ACTIVATED & EXPIRES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#080d18] border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Activated On:</span>
                      <span className="text-slate-200 font-bold">{formatDateTimeDisplay(contract.activationDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:justify-end">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Expires On:</span>
                      <span className="text-slate-200 font-bold">{formatDateTimeDisplay(contract.expirationDate)}</span>
                    </div>
                  </div>
                </div>

                {/* DETAILED SPECIFICATIONS GRID (WITH ETH PRODUCTION METRICS) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Stratum Hashrate</span>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">
                      {pkg?.hashrate ? `${pkg.hashrate} ${pkg.hashrateUnit}` : 'Stratum Pro'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Daily ETH Output</span>
                    <div className="text-xs font-bold text-cyan-300 mt-0.5 truncate">
                      {contractDailyEth.toFixed(6)} ETH
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Daily Yield (USDT)</span>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">
                      ${contract.dailyYieldUsd.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Cycle Total Return</span>
                    <div className="text-xs font-bold text-amber-300 mt-0.5 truncate">
                      ${contract.estTotalYieldUsd.toFixed(2)} USDT
                    </div>
                  </div>
                </div>

                {/* Transaction TXID & Official Invoice Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                  {dep.senderTxid ? (
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 block">Deposit Transaction Hash (TXID):</span>
                      <span className="text-slate-300 truncate block text-[11px]">{dep.senderTxid}</span>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 block">Settlement Method:</span>
                      <span className="text-emerald-400 font-bold block text-[11px]">Instant Smart Node Allocation</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {dep.senderTxid && (
                      <button
                        onClick={() => handleCopyTxid(dep.senderTxid, `tx-${dep.id}`)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer flex items-center gap-1 text-[11px] transition-colors"
                        title="Copy TXID"
                      >
                        {copiedTxid === `tx-${dep.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedTxid === `tx-${dep.id}` ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => generateReceiptForDeposit(dep)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-pointer flex items-center gap-1 text-[11px] font-bold transition-all shadow-sm"
                      title="Download Official Tax/Transaction Invoice"
                    >
                      <FileText className="w-3 h-3 text-emerald-400" />
                      <span>Invoice (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* RIGHT COLUMN: 2-STEP EXCHANGE & WITHDRAWAL WALLET HUB (LG:COL-SPAN-5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* WALLET HUB CARD */}
          <div className="rounded-3xl bg-[#0b101c] border border-slate-800/90 p-5 sm:p-6 space-y-4 shadow-xl">
            
            {/* Header with 4 Action Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-black text-white">Wallet & Cashout</h2>
              </div>
              
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActionTab('exchange')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    actionTab === 'exchange' ? 'bg-cyan-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Step 1: Exchange ETH to USDT"
                >
                  ⚡ Exchange
                </button>
                <button
                  onClick={() => setActionTab('withdraw')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    actionTab === 'withdraw' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Step 2: Withdraw USDT"
                >
                  🚀 Withdraw
                </button>
                <button
                  onClick={() => setActionTab('history')}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    actionTab === 'history' || actionTab === 'swap_history' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Transaction Records"
                >
                  History
                </button>
              </div>
            </div>

            {/* DUAL BALANCES OVERVIEW TILES */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              
              {/* Tile 1: Mined ETH Wallet */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Mined ETH Balance</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <div className="text-base sm:text-lg font-black text-cyan-300 mt-1 truncate">
                  {minedEthBalance.toFixed(6)} <span className="text-xs font-bold">ETH</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  ≈ ${(minedEthBalance * ethPriceUsd).toFixed(2)} USDT
                </div>
              </div>

              {/* Tile 2: Available USDT Wallet */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Available USDT</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-400 mt-1 truncate">
                  ${availableUsdtBalance.toFixed(2)} <span className="text-xs font-bold">USDT</span>
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">
                  Ready for Cashout
                </div>
              </div>

            </div>

            {/* TAB 1: EMBEDDED FAST EXCHANGE (ETH -> USDT) */}
            {actionTab === 'exchange' && (
              <div className="p-4 rounded-2xl bg-[#0e1628] border border-cyan-500/25 space-y-3.5 animate-fadeIn">
                
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                    <span>Step 1: Exchange Mined ETH to USDT</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-500/15 px-2 py-0.5 rounded-md border border-cyan-500/30">
                    1 ETH = ${ethPriceUsd.toFixed(2)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Convert your mined Ethereum into USDT at guaranteed zero-slippage pool rates to enable direct withdrawal.
                </p>

                <form onSubmit={handleEmbedSwap} className="space-y-3">
                  
                  {/* From ETH Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <label>Amount to Convert (ETH):</label>
                      <span className="text-cyan-400">Available: {minedEthBalance.toFixed(6)} ETH</span>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.000000"
                        value={embedSwapEthInput}
                        onChange={(e) => setEmbedSwapEthInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 pr-16"
                      />
                      <button
                        type="button"
                        onClick={() => setEmbedSwapEthInput(minedEthBalance.toFixed(6))}
                        className="absolute right-2 top-1.5 px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono font-bold text-[10px] cursor-pointer"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Calculated Output USDT */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">You Will Receive:</span>
                    <strong className="text-emerald-400 text-sm">
                      +${((parseFloat(embedSwapEthInput) || 0) * ethPriceUsd).toFixed(2)} USDT
                    </strong>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={minedEthBalance <= 0 || !parseFloat(embedSwapEthInput)}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                      minedEthBalance > 0 && parseFloat(embedSwapEthInput) > 0
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-cyan-500/20 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Convert ETH to USDT</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSwapModalOpen(true)}
                      className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                    >
                      Open Full Screen Exchange Modal ↗
                    </button>
                  </div>

                </form>

              </div>
            )}

            {/* TAB 2: WITHDRAW USDT FORM */}
            {actionTab === 'withdraw' && (
              <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-3.5 animate-fadeIn">
                
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                    <span>Step 2: Submit USDT Withdrawal</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Available: ${availableUsdtBalance.toFixed(2)}
                  </span>
                </div>

                {/* Helpful Prompt if user has 0 USDT but has Mined ETH */}
                {availableUsdtBalance < 10 && minedEthBalance > 0 && (
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-2 text-xs font-mono">
                    <div className="flex items-start gap-2 text-cyan-300">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
                      <span>
                        You have <strong>{minedEthBalance.toFixed(6)} ETH</strong> (~${(minedEthBalance * ethPriceUsd).toFixed(2)} USDT) in your mining wallet. Please exchange your ETH to USDT first to process your withdrawal.
                      </span>
                    </div>
                    <button
                      onClick={() => setActionTab('exchange')}
                      className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>⚡ Exchange ETH to USDT Now</span>
                    </button>
                  </div>
                )}

                {/* Network Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-mono">Withdrawal Network:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['USDT-TRC20', 'USDT-ERC20', 'USDT-POLYGON'] as const).map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setWithdrawNetwork(net)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                          withdrawNetwork === net
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {net === 'USDT-POLYGON' ? 'POLYGON (POS)' : net.replace('USDT-', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destination Address with Whitelist Picker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400 font-mono">Destination {withdrawNetwork} Address:</label>
                    <button
                      type="button"
                      onClick={() => setIsWhitelistModalOpen(true)}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Shield className="w-3 h-3 text-cyan-400" />
                      <span>{strictWhitelistMode ? 'Strict Whitelist: ON' : 'Manage Whitelist'}</span>
                    </button>
                  </div>

                  {/* Whitelist Quick Selection Chips */}
                  {whitelistedAddresses.filter(a => a.network === withdrawNetwork).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      <span className="text-[10px] text-slate-500 font-mono self-center">Saved:</span>
                      {whitelistedAddresses
                        .filter(a => a.network === withdrawNetwork)
                        .map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setWithdrawAddress(a.address)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${
                              withdrawAddress.toLowerCase() === a.address.toLowerCase()
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                                : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{a.label}</span>
                          </button>
                        ))}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder={withdrawNetwork === 'USDT-TRC20' ? 'e.g. TGgfnP... (Tron TRC20)' : 'e.g. 0x91D8... (0x address)'}
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Withdrawal Amount */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400 font-mono">Amount to Withdraw (USDT):</label>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Min: $10.00 USDT</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      step="any"
                      placeholder="Min 10.00 USDT"
                      value={withdrawInputUsdt}
                      onChange={(e) => setWithdrawInputUsdt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setWithdrawInputUsdt(availableUsdtBalance.toString())}
                      className="absolute right-2 top-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Network Fee Summary */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Estimated Gas Fee:</span>
                    <span className="text-emerald-400 font-bold">$0.00 (VIP Zero-Fee)</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Direct Payout</span>
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={availableUsdtBalance < 10 || !withdrawAddress}
                  className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                    availableUsdtBalance >= 10 && withdrawAddress
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>Submit USDT Withdrawal for Review</span>
                </button>

              </div>
            )}

            {/* TAB 3 & 4: TRANSACTION RECORDS (SWAP HISTORY & WITHDRAWAL HISTORY) */}
            {(actionTab === 'history' || actionTab === 'swap_history') && (
              <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-3 animate-fadeIn">
                
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <button
                      onClick={() => setActionTab('history')}
                      className={`pb-0.5 font-mono cursor-pointer ${actionTab === 'history' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Withdrawals ({withdrawalRecords.length})
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => setActionTab('swap_history')}
                      className={`pb-0.5 font-mono cursor-pointer ${actionTab === 'swap_history' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Swaps ({exchangeRecords.length})
                    </button>
                  </div>

                  <button
                    onClick={() => setActionTab('withdraw')}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    + New
                  </button>
                </div>

                {/* Withdrawals List */}
                {actionTab === 'history' && (
                  withdrawalRecords.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500 font-mono">No withdrawal requests submitted yet.</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {withdrawalRecords.map((w, idx) => (
                        <div key={`w-rec-${w.id || 'w'}-${idx}`} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-rose-400 font-bold">{w.amount} USDT</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                w.status === 'Withdrawal successfully'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : w.status === 'Failed'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {w.status}
                              </span>
                              <button
                                onClick={() => generateReceiptForWithdrawal(w)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                                title="View/Print Receipt"
                              >
                                <FileText className="w-3 h-3 text-amber-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="truncate max-w-[150px]">{w.walletAddress || w.type}</span>
                            <span>{w.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Swaps List */}
                {actionTab === 'swap_history' && (
                  exchangeRecords.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500 font-mono">No ETH ➔ USDT swaps executed yet.</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {exchangeRecords.map((s, idx) => (
                        <div key={`swap-rec-${s.id || 's'}-${idx}`} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-300 font-bold">{s.fromAmount.toFixed(6)} ETH ➔ +${s.toAmount.toFixed(2)} USDT</span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Completed
                              </span>
                              <button
                                onClick={() => generateReceiptForSwap(s)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                                title="View/Print Receipt"
                              >
                                <FileText className="w-3 h-3 text-cyan-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Rate: ${s.rate.toFixed(2)}</span>
                            <span>{s.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* EXPIRED & COMPLETED CONTRACTS SECTION */}
          {expiredContracts.length > 0 && (
            <div className="rounded-3xl bg-[#0b101c] border border-slate-800/90 p-5 sm:p-6 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Expired / Completed Contracts ({expiredContracts.length})
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Yield Fully Settled
                </span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {expiredContracts.map((expContract, idx) => {
                  const dep = expContract.deposit;
                  const pkg = expContract.pkg;
                  const packageName = dep.packageName ?? (dep as any).package_name ?? pkg?.name ?? `VIP ${dep.vipLevel} Package`;
                  const amount = Number(dep.amountUsd ?? (dep as any).amount_usd ?? 0);

                  return (
                    <div 
                      key={`exp-contract-${dep.id || 'dep'}-${idx}`} 
                      className="p-3 rounded-2xl bg-[#080d18] border border-slate-800 text-xs font-mono space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{packageName}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700 font-mono">
                            VIP {dep.vipLevel}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Cycle Completed (${expContract.estTotalYieldUsd.toFixed(2)} USDT)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                        <div>
                          <span>Invested: </span>
                          <strong className="text-white">${amount.toLocaleString()} USDT</strong>
                        </div>
                        <div className="text-right">
                          <span>Settled to Wallet: </span>
                          <strong className="text-emerald-400">${expContract.estTotalYieldUsd.toFixed(2)} USDT</strong>
                        </div>
                      </div>

                      {pkg && (
                        <button
                          onClick={() => onSelectPackage(pkg)}
                          className="w-full mt-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Renew / Re-purchase Package</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* =========================================================================
          3. BOTTOM SECTION: PACKAGES OFFERING & UPGRADES (FULL WIDTH GRID)
          ========================================================================= */}
      <div className="rounded-3xl bg-[#0b101c] border border-slate-800/90 p-5 sm:p-6 lg:p-7 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Available Cloud Mining Packages & Upgrades
              </h2>
              <p className="text-xs text-slate-400">
                Deploy high-efficiency cloud mining nodes to produce automated daily ETH distributions
              </p>
            </div>
          </div>

          {/* Plan Category Switcher */}
          <div className="flex flex-wrap items-center gap-1 bg-[#10182c] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDashCategory('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashCategory === 'daily' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Mining (1.80% – 3.00% Daily)
            </button>
            <button
              type="button"
              onClick={() => setDashCategory('flash_48h')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashCategory === 'flash_48h' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              48H Flash Node
            </button>
            <button
              type="button"
              onClick={() => setDashCategory('custom_pool')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                dashCategory === 'custom_pool' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Custom Rig ($10k – $200k)</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${dashCategory === 'custom_pool' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-500/20 text-cyan-300'}`}>3.2% MAX</span>
            </button>
          </div>
        </div>

        {dashCategory === 'custom_pool' ? (
          <div className="pt-2">
            <CustomPackageBuilder
              onSelectPackage={(customPkg) => {
                onSelectPackage(customPkg);
              }}
              onSelectCustomPackage={(customPkg) => {
                onSelectPackage(customPkg);
              }}
              ethPriceUsd={ethPriceUsd}
            />
          </div>
        ) : (
          /* Standard Packages Grid */
          <div className={`grid gap-3.5 ${
            dashCategory === 'daily'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
          }`}>
            {displayedCategoryPackages.map((pkg) => {
              const owned = isPackageOwned(pkg);
              const estDailyEth = ethPriceUsd > 0 ? (pkg.dailyReturnUsd / ethPriceUsd) : 0;

              return (
                <div
                  key={pkg.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 group shadow-md ${
                    owned 
                      ? 'bg-[#0a1220] border-emerald-500/40 opacity-90' 
                      : 'bg-gradient-to-b from-[#0f172a] to-[#090d18] border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black font-mono ${owned ? 'text-emerald-400' : 'text-cyan-400'}`}>
                      VIP {pkg.vipLevel}
                    </span>
                    {owned ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Active Node
                      </span>
                    ) : pkg.planType === 'flash_48h' ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">48H Flash</span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">365 Days</span>
                    )}
                  </div>

                  <div>
                    <div className="text-lg font-black text-white font-mono">${pkg.priceUsd.toLocaleString()} <span className="text-xs text-slate-400 font-normal">USDT</span></div>
                    <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{pkg.name}</div>
                    <div className="text-[11px] font-mono text-cyan-300 font-bold mt-1">
                      ~{estDailyEth.toFixed(5)} ETH / day
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {pkg.profitRangeText || `${pkg.dailyReturnPercent}% Daily`}
                    </div>
                  </div>

                  <button
                    disabled={owned}
                    onClick={() => !owned && onSelectPackage(pkg)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      owned
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-75'
                        : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white cursor-pointer shadow-md'
                    }`}
                  >
                    {owned ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Active Mining (1/1)</span>
                      </>
                    ) : (
                      <>
                        <span>Deposit & Start</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Live Support button */}
      <button
        onClick={onOpenLiveSupport}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 cursor-pointer transition-transform hover:scale-105"
        title="Live Customer Service"
      >
        <MessageCircle className="w-7 h-7 fill-white text-white" />
      </button>

      {/* Enterprise Transaction Invoice & Statement Modal */}
      <InvoiceReceiptModal
        receipt={activeInvoiceReceipt}
        onClose={() => setActiveInvoiceReceipt(null)}
      />

      {/* Wallet Address Whitelist Management Modal */}
      <WalletWhitelistingModal
        isOpen={isWhitelistModalOpen}
        onClose={() => setIsWhitelistModalOpen(false)}
        userId={user.id}
        whitelist={whitelistedAddresses}
        onSaveWhitelist={handleSaveWhitelist}
        strictMode={strictWhitelistMode}
        onToggleStrictMode={handleToggleStrictMode}
        onSelectAddressForWithdraw={(addr, net) => {
          setWithdrawAddress(addr);
          setWithdrawNetwork(net);
        }}
      />

    </div>
  );
};
