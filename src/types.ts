export type Language = 'en';

export type SupportedCoin = 'BTC' | 'ETC' | 'KAS' | 'LTC' | 'XMR' | 'DOGE' | 'RVN';

export type PackageType = 'daily' | 'flash_48h';

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
  packageId: string;
  packageName: string;
  planType?: PackageType;
  vipLevel: number;
  amountUsd: number;
  network: 'TRC20' | 'ERC20' | 'BEP20';
  depositAddress: string;
  senderTxid: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
}

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
