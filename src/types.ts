export type Language = 'en';

export type SupportedCoin = 'ETH' | 'BTC' | 'ETC' | 'KAS' | 'LTC' | 'XMR' | 'DOGE' | 'RVN';

export type PackageType = 'daily' | 'flash_48h' | 'custom_pool';

export interface ExchangeRecordItem {
  id: string;
  userId?: string;
  userName?: string;
  fromCoin: 'ETH';
  toCoin: 'USDT';
  fromAmount: number;
  toAmount: number;
  rate: number;
  feeUsd: number;
  time: string;
  txHash: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

export interface MiningPackage {
  id: string;
  vipLevel: number;
  name: string;
  priceUsd: number;
  planType: PackageType; // 'daily' (2%-3% daily variable) or 'flash_48h' (one-time profit after 48h)
  hashrate: number;
  hashrateUnit: string;
  dailyReturnPercent: number; // e.g. 2.5%
  dailyReturnPercentMin?: number; // e.g. 2.0%
  dailyReturnPercentMax?: number; // e.g. 3.0%
  profitPercent?: number; // e.g. 10%, 12%, 14%, 20%, 25% for 48h
  profitRangeText?: string; // e.g. "2.0% - 3.0%" or "10.0% in 48 Hours"
  dailyReturnUsd: number;
  oneTimeProfitUsd?: number; // e.g. $10 for $100 pkg, $60 for $500 pkg, $140 for $1000, etc.
  totalPayoutUsd?: number; // e.g. $110, $560, $1,140, $6,000, $12,500
  sixHourIncomeEth: number; // calculated for 6-hour cycle
  durationDays: number; // 365 for daily, 2 for 48h flash
  durationHours?: number; // 48 for flash
  badge?: string;
  features: string[];
  popular?: boolean;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  packageId: string;
  packageName: string;
  planType?: PackageType;
  vipLevel: number;
  amountUsd: number;
  network: 'TRC20' | 'ERC20' | 'POLYGON' | 'BEP20';
  depositAddress: string;
  senderTxid: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
}

export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type KYCLevel = 1 | 2;

export interface KYCSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tier?: KYCLevel; // 1 = Standard Identity, 2 = Enhanced Institutional
  requestedLevel?: KYCLevel;
  status: KYCStatus;
  fullName?: string;
  dob?: string;
  country: string;
  docType?: 'passport' | 'national_id' | 'driver_license';
  documentType?: string;
  docNumber?: string;
  idNumber?: string;
  docFrontUrl?: string;
  frontDocUrl?: string;
  docBackUrl?: string;
  backDocUrl?: string;
  selfieUrl?: string;
  selfieDocUrl?: string;
  residentialAddress?: string;
  city?: string;
  postalCode?: string;
  utilityBillUrl?: string;
  submittedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface BonusAdjustment {
  id: string;
  userId: string;
  userName: string;
  type: string;
  amountUsd: number;
  yieldBoostPercent?: number;
  reason: string;
  adminNote?: string;
  createdAt: string;
}

export interface PromoCode {
  id?: string;
  code: string;
  type: string;
  value: number;
  minDepositUsd?: number;
  maxUses?: number;
  usedCount?: number;
  isActive: boolean;
  description: string;
  createdAt: string;
  expiresAt?: string;
}

export type UserAccountStatus = 'active' | 'pending' | 'suspended' | 'blocked';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  plan: string;
  vipLevel?: number;
  joinedDate: string;
  isLoggedIn?: boolean;
  hasClaimedFreeBonus?: boolean;
  onchainKey?: string;
  kycStatus?: KYCStatus;
  kycLevel?: KYCLevel;
  bonusUsdtBalance?: number;
  customYieldBonusPercent?: number;
  accountStatus?: UserAccountStatus;
  statusReason?: string;
  statusUpdatedAt?: string;
}

export interface EarningRecordItem {
  id: string;
  time: string;
  incomeEth: string;
  accountBalance: string;
}

