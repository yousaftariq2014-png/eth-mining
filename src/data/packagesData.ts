import { MiningPackage, EarningRecordItem, WithdrawalRecordItem } from '../types';

// Category 1: Continuous Daily Variable Mining Plans (2% to 3% Floating Daily Yield)
export const DAILY_PACKAGES: MiningPackage[] = [
  {
    id: 'pkg-daily-100',
    vipLevel: 1,
    planType: 'daily',
    name: 'VIP 1 Daily Miner',
    priceUsd: 100,
    hashrate: 25,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.3,
    dailyReturnPercentMin: 2.0,
    dailyReturnPercentMax: 2.5,
    profitRangeText: '2.0% - 2.5% Daily',
    dailyReturnUsd: 2.30,
    sixHourIncomeEth: 0.00021, // ~0.00084 ETH/day
    durationDays: 365,
    features: [
      '25 TH/s Smart Hashrate Node',
      '2.0% - 2.5% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Instant One-Click USDT Exchange',
      'Non-Custodial Direct Withdrawals'
    ]
  },
  {
    id: 'pkg-daily-250',
    vipLevel: 2,
    planType: 'daily',
    name: 'VIP 2 Daily Pro',
    priceUsd: 250,
    hashrate: 75,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.5,
    dailyReturnPercentMin: 2.2,
    dailyReturnPercentMax: 2.7,
    profitRangeText: '2.2% - 2.7% Daily',
    dailyReturnUsd: 6.25,
    sixHourIncomeEth: 0.00059,
    durationDays: 365,
    popular: true,
    badge: 'POPULAR',
    features: [
      '75 TH/s Smart Hashrate Node',
      '2.2% - 2.7% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Zero Pool Slippage Rate',
      'Instant One-Click USDT Exchange'
    ]
  },
  {
    id: 'pkg-daily-500',
    vipLevel: 3,
    planType: 'daily',
    name: 'VIP 3 Turbo Daily',
    priceUsd: 500,
    hashrate: 180,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.7,
    dailyReturnPercentMin: 2.4,
    dailyReturnPercentMax: 2.9,
    profitRangeText: '2.4% - 2.9% Daily',
    dailyReturnUsd: 13.50,
    sixHourIncomeEth: 0.00127,
    durationDays: 365,
    badge: 'HOT PROFIT',
    features: [
      '180 TH/s Hydro-Cooled Cluster',
      '2.4% - 2.9% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated Stratum Mining Node',
      'Instant 24/7 Live Support'
    ]
  },
  {
    id: 'pkg-daily-1000',
    vipLevel: 4,
    planType: 'daily',
    name: 'VIP 4 Platinum Megawatt',
    priceUsd: 1000,
    hashrate: 420,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.9,
    dailyReturnPercentMin: 2.6,
    dailyReturnPercentMax: 3.0,
    profitRangeText: '2.6% - 3.0% Daily',
    dailyReturnUsd: 29.00,
    sixHourIncomeEth: 0.00287,
    durationDays: 365,
    badge: 'HIGH YIELD',
    features: [
      '420 TH/s Industrial Mining Cluster',
      '2.6% - 3.0% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated Account Manager',
      'VIP Fast-Track Withdrawals'
    ]
  },
  {
    id: 'pkg-daily-2500',
    vipLevel: 5,
    planType: 'daily',
    name: 'VIP 5 Diamond Enterprise',
    priceUsd: 2500,
    hashrate: 1200,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 3.1,
    dailyReturnPercentMin: 2.8,
    dailyReturnPercentMax: 3.2,
    profitRangeText: '2.8% - 3.2% Daily',
    dailyReturnUsd: 77.50,
    sixHourIncomeEth: 0.00803,
    durationDays: 365,
    badge: 'ENTERPRISE VIP',
    features: [
      '1,200 TH/s Maximum Enterprise Cluster',
      '2.8% - 3.2% Premium Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Zero Exchange Handling Fee',
      '1-on-1 Dedicated Senior Specialist'
    ]
  }
];

