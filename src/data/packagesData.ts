import { MiningPackage, EarningRecordItem, WithdrawalRecordItem } from '../types';

export const MINING_PACKAGES: MiningPackage[] = [
  {
    id: 'pkg-vip-1',
    vipLevel: 1,
    name: 'VIP 1 Starter Miner',
    priceUsd: 100,
    hashrate: 25,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.5,
    dailyReturnUsd: 2.50,
    sixHourIncomeEth: 0.00021, // ~0.00084 ETH/day
    durationDays: 365,
    features: [
      '25 TH/s Smart Hashrate Node',
      '4 Cycle Payouts Every 6 Hours',
      'Instant One-Click USDT Exchange',
      '24/7 Automated Cloud Mining',
      'Non-Custodial Direct Withdrawals'
    ]
  },
  {
    id: 'pkg-vip-2',
    vipLevel: 2,
    name: 'VIP 2 Advanced Node',
    priceUsd: 250,
    hashrate: 75,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.8,
    dailyReturnUsd: 7.00,
    sixHourIncomeEth: 0.00059,
    durationDays: 365,
    popular: true,
    badge: 'POPULAR',
    features: [
      '75 TH/s Smart Hashrate Node',
      '4 Cycle Payouts Every 6 Hours',
      'Zero Pool Slippage Rate',
      'Instant One-Click USDT Exchange',
      'Priority Payout Processing'
    ]
  },
  {
    id: 'pkg-vip-3',
    vipLevel: 3,
    name: 'VIP 3 Turbo Pro',
    priceUsd: 500,
    hashrate: 180,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 3.0,
    dailyReturnUsd: 15.00,
    sixHourIncomeEth: 0.00127,
    durationDays: 365,
    badge: 'HOT PROFIT',
    features: [
      '180 TH/s Hydro-Cooled Cluster',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated High-Yield Stratum Port',
      '12% Affiliate Referral Bonus',
      'Instant 24/7 Live Support'
    ]
  },
  {
    id: 'pkg-vip-4',
    vipLevel: 4,
    name: 'VIP 4 Platinum Megawatt',
    priceUsd: 1000,
    hashrate: 420,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 3.4,
    dailyReturnUsd: 34.00,
    sixHourIncomeEth: 0.00287,
    durationDays: 365,
    badge: 'HIGH YIELD',
    features: [
      '420 TH/s Industrial Mining Cluster',
      'Sub-0.03 $/kWh Optimized Energy',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated Account Manager',
      'VIP Fast-Track Withdrawals'
    ]
  },
  {
    id: 'pkg-vip-5',
    vipLevel: 5,
    name: 'VIP 5 Diamond Enterprise',
    priceUsd: 2500,
    hashrate: 1200,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 3.8,
    dailyReturnUsd: 95.00,
    sixHourIncomeEth: 0.00803,
    durationDays: 365,
    badge: 'ENTERPRISE VIP',
    features: [
      '1,200 TH/s Maximum Enterprise Cluster',
      'Top-Tier 3.8% Daily Compound Yield',
      '4 Cycle Payouts Every 6 Hours',
      'Zero Exchange Handling Fee',
      '1-on-1 Dedicated Senior Specialist'
    ]
  }
];

export const INITIAL_EARNINGS_RECORDS: EarningRecordItem[] = [
  { id: 'e-1', time: '09/16/2025 17:00:00', incomeEth: '0.354311 ETH', accountBalance: '186193.1680' },
  { id: 'e-2', time: '09/16/2025 11:00:01', incomeEth: '0.350842 ETH', accountBalance: '186193.1680' },
  { id: 'e-3', time: '09/16/2025 05:00:00', incomeEth: '0.350093 ETH', accountBalance: '186193.1680' },
  { id: 'e-4', time: '09/15/2025 23:00:00', incomeEth: '0.349837 ETH', accountBalance: '186193.1680' },
  { id: 'e-5', time: '09/15/2025 17:00:00', incomeEth: '0.351692 ETH', accountBalance: '186193.1680' },
  { id: 'e-6', time: '09/15/2025 11:00:00', incomeEth: '0.349661 ETH', accountBalance: '186193.1680' },
  { id: 'e-7', time: '09/15/2025 05:00:00', incomeEth: '0.341394 ETH', accountBalance: '186193.1680' },
];

export const INITIAL_WITHDRAWAL_RECORDS: WithdrawalRecordItem[] = [
  {
    id: 'w-1',
    currency: 'USDT-ERCWithdrawal',
    type: 'USDT-ERC',
    amount: -50464.5554,
    status: 'Pending',
    time: '09/16/2025 21:22:28',
  },
  {
    id: 'w-2',
    currency: 'USDT-ERCWithdrawal',
    type: 'USDT-ERC',
    amount: -80465.4219,
    status: 'Withdrawal successfully',
    time: '07/25/2025 21:06:51',
  },
  {
    id: 'w-3',
    currency: 'USDT-ERCWithdrawal',
    type: 'USDT-ERC',
    amount: -20116.5454,
    status: 'Withdrawal successfully',
    time: '07/23/2025 19:06:20',
  },
  {
    id: 'w-4',
    currency: 'USDT-ERCWithdrawal',
    type: 'USDT-ERC',
    amount: -64558,
    status: 'Withdrawal successfully',
    time: '07/20/2025 20:29:29',
  },
  {
    id: 'w-5',
    currency: 'USDT-ERCWithdrawal',
    type: 'USDT-ERC',
    amount: -50151,
    status: 'Withdrawal successfully',
    time: '07/18/2025 19:06:28',
  },
];