export interface WithdrawalRecordItem {
  id: string;
  userId?: string;
  userName?: string;
  currency: string;
  type: string;
  amount: number;
  walletAddress?: string;
  status: 'Pending' | 'Withdrawal successfully' | 'Failed';
  time: string;
  txHash?: string;
}

export interface MiningStats {
  hashrate: number;
  activeMiners: number;
  dailyProductionEth: number;
  totalEarningsEth: number;
  unpaidBalanceEth: number;
  efficiency: number;
  temperature: number;
  sharesAccepted: number;
  sharesRejected: number;
  hardwareModel: string;
  nodeLocation: string;
  uptimeHours: number;
  selectedCoin: SupportedCoin;
  walletAddress: string;
}

// Auxiliary types for full backwards compatibility
export interface CoinInfo {
  symbol: SupportedCoin;
  name: string;
  algorithm: string;
  priceUsd: number;
  change24h: number;
  difficulty?: string;
  blockReward?: string | number;
  rewardPerBlock?: number;
  networkHash?: string;
  networkHashrate?: string;
  color?: string;
  iconBg?: string;
  minPayout?: number;
  unit: string;
  icon?: string;
  dailyRevenuePerTh?: number;
  [key: string]: any;
}

export interface MiningRig {
  id: string;
  name: string;
  type?: string;
  coin: SupportedCoin;
  algorithm?: string;
  hashrate: number;
  hashrateUnit?: string;
  status?: string;
  tempCelsius?: number;
  temperature?: number;
  targetTempCelsius?: number;
  powerWatts?: number;
  powerUsageWatts?: number;
  targetHashrate?: number;
  fanSpeedPercent?: number;
  acceptedShares?: number;
  rejectedShares?: number;
  uptimeSeconds?: number;
  efficiency?: number;
  hardware?: string;
  autoReboot?: boolean;
  overclock?: any;
  overclockProfile?: any;
  [key: string]: any;
}

export interface CloudContract {
  id: string;
  name?: string;
  tier?: string;
  title?: string;
  coin?: SupportedCoin;
  algorithm?: string;
  hashrate?: number;
  hashrateUnit?: string;
  priceUsd?: number;
  dailyEstimatedProfitUsd?: number;
  dailyEstimatedEarningsUsd?: number;
  dailyEstimatedCoin?: string | number;
  durationDays?: number;
  maintenanceFeePercent?: number;
  availableSlots?: number;
  isPopular?: boolean;
  features?: string[];
  [key: string]: any;
}

export interface StratumPool {
  id: string;
  region?: string;
  flag?: string;
  endpoint?: string;
  port?: number;
  sslPort?: number;
  latencyMs?: number;
  feePercent?: number;
  payoutScheme?: string;
  activeMiners?: number;
  poolHashrate?: string;
  luck24h?: number;
  status?: string;
  name?: string;
  coin?: SupportedCoin;
  stratumUrl?: string;
  pingMs?: number;
  connectedMiners?: number;
  [key: string]: any;
}

export interface HardwareBenchmark {
  id: string;
  name?: string;
  category?: string;
  manufacturer?: string;
  algorithm?: string;
  primaryCoin?: SupportedCoin;
  hashrate?: number;
  hashrateUnit?: string;
  powerWatts?: number;
  efficiency?: string;
  msrpUsd?: number;
  dailyRevenueUsd?: number;
  dailyProfitUsd?: number;
  paybackDays?: number;
  rating?: number;
  model?: string;
  type?: string;
  efficiencyJoulePerTh?: number;
  approxCostUsd?: number;
  releaseYear?: number;
  [key: string]: any;
}

export interface WalletBalance {
  coin: SupportedCoin | 'USDT';
  amount?: number;
  balance?: number;
  balanceUsd?: number;
  usdValue?: number;
  pendingMined?: number;
  totalWithdrawn?: number;
  walletAddress?: string;
  destinationAddress?: string;
  unconfirmedBalance?: number;
  minPayoutThreshold?: number;
  autoPayoutEnabled?: boolean;
  [key: string]: any;
}