// Category 2: 48-Hour One-Time Profit Flash Packages
// $100 -> 10% ($10 profit -> $110 total)
// $500 -> 12% ($60 profit -> $560 total)
// $1,000 -> 14% ($140 profit -> $1,140 total)
// $5,000 -> 20% ($1,000 profit -> $6,000 total)
// $10,000 -> 25% ($2,500 profit -> $12,500 total)
export const FLASH_48H_PACKAGES: MiningPackage[] = [
  {
    id: 'pkg-flash-100',
    vipLevel: 1,
    planType: 'flash_48h',
    name: '48H Flash $100 Node',
    priceUsd: 100,
    hashrate: 120,
    hashrateUnit: 'TH/s Boost',
    dailyReturnPercent: 5.0, // effective daily rate
    profitPercent: 10.0,
    profitRangeText: '10.0% in 48 Hours',
    dailyReturnUsd: 5.00,
    oneTimeProfitUsd: 10.00,
    totalPayoutUsd: 110.00,
    sixHourIncomeEth: 0.00085,
    durationDays: 2,
    durationHours: 48,
    badge: '48H FLASH 10%',
    features: [
      '10% Fixed Profit After 48 Hours',
      'Principal ($100) + Profit ($10) = $110',
      '48-Hour Automated Settlement',
      'Zero Lockup Period After 48h',
      'Instant Non-Custodial USDT Payout'
    ]
  },
  {
    id: 'pkg-flash-500',
    vipLevel: 2,
    planType: 'flash_48h',
    name: '48H Flash $500 Node',
    priceUsd: 500,
    hashrate: 650,
    hashrateUnit: 'TH/s Boost',
    dailyReturnPercent: 6.0,
    profitPercent: 12.0,
    profitRangeText: '12.0% in 48 Hours',
    dailyReturnUsd: 30.00,
    oneTimeProfitUsd: 60.00,
    totalPayoutUsd: 560.00,
    sixHourIncomeEth: 0.0051,
    durationDays: 2,
    durationHours: 48,
    popular: true,
    badge: 'POPULAR +$60',
    features: [
      '12% Fixed Profit After 48 Hours',
      'Principal ($500) + Profit ($60) = $560',
      '48-Hour Automated Settlement',
      'High-Speed Flash Hash Execution',
      'Zero Slippage Direct Payout'
    ]
  },
  {
    id: 'pkg-flash-1000',
    vipLevel: 3,
    planType: 'flash_48h',
    name: '48H Flash $1,000 Node',
    priceUsd: 1000,
    hashrate: 1400,
    hashrateUnit: 'TH/s Boost',
    dailyReturnPercent: 7.0,
    profitPercent: 14.0,
    profitRangeText: '14.0% in 48 Hours',
    dailyReturnUsd: 70.00,
    oneTimeProfitUsd: 140.00,
    totalPayoutUsd: 1140.00,
    sixHourIncomeEth: 0.0118,
    durationDays: 2,
    durationHours: 48,
    badge: '14% HIGH RETURN',
    features: [
      '14% Fixed Profit After 48 Hours',
      'Principal ($1,000) + Profit ($140) = $1,140',
      'One-Time Lump Sum Capital Unlock',
      'Dedicated Stratum Node Connection',
      'Instant USDT Release to Wallet'
    ]
  },
  {
    id: 'pkg-flash-5000',
    vipLevel: 4,
    planType: 'flash_48h',
    name: '48H Flash $5,000 Whale',
    priceUsd: 5000,
    hashrate: 7500,
    hashrateUnit: 'TH/s Boost',
    dailyReturnPercent: 10.0,
    profitPercent: 20.0,
    profitRangeText: '20.0% in 48 Hours',
    dailyReturnUsd: 500.00,
    oneTimeProfitUsd: 1000.00,
    totalPayoutUsd: 6000.00,
    sixHourIncomeEth: 0.0845,
    durationDays: 2,
    durationHours: 48,
    badge: '20% MEGA PROFIT',
    features: [
      '20% Fixed Profit After 48 Hours',
      'Principal ($5,000) + Profit ($1,000) = $6,000',
      'Full Principal & Profit Liquidity Unlock',
      'Institutional VIP Mining Cluster',
      'Dedicated 24/7 Account Specialist'
    ]
  },
  {
    id: 'pkg-flash-10000',
    vipLevel: 5,
    planType: 'flash_48h',
    name: '48H Flash $10,000 Titan',
    priceUsd: 10000,
    hashrate: 16000,
    hashrateUnit: 'TH/s Boost',
    dailyReturnPercent: 12.5,
    profitPercent: 25.0,
    profitRangeText: '25.0% in 48 Hours',
    dailyReturnUsd: 1250.00,
    oneTimeProfitUsd: 2500.00,
    totalPayoutUsd: 12500.00,
    sixHourIncomeEth: 0.2115,
    durationDays: 2,
    durationHours: 48,
    badge: '25% TITAN YIELD',
    features: [
      '25% Fixed Profit After 48 Hours',
      'Principal ($10,000) + Profit ($2,500) = $12,500',
      'VIP Institutional Stratum Pipeline',
      'Automated 48H Capital Settlement',
      'Dedicated Senior Operations Concierge'
    ]
  }
];

// Combined default list
export const MINING_PACKAGES: MiningPackage[] = [
  ...DAILY_PACKAGES,
  ...FLASH_48H_PACKAGES
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
