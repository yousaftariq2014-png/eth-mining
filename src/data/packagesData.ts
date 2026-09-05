import { MiningPackage, EarningRecordItem, WithdrawalRecordItem } from '../types';

// Category 1: Continuous Daily Variable Mining Plans (Scaling Daily Yield by Investment Tier)
// $100 to $5,000 -> 1.80% to 2.0% daily
// $5,000 to $10,000 -> 2.0% to 2.4% daily
// $10,000 to $30,000 -> 2.6% daily
// $30,000 to $50,000 -> 2.8% daily
// $50,000 to $100,000 -> maximum 3.0% daily
export const DAILY_PACKAGES: MiningPackage[] = [
  {
    id: 'pkg-daily-100',
    vipLevel: 1,
    planType: 'daily',
    name: 'VIP 1 Starter Miner',
    priceUsd: 100,
    hashrate: 25,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 1.9,
    dailyReturnPercentMin: 1.8,
    dailyReturnPercentMax: 2.0,
    profitRangeText: '1.80% - 2.00% Daily',
    dailyReturnUsd: 1.90,
    sixHourIncomeEth: 0.000173, // ~0.00069 ETH/day @ $2750/ETH
    durationDays: 365,
    features: [
      '25 TH/s Smart Hashrate Node',
      '1.80% - 2.00% Floating Daily Output',
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
    dailyReturnPercent: 2.0,
    dailyReturnPercentMin: 1.8,
    dailyReturnPercentMax: 2.0,
    profitRangeText: '1.80% - 2.00% Daily',
    dailyReturnUsd: 20.00,
    sixHourIncomeEth: 0.00182,
    durationDays: 365,
    popular: true,
    badge: 'POPULAR',
    features: [
      '300 TH/s Smart Hashrate Node',
      '1.80% - 2.00% Floating Daily Output',
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
    dailyReturnPercent: 2.2,
    dailyReturnPercentMin: 2.0,
    dailyReturnPercentMax: 2.4,
    profitRangeText: '2.00% - 2.40% Daily',
    dailyReturnUsd: 110.00,
    sixHourIncomeEth: 0.0100,
    durationDays: 365,
    badge: 'TURBO 2.2%',
    features: [
      '1,800 TH/s Hydro-Cooled Cluster',
      '2.00% - 2.40% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated Stratum Mining Node',
      'Instant 24/7 Live Support'
    ]
  },
  {
    id: 'pkg-daily-10000',
    vipLevel: 4,
    planType: 'daily',
    name: 'VIP 4 Apex Daily',
    priceUsd: 10000,
    hashrate: 4200,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.4,
    dailyReturnPercentMin: 2.0,
    dailyReturnPercentMax: 2.4,
    profitRangeText: '2.00% - 2.40% Daily',
    dailyReturnUsd: 240.00,
    sixHourIncomeEth: 0.0218,
    durationDays: 365,
    badge: 'HOT PROFIT',
    features: [
      '4,200 TH/s Hydro-Immersion Cluster',
      '2.00% - 2.40% Floating Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated Stratum Mining Node',
      'VIP Fast-Track Withdrawals'
    ]
  },
  {
    id: 'pkg-daily-20000',
    vipLevel: 5,
    planType: 'daily',
    name: 'VIP 5 Platinum Megawatt',
    priceUsd: 20000,
    hashrate: 9000,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.6,
    dailyReturnPercentMin: 2.6,
    dailyReturnPercentMax: 2.6,
    profitRangeText: '2.60% Daily ($10k-$30k Tier)',
    dailyReturnUsd: 520.00,
    sixHourIncomeEth: 0.0473,
    durationDays: 365,
    badge: 'PLATINUM 2.6%',
    features: [
      '9,000 TH/s Industrial Mining Cluster',
      '2.60% Fixed Tier Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Dedicated Account Manager',
      'VIP Fast-Track Withdrawals'
    ]
  },
  {
    id: 'pkg-daily-50000',
    vipLevel: 6,
    planType: 'daily',
    name: 'VIP 6 Diamond Enterprise',
    priceUsd: 50000,
    hashrate: 25000,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 2.8,
    dailyReturnPercentMin: 2.8,
    dailyReturnPercentMax: 2.8,
    profitRangeText: '2.80% Daily ($30k-$50k Tier)',
    dailyReturnUsd: 1400.00,
    sixHourIncomeEth: 0.1273,
    durationDays: 365,
    badge: 'ENTERPRISE 2.8%',
    features: [
      '25,000 TH/s Maximum Enterprise Cluster',
      '2.80% Fixed Tier Daily Output',
      '4 Cycle Payouts Every 6 Hours',
      'Zero Exchange Handling Fee',
      '1-on-1 Dedicated Senior Specialist'
    ]
  },
  {
    id: 'pkg-daily-100000',
    vipLevel: 7,
    planType: 'daily',
    name: 'VIP 7 Titan Sovereign',
    priceUsd: 100000,
    hashrate: 55000,
    hashrateUnit: 'TH/s',
    dailyReturnPercent: 3.0,
    dailyReturnPercentMin: 3.0,
    dailyReturnPercentMax: 3.0,
    profitRangeText: '3.00% Maximum Daily Cap',
    dailyReturnUsd: 3000.00,
    sixHourIncomeEth: 0.2727,
    durationDays: 365,
    badge: 'MAX YIELD 3.0%',
    features: [
      '55,000 TH/s Sovereign Megawatt Grid',
      '3.00% Maximum Daily Rate Cap',
      '4 Cycle Payouts Every 6 Hours',
      'Institutional Zero-Slippage Guarantee',
      'Multi-Sig Cold Vault Direct Settlement'
    ]
  }
];

// Category 2: 48-Hour One-Time Profit Flash Packages
// $100 -> 10% ($10 profit -> $110 total)
// $500 -> 12% ($60 profit -> $560 total)
// $1,000 -> 14% ($140 profit -> $1,140 total)
// $5,000 -> 20% ($1,000 profit -> $6,000 total)
// $10,000 -> 25% ($2,500 profit -> $12,500 total)

export function getFlashProfitDetails(amountUsd: number): {
  profitPercent: number;
  dailyReturnPercent: number;
  multiplier: number;
  profitUsd: number;
  totalPayoutUsd: number;
} {
  let profitPercent = 10.0;
  if (amountUsd >= 10000) profitPercent = 25.0;
  else if (amountUsd >= 5000) profitPercent = 20.0;
  else if (amountUsd >= 1000) profitPercent = 14.0;
  else if (amountUsd >= 500) profitPercent = 12.0;
  else profitPercent = 10.0;

  const profitUsd = amountUsd * (profitPercent / 100);
  return {
    profitPercent,
    dailyReturnPercent: profitPercent / 2, // 2 days (48 hours)
    multiplier: 1 + profitPercent / 100,
    profitUsd,
    totalPayoutUsd: amountUsd + profitUsd
  };
}

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

// Category 3: Custom Enterprise Hashrate & Institutional Rig Builder ($10,000 to $200,000)
// Configurable custom packages scaling from $10k to $200k max
export const CUSTOM_PACKAGE_MIN_USD = 10000;
export const CUSTOM_PACKAGE_MAX_USD = 200000;

export function calculateCustomPackageRates(amountUsd: number) {
  const clampedAmount = Math.max(CUSTOM_PACKAGE_MIN_USD, Math.min(CUSTOM_PACKAGE_MAX_USD, Number(amountUsd) || CUSTOM_PACKAGE_MIN_USD));
  
  // Rate scale:
  // $10,000 - $30,000 -> 2.60% daily
  // $30,000 - $50,000 -> 2.80% daily
  // $50,000 - $100,000 -> 3.00% daily
  // $100,000 - $200,000 -> 3.00% - 3.20% daily (Institutional Sovereign Node)
  let dailyRate = 2.60;
  let tierName = 'Custom High-Yield Tier ($10k-$30k)';
  let vipLevel = 5;
  let tierBadge = 'TIER-1 (2.60%)';

  if (clampedAmount >= 100000) {
    dailyRate = 3.20;
    tierName = 'Custom Sovereign Megawatt Node ($100k-$200k)';
    vipLevel = 8;
    tierBadge = 'SOVEREIGN (3.20%)';
  } else if (clampedAmount >= 50000) {
    dailyRate = 3.00;
    tierName = 'Custom Diamond Enterprise ($50k-$100k)';
    vipLevel = 7;
    tierBadge = 'DIAMOND (3.00%)';
  } else if (clampedAmount >= 30000) {
    dailyRate = 2.80;
    tierName = 'Custom Enterprise Cluster ($30k-$50k)';
    vipLevel = 6;
    tierBadge = 'ENTERPRISE (2.80%)';
  }

  // Hashpower allocated (~0.55 TH/s per $1 USD)
  const hashrate = Math.round(clampedAmount * 0.55);
  const dailyReturnUsd = Number(((clampedAmount * dailyRate) / 100).toFixed(2));
  const sixHourIncomeEth = Number(((dailyReturnUsd / 2750) / 4).toFixed(6));
  const monthlyProjectedUsd = Number((dailyReturnUsd * 30).toFixed(2));
  const weeklyProjectedUsd = Number((dailyReturnUsd * 7).toFixed(2));

  return {
    clampedAmount,
    dailyRate,
    tierName,
    vipLevel,
    tierBadge,
    hashrate,
    dailyReturnUsd,
    weeklyProjectedUsd,
    monthlyProjectedUsd,
    sixHourIncomeEth
  };
}

export function createCustomMiningPackage(amountUsd: number, durationDays: number = 365): MiningPackage {
  const calc = calculateCustomPackageRates(amountUsd);
  return {
    id: `pkg-custom-${calc.clampedAmount}`,
    vipLevel: calc.vipLevel,
    planType: 'custom_pool',
    name: `Custom Rig ($${calc.clampedAmount.toLocaleString()})`,
    priceUsd: calc.clampedAmount,
    hashrate: calc.hashrate,
    hashrateUnit: 'TH/s Dedicated',
    dailyReturnPercent: calc.dailyRate,
    dailyReturnPercentMin: calc.dailyRate,
    dailyReturnPercentMax: calc.dailyRate,
    profitRangeText: `${calc.dailyRate.toFixed(2)}% Daily Tier Yield`,
    dailyReturnUsd: calc.dailyReturnUsd,
    sixHourIncomeEth: calc.sixHourIncomeEth,
    durationDays: durationDays,
    badge: calc.tierBadge,
    features: [
      `${calc.hashrate.toLocaleString()} TH/s Dedicated Stratum Hashpower`,
      `${calc.dailyRate.toFixed(2)}% Fixed Daily Output ($${calc.dailyReturnUsd.toLocaleString()}/day)`,
      `$${calc.monthlyProjectedUsd.toLocaleString()} Projected 30-Day Mining Output`,
      '4 Mining Settlement Cycles Every 6 Hours',
      'Direct Stratum ASIC Grid Dedicated Cluster',
      'VIP 1-on-1 Dedicated Institutional Concierge'
    ],
    popular: calc.clampedAmount >= 50000
  };
}

export const CUSTOM_PRESET_PACKAGES: MiningPackage[] = [
  createCustomMiningPackage(10000, 365),
  createCustomMiningPackage(25000, 365),
  createCustomMiningPackage(50000, 365),
  createCustomMiningPackage(100000, 365),
  createCustomMiningPackage(200000, 365)
];

// Combined default list
export const MINING_PACKAGES: MiningPackage[] = [
  ...DAILY_PACKAGES,
  ...FLASH_48H_PACKAGES,
  ...CUSTOM_PRESET_PACKAGES
];

export const INITIAL_EARNINGS_RECORDS: EarningRecordItem[] = [];

export const INITIAL_WITHDRAWAL_RECORDS: WithdrawalRecordItem[] = [];