export interface PayoutTransaction {
  id: string;
  timestamp?: string;
  coin?: SupportedCoin | 'USDT';
  amount?: number;
  amountUsd?: number;
  txHash?: string;
  destinationAddress?: string;
  status?: string;
  networkFee?: number;
  fee?: number;
  payoutType?: string;
  [key: string]: any;
}

export interface MiningLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  source: string;
  tag?: string;
  [key: string]: any;
}

// -------------------------------------------------------------
// 1. Referral & Affiliate Program Types
// -------------------------------------------------------------
export interface ReferralRecord {
  id: string;
  refereeName: string;
  refereeEmail: string;
  joinedAt: string;
  packageName?: string;
  depositAmountUsd: number;
  commissionEarnedUsd: number;
  status: 'Active' | 'Pending' | 'Completed';
  tierLevel: 1 | 2 | 3;
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalInvites: number;
  activeMinersCount: number;
  totalCommissionUsd: number;
  claimableCommissionUsd: number;
  tier1CommissionPercent: number; // e.g. 7%
  tier2CommissionPercent: number; // e.g. 3%
  tier3CommissionPercent: number; // e.g. 1%
  records: ReferralRecord[];
}

// -------------------------------------------------------------
// 2. Invoice & Receipt Types
// -------------------------------------------------------------
export interface InvoiceReceipt {
  receiptNumber: string;
  transactionType: 'Package Purchase' | 'Withdrawal Payout' | 'ETH-USDT Swap' | 'Daily Yield' | 'Referral Reward';
  itemName: string;
  amountUsd: number;
  cryptoAmount?: string;
  cryptoSymbol?: string;
  senderAddressOrTxid?: string;
  receiverAddress?: string;
  network?: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Processing';
  userName: string;
  userEmail: string;
  userId: string;
  vipLevel?: number;
  hashrate?: string;
  notes?: string;
  digitalSignature: string;
}

// -------------------------------------------------------------
// 3. Notification Center Types
// -------------------------------------------------------------
export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  category: 'deposit' | 'withdrawal' | 'mining' | 'referral' | 'vip' | 'security';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  txHash?: string;
  amount?: string;
}

// -------------------------------------------------------------
// 4. Daily Streak & VIP Loyalty Types
// -------------------------------------------------------------
export interface DailyStreakDay {
  dayNumber: number;
  rewardEth: number;
  rewardText: string;
  bonusHashrateGhs?: number;
  isClaimed: boolean;
  isToday: boolean;
  isLocked: boolean;
}

export interface VipTierBenefit {
  level: number;
  name: string;
  minInvestmentUsd: number;
  hashrateBoostGhs: number;
  withdrawalFeePercent: number;
  referralBonusPercent: number;
  perks: string[];
  color: string;
  badgeBg: string;
}

// -------------------------------------------------------------
// 5. Professional Enterprise Security & Automation Types
// -------------------------------------------------------------
export interface GlobalAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isActive: boolean;
  createdAt: string;
  targetAudience?: 'all' | 'miners';
  actionUrl?: string;
  actionLabel?: string;
}

export interface WhitelistedWalletAddress {
  id: string;
  userId: string;
  label: string;
  address: string;
  network: 'USDT-TRC20' | 'USDT-ERC20' | 'USDT-POLYGON' | 'USDT-BEP20';
  isLocked: boolean;
  addedAt: string;
}

export interface TwoFactorAuthSettings {
  isEnabled: boolean;
  secret: string;
  backupCodes: string[];
  activatedAt?: string;
}

export interface AutoReinvestConfig {
  isEnabled: boolean;
  minThresholdUsdt: number;
  reinvestTarget: 'hashrate' | 'active_plan';
  totalReinvestedUsdt: number;
  lastReinvestedAt?: string;
}

// -------------------------------------------------------------
// 6. Lead Capture & VIP Update Subscription Types
// -------------------------------------------------------------
export interface LeadSubscriber {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode?: string;
  status: 'new' | 'contacted' | 'subscribed' | 'unsubscribed';
  createdAt: string;
  notes?: string;
}

export interface LeadPopupConfig {
  isEnabled: boolean;
  title: string;
  subtitle: string;
  badgeText: string;
  buttonText: string;
  delaySeconds: number;
}


