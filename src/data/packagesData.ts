import { MiningPackage, EarningRecordItem, WithdrawalRecordItem } from '../types';

// Category 1: Continuous Daily Variable Mining Plans (Scaling Daily Yield)
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
    id: 'pkg-daily-1000',
    vipLevel: 2,
    planType: 'daily',
    name: 'VIP 2 Daily Pro',
    priceUsd: 1000,
    hashrate: 300,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 3.0,
    dailyReturnPercentMin: 2.8,
    dailyReturnPercentMax: 3.2,
    profitRangeText: '2.8% - 3.2% Daily',
    dailyReturnUsd: 30.00,
    sixHourIncomeEth: 0.00273,
    durationDays: 365,
    popular: true,
    badge: 'POPULAR',
    features: [
      '300 TH/s Smart Hashrate Node',
      '2.8% - 3.2% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Zero Pool Slippage Rate',
      'Instant One-Click USDT Exchange'
    ]
  },
  {
    id: 'pkg-daily-5000',
    vipLevel: 3,
    planType: 'daily',
    name: 'VIP 3 Turbo Daily',
    priceUsd: 5000,
    hashrate: 1800,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 3.8,
    dailyReturnPercentMin: 3.5,
    dailyReturnPercentMax: 4.0,
    profitRangeText: '3.5% - 4.0% Daily',
    dailyReturnUsd: 190.00,
    sixHourIncomeEth: 0.0173,
    durationDays: 365,
    badge: 'HOT PROFIT',
    features: [
      '1,800 TH/s Hydro-Cooled Cluster',
      '3.5% - 4.0% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated Stratum Mining Node',
      'Instant 24/7 Live Support'
    ]
  },
  {
    id: 'pkg-daily-20000',
    vipLevel: 4,
    planType: 'daily',
    name: 'VIP 4 Platinum Megawatt',
    priceUsd: 20000,
    hashrate: 8500,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 4.8,
    dailyReturnPercentMin: 4.5,
    dailyReturnPercentMax: 5.0,
    profitRangeText: '4.5% - 5.0% Daily',
    dailyReturnUsd: 960.00,
    sixHourIncomeEth: 0.0873,
    durationDays: 365,
    badge: 'HIGH YIELD',
    features: [
      '8,500 TH/s Industrial Mining Cluster',
      '4.5% - 5.0% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated Account Manager',
      'VIP Fast-Track Withdrawals'
    ]
  },
  {
    id: 'pkg-daily-50000',
    vipLevel: 5,
    planType: 'daily',
    name: 'VIP 5 Diamond Enterprise',
    priceUsd: 50000,
    hashrate: 25000,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 5.8,
    dailyReturnPercentMin: 5.5,
    dailyReturnPercentMax: 6.0,
    profitRangeText: '5.5% - 6.0% Daily',
    dailyReturnUsd: 2900.00,
    sixHourIncomeEth: 0.2636,
    durationDays: 365,
    badge: 'ENTERPRISE VIP',
    features: [
      '25,000 TH/s Maximum Enterprise Cluster',
      '5.5% - 6.0% Premium Daily Output',
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

export const INITIAL_EARNINGS_RECORDS: EarningRecordItem[] = [];

export const INITIAL_WITHDRAWAL_RECORDS: WithdrawalRecordItem[] = [];
