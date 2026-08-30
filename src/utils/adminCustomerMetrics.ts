import { UserProfile, DepositRequest, MiningPackage, WithdrawalRecordItem } from '../types';
import { DAILY_PACKAGES, FLASH_48H_PACKAGES, MINING_PACKAGES } from '../data/packagesData';
import { getClientCredentials } from '../lib/supabaseClient';

export interface CustomerMiningContract {
  deposit: DepositRequest;
  pkg: MiningPackage | null;
  activationDate: Date;
  expirationDate: Date;
  isExpired: boolean;
  timeRemainingText: string;
  progressPercent: number;
  hashrate: number;
  hashrateUnit: string;
  dailyYieldUsd: number;
  estTotalYieldUsd: number;
  accruedYieldUsd: number;
  isFlash: boolean;
  durationLabel: string;
}

export interface AggregatedCustomerData {
  user: UserProfile;
  deposits: DepositRequest[];
  approvedDeposits: DepositRequest[];
  pendingDeposits: DepositRequest[];
  rejectedDeposits: DepositRequest[];
  totalDepositedUsd: number;
  pendingDepositedUsd: number;
  activeContracts: CustomerMiningContract[];
  expiredContracts: CustomerMiningContract[];
  totalHashrate: number;
  totalDailyYieldUsd: number;
  totalAccruedProfitsUsd: number;
  withdrawals: WithdrawalRecordItem[];
  approvedWithdrawals: WithdrawalRecordItem[];
  pendingWithdrawals: WithdrawalRecordItem[];
  failedWithdrawals: WithdrawalRecordItem[];
  totalWithdrawnUsd: number;
  pendingWithdrawnUsd: number;
  estimatedAvailableBalanceUsd: number;
  primaryWalletAddress: string;
  lastDepositTxid: string;
  lastActivityDate: string;
  computedVipLevel: number;
  accountStatus: 'Active Miner' | 'Pending Verification' | 'Pending Withdrawal' | 'Inactive / Free';
}

