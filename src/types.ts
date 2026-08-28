export type Language = 'en';

export type SupportedCoin = 'BTC' | 'ETC' | 'KAS' | 'LTC' | 'XMR' | 'DOGE' | 'RVN';

export interface MiningPackage {
  id: string;
  vipLevel: number;
  name: string;
  priceUsd: number;
  hashrate: number;
  hashrateUnit: string;
  dailyReturnPercent: number; // e.g. 2.5%
  dailyReturnUsd: number;
  sixHourIncomeEth: number; // calculated for 6-hour cycle
  durationDays: number;
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
  vipLevel: number;
  amountUsd: number;
  network: 'TRC20' | 'ERC20' | 'BEP20';
  depositAddress: string;
  senderTxid: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
}

export interface UserMiningState {
  hasActiveMining: boolean;
  activeVipLevel: number;
  activePackageName: string;
  activePackagePrice: number;
  activeHashrate: string;
  totalOutputEth: number;
  exchangeableEth: number;
  walletBalanceUsdt: number;
  withdrawableUsdt: number;
  totalProfitUsd: number;
  miningStartTime: string;
  nextPayoutCountdownSeconds: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isLoggedIn: boolean;
  joinedDate: string;
  plan: string;
  vipLevel?: number;
  role?: 'client' | 'admin';
  hasClaimedFreeBonus?: boolean;
}

export interface EarningRecordItem {
  id: string;
  time: string;
  incomeEth: string;
  accountBalance: string;
}

export interface WithdrawalRecordItem {
  id: string;
  currency: string;
  type: string;
  amount: number;
  status: 'Pending' | 'Withdrawal successfully' | 'Failed';
  time: string;
  txHash?: string;
}

export interface CoinInfo {
  symbol: string;
  name: string;
  algorithm?: string;
  priceUsd: number;
  change24h: number;
  difficulty?: string;
  blockReward?: string;
  networkHash?: string;
  color?: string;
  iconBg?: string;
  minPayout?: number;
  unit?: string;
}

export interface MiningRig {
  id: string;
  name: string;
  type: string;
  coin: string;
  algorithm: string;
  hashrate: number;
  hashrateUnit: string;
  status: string;
  tempCelsius: number;
  targetTempCelsius: number;
  powerWatts: number;
  fanSpeedPercent: number;
  efficiencyJperTH: number;
  acceptedShares: number;
  rejectedShares: number;
  uptimeHours: number;
  poolUrl: string;
  workerName: string;
  overclock?: any;
}

export interface CloudContract {
  id: string;
  title: string;
  tier: string;
  coin: string;
  algorithm: string;
  hashrate: number;
  hashrateUnit: string;
  priceUsd: number;
  durationDays: number;
  dailyEstimatedEarningsUsd: number;
  dailyEstimatedCoin: number;
  powerMaintenanceFeeUsdPerDay: number;
  netEstimatedRoiPercent: number;
  features: string[];
  inStock: boolean;
  badge?: string;
}

export interface StratumPool {
  id: string;
  region: string;
  flag: string;
  endpoint: string;
  port: number;
  sslPort: number;
  latencyMs: number;
  feePercent: number;
  payoutScheme: string;
  activeMiners: number;
  poolHashrate: string;
  luck24h: number;
  status: string;
}

export interface MiningLogEntry {
  id: string;
  timestamp: string;
  level: string;
  tag: string;
  message: string;
  latencyMs?: number;
  blockHeight?: number;
}

export interface WalletBalance {
  coin: string;
  amount: number;
  usdValue: number;
  pendingMined: number;
  totalWithdrawn: number;
  walletAddress: string;
}

export interface PayoutTransaction {
  id: string;
  timestamp: string;
  coin: string;
  amount: number;
  amountUsd: number;
  txHash: string;
  destinationAddress: string;
  status: string;
  networkFee: number;
  payoutType: string;
}

export interface HardwareBenchmark {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  algorithm: string;
  primaryCoin: string;
  hashrate: number;
  hashrateUnit: string;
  powerWatts: number;
  efficiency: string;
  msrpUsd: number;
  dailyRevenueUsd: number;
  dailyProfitUsd: number;
  paybackDays: number;
  rating: number;
}