function parseTimestamp(ts?: string): Date {
  if (!ts) return new Date();
  const normalized = ts.includes(' ') && !ts.includes('T') ? ts.replace(' ', 'T') : ts;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00h 00m 00s (Expired)';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

export function matchUserToDeposit(user: UserProfile, dep: DepositRequest): boolean {
  if (dep.userId && user.id && dep.userId.toLowerCase() === user.id.toLowerCase()) return true;
  if (dep.userName && user.email && dep.userName.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
  if (dep.userName && !dep.userName.includes('@') && user.name && dep.userName.trim().toLowerCase() === user.name.trim().toLowerCase()) {
    if (!dep.userId || dep.userId === user.id) return true;
  }
  return false;
}

export function matchUserToWithdrawal(user: UserProfile, w: WithdrawalRecordItem): boolean {
  if (w.userId && user.id && w.userId.toLowerCase() === user.id.toLowerCase()) return true;
  if (w.userName && user.email && w.userName.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
  if (w.userName && !w.userName.includes('@') && user.name && w.userName.trim().toLowerCase() === user.name.trim().toLowerCase()) {
    if (!w.userId || w.userId === user.id) return true;
  }
  return false;
}

export function calculateCustomerAggregation(
  users: UserProfile[],
  deposits: DepositRequest[],
  withdrawals: WithdrawalRecordItem[],
  packages: MiningPackage[],
  now: Date = new Date()
): AggregatedCustomerData[] {
  const unifiedUsers: UserProfile[] = [];

  // Strictly match by unique email or unique non-empty ID - NEVER by name!
  const findExisting = (id?: string, email?: string): UserProfile | undefined => {
    const cId = id?.trim().toLowerCase();
    const cEmail = email?.trim().toLowerCase();

    return unifiedUsers.find(u => {
      if (cEmail && u.email && u.email.trim().toLowerCase() === cEmail) return true;
      if (cId && u.id && u.id.trim().toLowerCase() === cId) return true;
      return false;
    });
  };

  // Helper to add or merge user into unified list
  const registerUserCandidate = (u: Partial<UserProfile> & { email?: string; id?: string }) => {
    if (!u || (!u.email && !u.id)) return;
    const cleanEmail = u.email?.trim().toLowerCase();
    const cleanId = u.id?.trim();
    const creds = getClientCredentials(cleanEmail);
    const resolvedPass = u.password || creds?.password;
    const resolvedKey = u.onchainKey || creds?.onchainKey;

    const existing = findExisting(cleanId, cleanEmail);
    if (!existing) {
      unifiedUsers.push({
        id: cleanId || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: u.name?.trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'Client'),
        email: cleanEmail || '',
        password: resolvedPass,
        onchainKey: resolvedKey,
        plan: u.plan || (u.vipLevel ? `VIP ${u.vipLevel}` : 'No Active Package'),
        vipLevel: u.vipLevel ?? 0,
        joinedDate: u.joinedDate || new Date().toISOString().substring(0, 10),
        isLoggedIn: u.isLoggedIn ?? true,
      });
    } else {
      if (!existing.email && cleanEmail) existing.email = cleanEmail;
      if (!existing.name && u.name) existing.name = u.name;
      if (!existing.id && cleanId) existing.id = cleanId;
      if (!existing.password && resolvedPass) existing.password = resolvedPass;
      if (!existing.onchainKey && resolvedKey) existing.onchainKey = resolvedKey;
    }
  };

  // 1. Process known registered users from props
  users.forEach(u => registerUserCandidate(u));

  // 2. Cross-reference localStorage stores for any registered user not in props
  try {
    const rawLocal = localStorage.getItem('hashforge_registered_users');
    if (rawLocal) {
      const parsed: UserProfile[] = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) {
        parsed.forEach(u => registerUserCandidate(u));
      }
    }
  } catch {}

  try {
    const rawActiveUser = localStorage.getItem('hashforge_user');
    if (rawActiveUser) {
      const parsed: UserProfile = JSON.parse(rawActiveUser);
      if (parsed?.email) {
        registerUserCandidate(parsed);
      }
    }
  } catch {}

  try {
    const rawCreds = localStorage.getItem('hashforge_admin_credentials_store');
    if (rawCreds) {
      const credsMap: Record<string, any> = JSON.parse(rawCreds);
      Object.entries(credsMap).forEach(([email, cred]) => {
        if (email) {
          registerUserCandidate({
            email,
            password: cred.password,
            onchainKey: cred.onchainKey,
          });
        }
      });
    }
  } catch {}

  // 3. Synthesize missing users from deposits without duplicating
  deposits.forEach((d, idx) => {
    const isEmail = d.userName?.includes('@') || false;
    const email = isEmail ? d.userName : undefined;
    const existing = findExisting(d.userId, email);

    if (!existing) {
      const generatedId = d.userId || `usr-dep-${d.id || idx}-${Math.random().toString(36).substr(2, 6)}`;
      const targetEmail = isEmail ? (d.userName || '') : `${(d.userName || 'client').replace(/\s+/g, '').toLowerCase()}@client.platform`;
      const creds = getClientCredentials(targetEmail);

      const isApproved = d.status === 'approved';
      unifiedUsers.push({
        id: generatedId,
        name: d.userName ? (isEmail ? d.userName.split('@')[0] : d.userName) : 'Client',
        email: targetEmail,
        password: creds?.password,
        onchainKey: creds?.onchainKey,
        plan: isApproved ? `VIP ${d.vipLevel || 1} (${d.packageName || 'Miner'})` : 'No Active Package',
        vipLevel: isApproved ? (d.vipLevel || 1) : 0,
        joinedDate: d.createdAt?.substring(0, 10) || '2026-08-28',
        isLoggedIn: true
      });
    }
  });

  // 4. Synthesize missing users from withdrawals without duplicating
  withdrawals.forEach((w, idx) => {
    const isEmail = w.userName?.includes('@') || false;
    const email = isEmail ? w.userName : undefined;
    const existing = findExisting(w.userId, email);

    if (!existing) {
      const generatedId = w.userId || `usr-w-${w.id || idx}-${Math.random().toString(36).substr(2, 6)}`;
      const targetEmail = isEmail ? (w.userName || '') : `${(w.userName || 'client').replace(/\s+/g, '').toLowerCase()}@client.platform`;
      const creds = getClientCredentials(targetEmail);

      unifiedUsers.push({
        id: generatedId,
        name: w.userName ? (isEmail ? w.userName.split('@')[0] : w.userName) : 'Client',
        email: targetEmail,
        password: creds?.password,
        onchainKey: creds?.onchainKey,
        plan: 'No Active Package',
        vipLevel: 0,
        joinedDate: w.time?.substring(0, 10) || '2026-08-28',
        isLoggedIn: true
      });
    }
  });

  // 5. Ensure guaranteed unique IDs across unifiedUsers
  const seenUserIds = new Set<string>();
  const sanitizedUsers: UserProfile[] = [];
  unifiedUsers.forEach((u, idx) => {
    let finalId = u.id;
    if (!finalId || seenUserIds.has(finalId.toLowerCase())) {
      finalId = `${finalId || 'usr'}-dedup-${idx}-${Math.random().toString(36).substr(2, 4)}`;
    }
    seenUserIds.add(finalId.toLowerCase());
    sanitizedUsers.push({ ...u, id: finalId });
  });

  const allAvailablePackages = [...packages, ...DAILY_PACKAGES, ...FLASH_48H_PACKAGES, ...MINING_PACKAGES];

  return sanitizedUsers.map(user => {
    const userDeposits = deposits.filter(d => matchUserToDeposit(user, d));
    const userWithdrawals = withdrawals.filter(w => matchUserToWithdrawal(user, w));

    const approvedDeposits = userDeposits.filter(d => d.status === 'approved');
    const pendingDeposits = userDeposits.filter(d => d.status === 'pending');
    const rejectedDeposits = userDeposits.filter(d => d.status === 'rejected');

    const totalDepositedUsd = approvedDeposits.reduce((sum, d) => sum + Number(d.amountUsd || 0), 0);
    const pendingDepositedUsd = pendingDeposits.reduce((sum, d) => sum + Number(d.amountUsd || 0), 0);

    const approvedWithdrawals = userWithdrawals.filter(w => w.status === 'Withdrawal successfully');
    const pendingWithdrawals = userWithdrawals.filter(w => w.status === 'Pending');
    const failedWithdrawals = userWithdrawals.filter(w => w.status === 'Failed');

    const totalWithdrawnUsd = approvedWithdrawals.reduce((sum, w) => sum + Math.abs(Number(w.amount || 0)), 0);
    const pendingWithdrawnUsd = pendingWithdrawals.reduce((sum, w) => sum + Math.abs(Number(w.amount || 0)), 0);

    // Process Contracts
    const allContracts: CustomerMiningContract[] = approvedDeposits.map(dep => {
      const matchedPkg = allAvailablePackages.find(p => p.id === dep.packageId)
        || allAvailablePackages.find(p => p.name.toLowerCase() === (dep.packageName || '').toLowerCase())
        || allAvailablePackages.find(p => p.vipLevel === dep.vipLevel && p.priceUsd === Number(dep.amountUsd))
        || null;

      const isFlash = 
        dep.planType === 'flash_48h' ||
        matchedPkg?.planType === 'flash_48h' ||
        matchedPkg?.durationHours === 48 ||
        (dep.packageName && dep.packageName.toLowerCase().includes('48h')) ||
        (dep.packageName && dep.packageName.toLowerCase().includes('flash'));

      const durationMs = isFlash ? 48 * 60 * 60 * 1000 : (matchedPkg?.durationDays || 365) * 24 * 60 * 60 * 1000;
      const durationLabel = isFlash ? '48 Hours Flash' : `${matchedPkg?.durationDays || 365} Days Daily`;

      const rawActivation = dep.approvedAt || dep.createdAt;
      const activationDate = parseTimestamp(rawActivation);
      const expirationDate = new Date(activationDate.getTime() + durationMs);

      const timeRemainingMs = Math.max(0, expirationDate.getTime() - now.getTime());
      const isExpired = timeRemainingMs <= 0;
      const timeRemainingText = formatCountdown(timeRemainingMs);

      const totalElapsedMs = Math.max(0, now.getTime() - activationDate.getTime());
      const progressPercent = Math.min(100, Math.max(0, (totalElapsedMs / durationMs) * 100));

      const amountUsd = Number(dep.amountUsd || 0);
      const estTotalYieldUsd = isFlash
        ? (matchedPkg?.totalPayoutUsd || (amountUsd * (1 + (matchedPkg?.profitPercent || 10) / 100)))
        : (matchedPkg?.dailyReturnUsd ? matchedPkg.dailyReturnUsd * (matchedPkg.durationDays || 365) : amountUsd * 2.5);

      const dailyYieldUsd = isFlash
        ? (matchedPkg?.dailyReturnUsd || (amountUsd * 0.05))
        : (matchedPkg?.dailyReturnUsd || (amountUsd * (matchedPkg?.dailyReturnPercent || 2.5) / 100));

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
        timeRemainingText,
        progressPercent,
        hashrate: matchedPkg?.hashrate || (dep.vipLevel * 25),
        hashrateUnit: matchedPkg?.hashrateUnit || 'TH/s',
        dailyYieldUsd,
        estTotalYieldUsd,
        accruedYieldUsd,
        isFlash,
        durationLabel
      };
    });

    const activeContracts = allContracts.filter(c => !c.isExpired);
    const expiredContracts = allContracts.filter(c => c.isExpired);

    const totalHashrate = activeContracts.reduce((sum, c) => sum + c.hashrate, 0);
    const totalDailyYieldUsd = activeContracts.reduce((sum, c) => sum + c.dailyYieldUsd, 0);
    const totalAccruedProfitsUsd = allContracts.reduce((sum, c) => sum + c.accruedYieldUsd, 0);

    const estimatedAvailableBalanceUsd = Math.max(
      0, 
      totalAccruedProfitsUsd - (totalWithdrawnUsd + pendingWithdrawnUsd)
    );

    // Primary wallet address from deposits or withdrawals
    const primaryWalletAddress = 
      userWithdrawals.find(w => !!w.walletAddress)?.walletAddress ||
      userDeposits.find(d => !!d.depositAddress)?.depositAddress ||
      'No wallet linked yet';

    const lastDepositTxid = userDeposits[0]?.senderTxid || 'None';
    const lastActivityDate = 
      userDeposits[0]?.createdAt ||
      userWithdrawals[0]?.time ||
      user.joinedDate ||
      'Recent';

    const maxVipFromApproved = approvedDeposits.reduce((max, d) => Math.max(max, d.vipLevel || 0), 0);
    const computedVipLevel = approvedDeposits.length > 0 ? maxVipFromApproved : (user.vipLevel || 0);

    let accountStatus: AggregatedCustomerData['accountStatus'] = 'Inactive / Free';
    if (pendingDeposits.length > 0) {
      accountStatus = 'Pending Verification';
    } else if (pendingWithdrawals.length > 0) {
      accountStatus = 'Pending Withdrawal';
    } else if (activeContracts.length > 0) {
      accountStatus = 'Active Miner';
    }

    return {
      user: {
        ...user,
        vipLevel: computedVipLevel,
        plan: computedVipLevel > 0 ? `VIP ${computedVipLevel}` : 'No Active Package'
      },
      deposits: userDeposits,
      approvedDeposits,
      pendingDeposits,
      rejectedDeposits,
      totalDepositedUsd,
      pendingDepositedUsd,
      activeContracts,
      expiredContracts,
      totalHashrate,
      totalDailyYieldUsd,
      totalAccruedProfitsUsd,
      withdrawals: userWithdrawals,
      approvedWithdrawals,
      pendingWithdrawals,
      failedWithdrawals,
      totalWithdrawnUsd,
      pendingWithdrawnUsd,
      estimatedAvailableBalanceUsd,
      primaryWalletAddress,
      lastDepositTxid,
      lastActivityDate,
      computedVipLevel,
      accountStatus
    };
  });
}
