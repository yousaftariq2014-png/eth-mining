import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { DepositPage } from './components/DepositPage';
import { ClientSmartDashboard } from './components/ClientSmartDashboard';
import { 
  AdminPortal, 
  AUTHORIZED_ADMIN_EMAILS, 
  isAuthorizedAdminEmail, 
  MASTER_ADMIN_EMAIL 
} from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { LiveSupportWidget } from './components/LiveSupportWidget';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { GlobalAnnouncementBar } from './components/GlobalAnnouncementBar';
import { LiveGlobalPayoutTicker } from './components/LiveGlobalPayoutTicker';

import { 
  UserProfile, 
  MiningPackage, 
  DepositRequest,
  WithdrawalRecordItem,
  AppNotification,
  GlobalAnnouncement,
  KYCSubmission,
  BonusAdjustment,
  PromoCode
} from './types';
import { MINING_PACKAGES, INITIAL_WITHDRAWAL_RECORDS } from './data/packagesData';
import { 
  supabase,
  fetchSupabaseUsers, 
  saveSupabaseUser, 
  fetchSupabaseDeposits, 
  insertSupabaseDeposit, 
  updateSupabaseDepositStatus,
  fetchSupabaseWithdrawals,
  updateSupabaseWithdrawalStatus,
  clearUserDeposits,
  clearAllDeposits,
  getClientCredentials
} from './lib/supabaseClient';

// Initial Empty Registered Clients (clean zero-base)
const INITIAL_DEMO_USERS: UserProfile[] = [];

export default function App() {
  // 1. Current Authenticated Client User (saved in localStorage with 2-min inactivity expiration check)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('hashforge_user');
      const lastActive = localStorage.getItem('hashforge_last_active');
      if (saved && lastActive) {
        const elapsed = Date.now() - parseInt(lastActive, 10);
        if (elapsed >= 2 * 60 * 1000) {
          // Expired due to inactivity while away
          localStorage.removeItem('hashforge_user');
          localStorage.removeItem('hashforge_last_active');
          return null;
        }
      }
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Navigation State: 'home' | 'deposit' | 'dashboard' | 'admin'
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const saved = localStorage.getItem('hashforge_user');
    const parsedUser = saved ? JSON.parse(saved) : null;
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      if (parsedUser && !isAuthorizedAdminEmail(parsedUser.email)) {
        return parsedUser ? 'dashboard' : 'home';
      }
      return 'admin';
    }
    return parsedUser ? 'dashboard' : 'home';
  });

  // 3. Modals State
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLiveSupportOpen, setIsLiveSupportOpen] = useState<boolean>(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    return (
      sessionStorage.getItem('hashforge_password_recovery_active') === 'true' ||
      hash.includes('reset-password') ||
      hash.includes('type=recovery') ||
      hash.includes('recovery') ||
      search.includes('type=recovery') ||
      search.includes('recovery')
    );
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Activation & System Notice Toast
  const [activationToast, setActivationToast] = useState<string | null>(null);

  // Strict route protection: If user is logged out, force tab back to 'home'
  useEffect(() => {
    if (!user && (currentTab === 'dashboard' || currentTab === 'deposit')) {
      setCurrentTab('home');
    }
  }, [user, currentTab]);

  // Clean up any legacy plaintext password vault immediately for security
  useEffect(() => {
    try {
      localStorage.removeItem('hashforge_password_vault');
    } catch {}
  }, []);

  // Listen for Supabase Auth Events & URL Hash/Search parameters
  useEffect(() => {
    // 1. URL Inspection (Hash and Search query parameters for PKCE, Token Hash & OTPs)
    const checkUrlAuth = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const searchParams = new URLSearchParams(search);
      const cleanHash = hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(cleanHash);

      // Check for error queries from Supabase Auth
      const errorMsg = searchParams.get('error_description') || 
                       hashParams.get('error_description') || 
                       searchParams.get('error') || 
                       hashParams.get('error');
      const errorCode = searchParams.get('error_code') || hashParams.get('error_code');

      if (
        errorCode === 'otp_expired' ||
        hash.includes('error_code=otp_expired') ||
        search.includes('error_code=otp_expired') ||
        hash.includes('error=access_denied') ||
        search.includes('error=access_denied')
      ) {
        setActivationToast(
          errorMsg ? `⚠️ ${decodeURIComponent(errorMsg)}` : '⚠️ Your activation/reset link has expired or is invalid. Please request a new link.'
        );
        setIsAuthOpen(true);
        setAuthMode('login');
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch {}
        return;
      }

      // 1. Supabase PKCE Flow (e.g. ?code=...)
      const pkceCode = searchParams.get('code') || hashParams.get('code');
      if (pkceCode) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(pkceCode);
          if (!error && data.session?.user) {
            setActivationToast('🎉 Email activation successful! You are now logged into your Mining Dashboard.');
            setCurrentTab('dashboard');
            try {
              window.history.replaceState(null, '', window.location.pathname);
            } catch {}
            return;
          }
        } catch (err) {
          console.warn('PKCE exchange warning:', err);
        }
      }

      // 2. Supabase OTP / Token Hash Verification (e.g. ?token_hash=...&type=email)
      const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
      const tokenType = searchParams.get('type') || hashParams.get('type') || 'email';
      if (tokenHash) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: tokenType as any,
          });
          if (!error && data.session?.user) {
            if (tokenType === 'recovery') {
              setIsResetPasswordOpen(true);
            } else {
              setActivationToast('🎉 Email successfully verified! Your account is now active.');
              setCurrentTab('dashboard');
            }
            try {
              window.history.replaceState(null, '', window.location.pathname);
            } catch {}
            return;
          }
        } catch (err) {
          console.warn('OTP verify warning:', err);
        }
      }

      // 3. Supabase Implicit Flow Tokens (e.g. #access_token=...&refresh_token=...)
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data.session?.user) {
            const isRecovery = cleanHash.includes('type=recovery') || searchParams.get('type') === 'recovery';
            if (isRecovery) {
              setIsResetPasswordOpen(true);
            } else {
              setActivationToast('🎉 Email activation successful! You are now logged into your Mining Dashboard.');
              setCurrentTab('dashboard');
            }
            try {
              window.history.replaceState(null, '', window.location.pathname);
            } catch {}
            return;
          }
        } catch (err) {
          console.warn('SetSession warning:', err);
        }
      }

      // Password Recovery Flow
      if (
        hash.includes('reset-password') ||
        hash.includes('type=recovery') ||
        hash.includes('recovery') ||
        search.includes('type=recovery') ||
        search.includes('recovery') ||
        sessionStorage.getItem('hashforge_password_recovery_active') === 'true'
      ) {
        sessionStorage.setItem('hashforge_password_recovery_active', 'true');
        setIsResetPasswordOpen(true);
        setIsAuthOpen(false);
        return;
      }

      if (hash === '#admin') {
        const savedUserStr = localStorage.getItem('hashforge_user');
        const activeClient = savedUserStr ? JSON.parse(savedUserStr) : user;
        if (activeClient && !isAuthorizedAdminEmail(activeClient.email)) {
          setActivationToast('⛔ Access Denied: Administrator Console is restricted to authorized system administrators.');
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {}
          setCurrentTab('dashboard');
          return;
        }
        setCurrentTab('admin');
        return;
      }

      // Email Confirmation / Activation Flow Landing
      if (
        hash.includes('activated') ||
        hash.includes('email-confirmed') ||
        hash.includes('type=signup') ||
        hash.includes('type=email_change') ||
        search.includes('type=signup') ||
        search.includes('email-confirmed')
      ) {
        setActivationToast('🎉 Your account has been verified and activated! Welcome to the ETH2.0 Mining Platform.');
        setCurrentTab('dashboard');
        // Clean hash from address bar gracefully
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch {}
      }
    };

    checkUrlAuth();
    window.addEventListener('hashchange', checkUrlAuth);
    window.addEventListener('popstate', checkUrlAuth);

    // 2. Supabase Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('hashforge_password_recovery_active', 'true');
        setIsResetPasswordOpen(true);
        setIsAuthOpen(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // If in password recovery flow, prioritize password reset modal!
        const isRecovering = 
          sessionStorage.getItem('hashforge_password_recovery_active') === 'true' ||
          window.location.hash.includes('reset-password') ||
          window.location.hash.includes('type=recovery') ||
          window.location.search.includes('type=recovery');

        if (isRecovering) {
          setIsResetPasswordOpen(true);
          setIsAuthOpen(false);
          return;
        }

        const u = session.user;
        const storedCreds = getClientCredentials(u.email);
        const resolvedPass = (u.user_metadata?.raw_password as string) || storedCreds?.password || '';
        const resolvedKey = (u.user_metadata?.onchain_key as string) || storedCreds?.onchainKey || '';

        const freshUser: UserProfile = {
          id: u.id,
          name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Client',
          email: u.email || '',
          password: resolvedPass,
          onchainKey: resolvedKey,
          plan: 'No Active Package',
          vipLevel: 0,
          joinedDate: new Date().toISOString().substring(0, 10),
          isLoggedIn: true,
        };

        setUser(prev => {
          if (!prev || prev.id !== freshUser.id || !prev.password || !prev.onchainKey) {
            const merged = {
              ...freshUser,
              password: freshUser.password || prev?.password,
              onchainKey: freshUser.onchainKey || prev?.onchainKey,
            };
            localStorage.setItem('hashforge_user', JSON.stringify(merged));
            return merged;
          }
          return prev;
        });

        setRegisteredUsers(prev => {
          const existingIdx = prev.findIndex(x => x.email.toLowerCase() === freshUser.email.toLowerCase());
          if (existingIdx === -1) {
            return [freshUser, ...prev];
          } else {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              ...freshUser,
              password: freshUser.password || updated[existingIdx].password,
              onchainKey: freshUser.onchainKey || updated[existingIdx].onchainKey,
            };
            return updated;
          }
        });

        saveSupabaseUser(freshUser);

        // If coming from confirmation link
        const currentHash = window.location.hash || '';
        const currentSearch = window.location.search || '';
        if (
          currentHash.includes('type=signup') || 
          currentHash.includes('activated') || 
          currentHash.includes('email-confirmed') ||
          currentSearch.includes('type=signup')
        ) {
          setActivationToast('🎉 Email activation successful! You are now logged into your Mining Dashboard.');
          setCurrentTab('dashboard');
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {}
        }
      }
    });

    return () => {
      window.removeEventListener('hashchange', checkUrlAuth);
      window.removeEventListener('popstate', checkUrlAuth);
      authListener?.subscription?.unsubscribe();
    };
  }, [user]);

  // 3. 5 Mining Packages
  const [packages] = useState<MiningPackage[]>(MINING_PACKAGES);

  // 4. Selected Package for Deposit (null by default so dashboard opens directly on login)
  const [selectedPackage, setSelectedPackage] = useState<MiningPackage | null>(null);

  // 5. Registered Users Database (persisted in localStorage & synced with Supabase)
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_registered_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DEMO_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hashforge_registered_users', JSON.stringify(registeredUsers));
    } catch {}
  }, [registeredUsers]);

  // 6. Deposit Requests & Approvals (persisted & synced with Supabase)
  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_deposits');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Save deposits to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hashforge_deposits', JSON.stringify(deposits));
    } catch {}
  }, [deposits]);

  // 7. Withdrawals Records
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecordItem[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_withdrawals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_WITHDRAWAL_RECORDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hashforge_withdrawals', JSON.stringify(withdrawalRecords));
    } catch {}
  }, [withdrawalRecords]);

  // -------------------------------------------------------------------
  // LIVE SUPABASE DATA SYNC ON MOUNT
  // -------------------------------------------------------------------
  useEffect(() => {
    async function loadDataFromSupabase() {
      try {
        // Sync Users
        const remoteUsers = await fetchSupabaseUsers();
        if (remoteUsers !== null) {
          setRegisteredUsers(remoteUsers);
        }

        // Sync Deposits
        const remoteDeposits = await fetchSupabaseDeposits();
        if (remoteDeposits !== null) {
          setDeposits(remoteDeposits);
        }

        // Sync Withdrawals
        const remoteWithdrawals = await fetchSupabaseWithdrawals();
        if (remoteWithdrawals !== null) {
          setWithdrawalRecords(remoteWithdrawals);
        }
      } catch (err) {
        console.warn('Supabase initial fetch silent fallback:', err);
      }
    }

    loadDataFromSupabase();
  }, []);

  // Automated Notifications list with local persistence
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'notif-welcome',
        title: 'Mining Infrastructure Online',
        message: 'Welcome to the ETH2.0 Smart Production Protocol. Stratum cloud clusters are fully synced with multi-sig proof-of-reserve settlement.',
        timestamp: 'Just now',
        read: false,
        type: 'system',
        category: 'Mining'
      },
      {
        id: 'notif-security',
        title: '2-Minute Inactivity Protection Active',
        message: 'Your account is secured with automated inactivity lockouts and strict client cryptographic isolation.',
        timestamp: '2h ago',
        read: true,
        type: 'security',
        category: 'Security'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('hashforge_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // 10. Sitewide Global Announcement Bar State
  const [globalAnnouncement, setGlobalAnnouncement] = useState<GlobalAnnouncement>(() => {
    try {
      const saved = localStorage.getItem('hashforge_global_announcement');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'ann-init',
      title: 'ETH 2.0 SMART NODE UPDATE',
      message: '⚡ Ethereum 2.0 Hardfork Node Upgrade Complete across all mining pools. Direct TRC-20 & ERC-20 zero-fee payouts enabled.',
      type: 'info',
      isActive: true,
      createdAt: new Date().toISOString().substring(0, 10),
      targetAudience: 'all'
    };
  });

  const handleSaveAnnouncement = (newAnnouncement: GlobalAnnouncement) => {
    setGlobalAnnouncement(newAnnouncement);
    try {
      localStorage.setItem('hashforge_global_announcement', JSON.stringify(newAnnouncement));
    } catch {}
  };

  // 11. KYC Verification Submissions State
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_kyc_submissions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'kyc-demo-1',
        userId: 'usr-vip-001',
        userName: 'Alexander Vance',
        userEmail: 'alex.vance.crypto@proton.me',
        documentType: 'passport',
        idNumber: 'PA-9842109X',
        country: 'Switzerland',
        frontDocUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        backDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        selfieDocUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'pending',
        requestedLevel: 2,
      },
      {
        id: 'kyc-demo-2',
        userId: 'usr-vip-002',
        userName: 'Marcus Aurelius Sterling',
        userEmail: 'marcus.sterling@institutional-vault.ch',
        documentType: 'national_id',
        idNumber: 'ID-CHE-882190',
        country: 'Germany',
        frontDocUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        backDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        selfieDocUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
        submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'verified',
        requestedLevel: 1,
        approvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('hashforge_kyc_submissions', JSON.stringify(kycSubmissions));
    } catch {}
  }, [kycSubmissions]);

  // 12. Promo Codes & Vouchers State
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_promo_codes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        code: 'VIP-PROMO-100',
        type: 'bonus_usdt',
        value: 100,
        description: 'VIP Starter Welcome Bonus',
        isActive: true,
        usedCount: 3,
        maxUses: 50,
        createdAt: new Date().toISOString(),
      },
      {
        code: 'BOOST-YIELD-1',
        type: 'yield_boost_pct',
        value: 1.0,
        description: '1.0% Additional Daily Yield Boost',
        isActive: true,
        usedCount: 7,
        maxUses: 20,
        createdAt: new Date().toISOString(),
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('hashforge_promo_codes', JSON.stringify(promoCodes));
    } catch {}
  }, [promoCodes]);

  // 13. Admin Bonus & Yield Injections History
  const [bonusHistory, setBonusHistory] = useState<BonusAdjustment[]>(() => {
    try {
      const saved = localStorage.getItem('hashforge_bonus_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'bonus-init-1',
        userId: 'usr-vip-001',
        userName: 'Alexander Vance',
        type: 'instant_usdt_credit',
        amountUsd: 500,
        yieldBoostPercent: 0.5,
        reason: 'VIP Institutional Onboarding Grant',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('hashforge_bonus_history', JSON.stringify(bonusHistory));
    } catch {}
  }, [bonusHistory]);

  // Handlers for KYC Approval / Rejection
  const handleAdminApproveKYC = (submissionId: string, level: 1 | 2 = 1) => {
    setKycSubmissions(prev => prev.map(k => {
      if (k.id === submissionId) {
        const updated = {
          ...k,
          status: 'verified' as const,
          requestedLevel: level,
          approvedAt: new Date().toISOString(),
        };
        // Also update the target user profile
        setRegisteredUsers(users => users.map(u => {
          if (u.id === k.userId || u.email.toLowerCase() === k.userEmail.toLowerCase()) {
            const updatedUser: UserProfile = {
              ...u,
              kycStatus: 'verified',
              kycLevel: level,
              kycVerifiedAt: new Date().toISOString(),
            };
            saveSupabaseUser(updatedUser);
            if (user && (user.id === u.id || user.email.toLowerCase() === u.email.toLowerCase())) {
              setUser(updatedUser);
              localStorage.setItem('hashforge_user', JSON.stringify(updatedUser));
            }
            return updatedUser;
          }
          return u;
        }));
        return updated;
      }
      return k;
    }));
  };

  const handleAdminRejectKYC = (submissionId: string, reason: string) => {
    setKycSubmissions(prev => prev.map(k => {
      if (k.id === submissionId) {
        const updated = {
          ...k,
          status: 'rejected' as const,
          rejectionReason: reason,
        };
        // Also update the user profile
        setRegisteredUsers(users => users.map(u => {
          if (u.id === k.userId || u.email.toLowerCase() === k.userEmail.toLowerCase()) {
            const updatedUser: UserProfile = {
              ...u,
              kycStatus: 'rejected',
              kycRejectionReason: reason,
            };
            saveSupabaseUser(updatedUser);
            if (user && (user.id === u.id || user.email.toLowerCase() === u.email.toLowerCase())) {
              setUser(updatedUser);
              localStorage.setItem('hashforge_user', JSON.stringify(updatedUser));
            }
            return updatedUser;
          }
          return u;
        }));
        return updated;
      }
      return k;
    }));
  };

  const handleSavePromoCodes = (newPromoCodes: PromoCode[]) => {
    setPromoCodes(newPromoCodes);
  };

  const handleInjectBonus = (bonus: BonusAdjustment) => {
    setBonusHistory(prev => [bonus, ...prev]);
  };

  // User Actions
  const handleOpenAuth = (mode: 'login' | 'signup', targetPkg?: MiningPackage) => {
    if (targetPkg) {
      setSelectedPackage(targetPkg);
    } else {
      setSelectedPackage(null);
    }
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem('hashforge_user', JSON.stringify(loggedInUser));
    localStorage.setItem('hashforge_last_active', Date.now().toString());

    // Also ensure user is in registeredUsers database
    setRegisteredUsers(prev => {
      if (!prev.some(u => u.email.toLowerCase() === loggedInUser.email.toLowerCase())) {
        return [loggedInUser, ...prev];
      }
      return prev;
    });

    // Save to Supabase Cloud
    saveSupabaseUser(loggedInUser);

    if (selectedPackage) {
      setCurrentTab('deposit');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('hashforge_user');
    localStorage.removeItem('hashforge_last_active');
    sessionStorage.removeItem('hashforge_admin_unlocked');
    sessionStorage.removeItem('hashforge_admin_auth');
    localStorage.removeItem('hashforge_admin_auth');
    sessionStorage.removeItem('hashforge_password_recovery_active');
    setUser(null);
    setSelectedPackage(null);
    setCurrentTab('home');
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {}
  };

  // -------------------------------------------------------------------
  // 2-MINUTE INACTIVITY AUTO-LOGOUT SECURITY MECHANISM
  // If user is logged in, automatically log out after 2 minutes (120,000ms) of inactivity.
  // Requires explicit re-authentication (login) to regain access to Dashboard.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('hashforge_last_active');
      return;
    }

    const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes (120,000 ms)

    const performAutoLogout = async () => {
      try {
        await supabase.auth.signOut();
      } catch {}
      localStorage.removeItem('hashforge_user');
      localStorage.removeItem('hashforge_last_active');
      sessionStorage.removeItem('hashforge_admin_unlocked');
      sessionStorage.removeItem('hashforge_admin_auth');
      localStorage.removeItem('hashforge_admin_auth');
      sessionStorage.removeItem('hashforge_password_recovery_active');
      setUser(null);
      setSelectedPackage(null);
      setCurrentTab('home');
      setActivationToast('🔒 Session expired due to 2 minutes of inactivity. You have been safely logged out. Please log in again to access your dashboard.');
      setIsAuthOpen(true);
      setAuthMode('login');
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch {}
    };

    const recordActivity = () => {
      localStorage.setItem('hashforge_last_active', Date.now().toString());
    };

    // Initialize activity timestamp if not present
    if (!localStorage.getItem('hashforge_last_active')) {
      recordActivity();
    }

    // Checking function
    const checkInactivity = () => {
      const lastActiveStr = localStorage.getItem('hashforge_last_active');
      if (!lastActiveStr) {
        recordActivity();
        return;
      }
      const lastActive = parseInt(lastActiveStr, 10);
      const now = Date.now();
      if (now - lastActive >= INACTIVITY_TIMEOUT_MS) {
        performAutoLogout();
      }
    };

    const handleUserActivity = () => {
      const lastActiveStr = localStorage.getItem('hashforge_last_active');
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          performAutoLogout();
          return;
        }
      }
      recordActivity();
    };

    // User activity events across desktop and mobile
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel'
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check periodically every 1 second
    const intervalId = setInterval(checkInactivity, 1000);

    // Also check on visibility change (e.g. user minimized browser or locked phone screen and returned)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user]);

  const isPackagePurchasedByUser = (pkg: MiningPackage, currentUserId?: string, currentUserName?: string) => {
    if (!currentUserId && !currentUserName) return false;
    return deposits.some(d => 
      (d.userId === currentUserId || d.userName === currentUserName) &&
      (d.status === 'approved' || d.status === 'pending') &&
      (
        d.packageId === pkg.id || 
        d.packageName === pkg.name || 
        (
          pkg.planType !== 'custom_pool' && 
          d.planType !== 'custom_pool' &&
          d.vipLevel === pkg.vipLevel && 
          (d.planType === pkg.planType || (!d.planType && pkg.planType === 'daily'))
        )
      )
    );
  };

  const handleSelectPackage = (pkg: MiningPackage) => {
    if (user && isPackagePurchasedByUser(pkg, user.id, user.name)) {
      alert(`You already have an active mining contract for ${pkg.name}. Each tier can only be purchased once per client.`);
      return;
    }
    setSelectedPackage(pkg);
    if (!user) {
      handleOpenAuth('signup', pkg);
    } else {
      setCurrentTab('deposit');
    }
  };

  // Clear mining packages for specific user (resets client dashboard to zero state)
  const handleClearUserPackages = async (userId?: string, userEmail?: string) => {
    const targetId = userId || user?.id;
    const targetEmail = userEmail || user?.email || user?.name;
    if (targetId) {
      await clearUserDeposits(targetId, targetEmail);
      setDeposits(prev => prev.filter(d => d.userId !== targetId && d.userName !== targetEmail));
    }
    setSelectedPackage(null);
    if (user && (user.id === targetId || user.email === targetEmail)) {
      const resetUser: UserProfile = {
        ...user,
        vipLevel: 0,
        plan: 'No Active Package'
      };
      setUser(resetUser);
      localStorage.setItem('hashforge_user', JSON.stringify(resetUser));
      saveSupabaseUser(resetUser);
    }
  };

  // Submit new deposit from client
  const handleSubmitDeposit = (newDeposit: DepositRequest) => {
    setDeposits(prev => [newDeposit, ...prev]);
    // Save to Supabase Cloud
    insertSupabaseDeposit(newDeposit);
  };

  // Admin approves a deposit from Admin Portal
  const handleAdminApproveDeposit = (depositId: string) => {
    // STRICT SECURITY GATE: Only Master Admin can approve deposits
    const activeAdminAuth = sessionStorage.getItem('hashforge_admin_auth');
    const isUnlocked = sessionStorage.getItem('hashforge_admin_unlocked') === 'true';
    if (!isUnlocked || !isAuthorizedAdminEmail(activeAdminAuth)) {
      console.error('⛔ Security Alert: Unauthorized client attempted to approve a deposit.');
      return;
    }

    const approvedTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setDeposits(prev =>
      prev.map(d => {
        if (d.id === depositId) {
          return {
            ...d,
            status: 'approved',
            approvedAt: approvedTimestamp
          };
        }
        return d;
      })
    );

    // Sync approval to Supabase
    // FIX: 4th argument (explorerConfirmed = true) added — the client dashboard
    // only treats a deposit as usable once BOTH status === 'approved' AND
    // explorer_confirmed === true in the database. Without this, deposits were
    // marked "approved" but never counted, so the client's purchased package
    // never appeared on their dashboard.
    updateSupabaseDepositStatus(depositId, 'approved', approvedTimestamp, true);

    // Update user VIP level in registered users database & active user session
    const targetDeposit = deposits.find(d => d.id === depositId);
    if (targetDeposit) {
      // Update registered users list
      setRegisteredUsers(prev =>
        prev.map(u => {
          if (u.id === targetDeposit.userId || u.name === targetDeposit.userName) {
            const updated = {
              ...u,
              vipLevel: targetDeposit.vipLevel,
              plan: `VIP ${targetDeposit.vipLevel} (${targetDeposit.packageName})`
            };
            saveSupabaseUser(updated);
            return updated;
          }
          return u;
        })
      );

      // If active user is this client, update their local session
      if (user && (user.id === targetDeposit.userId || user.name === targetDeposit.userName)) {
        const updatedUser: UserProfile = {
          ...user,
          vipLevel: targetDeposit.vipLevel,
          plan: `VIP ${targetDeposit.vipLevel} (${targetDeposit.packageName})`
        };
        setUser(updatedUser);
        localStorage.setItem('hashforge_user', JSON.stringify(updatedUser));
        saveSupabaseUser(updatedUser);
      }
    }
  };

  // Admin rejects a deposit
  const handleAdminRejectDeposit = (depositId: string) => {
    const activeAdminAuth = sessionStorage.getItem('hashforge_admin_auth');
    const isUnlocked = sessionStorage.getItem('hashforge_admin_unlocked') === 'true';
    if (!isUnlocked || !isAuthorizedAdminEmail(activeAdminAuth)) {
      console.error('⛔ Security Alert: Unauthorized client attempted to reject a deposit.');
      return;
    }

    setDeposits(prev =>
      prev.map(d => (d.id === depositId ? { ...d, status: 'rejected' } : d))
    );
    // Sync rejection to Supabase
    updateSupabaseDepositStatus(depositId, 'rejected');
  };

  // Admin approves a withdrawal
  const handleAdminApproveWithdrawal = (withdrawalId: string) => {
    const activeAdminAuth = sessionStorage.getItem('hashforge_admin_auth');
    const isUnlocked = sessionStorage.getItem('hashforge_admin_unlocked') === 'true';
    if (!isUnlocked || !isAuthorizedAdminEmail(activeAdminAuth)) {
      console.error('⛔ Security Alert: Unauthorized client attempted to approve a withdrawal.');
      return;
    }

    setWithdrawalRecords(prev =>
      prev.map(w => (w.id === withdrawalId ? { ...w, status: 'Withdrawal successfully' } : w))
    );
    // Sync approval to Supabase
    updateSupabaseWithdrawalStatus(withdrawalId, 'Withdrawal successfully');
  };

  // Admin rejects / declines a withdrawal
  const handleAdminRejectWithdrawal = (withdrawalId: string) => {
    const activeAdminAuth = sessionStorage.getItem('hashforge_admin_auth');
    const isUnlocked = sessionStorage.getItem('hashforge_admin_unlocked') === 'true';
    if (!isUnlocked || !isAuthorizedAdminEmail(activeAdminAuth)) {
      console.error('⛔ Security Alert: Unauthorized client attempted to reject a withdrawal.');
      return;
    }

    setWithdrawalRecords(prev =>
      prev.map(w => (w.id === withdrawalId ? { ...w, status: 'Failed' } : w))
    );
    // Sync rejection to Supabase
    updateSupabaseWithdrawalStatus(withdrawalId, 'Failed');
  };

  // Admin purges all test data & resets to clean zero-base
  const handleAdminPurgeAllData = () => {
    const activeAdminAuth = sessionStorage.getItem('hashforge_admin_auth');
    const isUnlocked = sessionStorage.getItem('hashforge_admin_unlocked') === 'true';
    if (!isUnlocked || !isAuthorizedAdminEmail(activeAdminAuth)) {
      console.error('⛔ Security Alert: Unauthorized client attempted to purge database.');
      return;
    }

    setUser(null);
    setDeposits([]);
    setWithdrawalRecords([]);
    setRegisteredUsers([]);
    setSelectedPackage(null);
  };

  // Admin updates single client credentials/profile
  const handleAdminUpdateUser = (updatedUser: UserProfile) => {
    setRegisteredUsers(prev => {
      const idx = prev.findIndex(u => u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updatedUser };
        return next;
      }
      return [updatedUser, ...prev];
    });

    if (user && (user.id === updatedUser.id || user.email.toLowerCase() === updatedUser.email.toLowerCase())) {
      const merged = { ...user, ...updatedUser };
      setUser(merged);
      localStorage.setItem('hashforge_user', JSON.stringify(merged));
    }
  };

  // Admin deletes single client
  const handleAdminDeleteClient = async (userId: string, email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (userId) {
        await supabase.from('clients').delete().eq('id', userId);
        await supabase.from('deposits').delete().eq('user_id', userId);
        await supabase.from('withdrawals').delete().eq('user_id', userId);
        await supabase.from('mining_contracts').delete().eq('user_id', userId);
      }
      if (cleanEmail) {
        await supabase.from('clients').delete().eq('email', cleanEmail);
        await supabase.from('deposits').delete().eq('user_name', cleanEmail);
        await supabase.from('withdrawals').delete().eq('user_name', cleanEmail);
        await supabase.from('mining_contracts').delete().eq('user_name', cleanEmail);
      }
    } catch (err) {
      console.warn('Delete client from Supabase warning:', err);
    }

    setRegisteredUsers(prev => prev.filter(u => u.id !== userId && u.email.toLowerCase() !== cleanEmail));
    setDeposits(prev => prev.filter(d => d.userId !== userId && d.userName.toLowerCase() !== cleanEmail));
    setWithdrawalRecords(prev => prev.filter(w => w.userId !== userId && w.userName?.toLowerCase() !== cleanEmail));

    if (user && (user.id === userId || user.email.toLowerCase() === cleanEmail)) {
      setUser(null);
      localStorage.removeItem('hashforge_user');
    }
  };

  // Live refresh for Admin Portal
  const handleAdminRefreshData = async () => {
    const remoteUsers = await fetchSupabaseUsers();
    if (remoteUsers !== null) {
      setRegisteredUsers(remoteUsers);
    }
    const remoteDeposits = await fetchSupabaseDeposits();
    if (remoteDeposits !== null) {
      setDeposits(remoteDeposits);
    }
    const remoteWithdrawals = await fetchSupabaseWithdrawals();
    if (remoteWithdrawals !== null) {
      setWithdrawalRecords(remoteWithdrawals);
    }
  };

  // Periodic Cloud Auto-Sync in background every 10s
  useEffect(() => {
    const syncInterval = setInterval(() => {
      handleAdminRefreshData();
    }, 10000);
    return () => clearInterval(syncInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Sitewide Global Announcement Notification Bar */}
      {currentTab !== 'admin' && (
        <GlobalAnnouncementBar
          announcement={globalAnnouncement}
        />
      )}

      {/* Top Header - Shown ONLY for client pages (Home / Deposit / Dashboard) */}
      {currentTab !== 'admin' && (
        <>
          <Header
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            user={user}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadNotificationsCount={unreadNotificationsCount}
          />
          {/* Live On-Chain Payout & Hash Settlement Ticker */}
          <LiveGlobalPayoutTicker />
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Activation & Notification Banner */}
        {activationToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{activationToast}</span>
            </div>
            <button
              onClick={() => setActivationToast(null)}
              className="text-emerald-400/80 hover:text-emerald-200 p-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* VIEW 1: HOME PAGE (5 PACKAGES & PUBLIC PRESENTATION) */}
        {currentTab === 'home' && (
          <HomePage
            packages={packages}
            user={user}
            deposits={deposits}
            onOpenAuth={handleOpenAuth}
            onSelectPackage={handleSelectPackage}
            onOpenLiveSupport={() => setIsLiveSupportOpen(true)}
          />
        )}

        {/* VIEW 2: DEPOSIT & RECHARGE PAGE */}
        {currentTab === 'deposit' && (
          user ? (
            <DepositPage
              selectedPackage={selectedPackage || packages[1]}
              user={user}
              onBack={() => setCurrentTab('home')}
              onSubmitDeposit={handleSubmitDeposit}
              pendingDeposits={deposits}
              allDeposits={deposits}
              onGoToDashboard={() => setCurrentTab('dashboard')}
            />
          ) : (
            <HomePage
              packages={packages}
              user={null}
              deposits={deposits}
              onOpenAuth={handleOpenAuth}
              onSelectPackage={handleSelectPackage}
              onOpenLiveSupport={() => setIsLiveSupportOpen(true)}
            />
          )
        )}

        {/* VIEW 3: CLIENT DASHBOARD (LIVE MINING PROFIT & SMART PRODUCTION) */}
        {currentTab === 'dashboard' && (
          user ? (
            <div className="space-y-6">
              <ClientSmartDashboard
                key={user.id}
                user={user}
                packages={packages}
                onSelectPackage={handleSelectPackage}
                onOpenLiveSupport={() => setIsLiveSupportOpen(true)}
                pendingDeposits={deposits}
                onClearUserPackages={handleClearUserPackages}
              />
            </div>
          ) : (
            <HomePage
              packages={packages}
              user={null}
              deposits={deposits}
              onOpenAuth={handleOpenAuth}
              onSelectPackage={handleSelectPackage}
              onOpenLiveSupport={() => setIsLiveSupportOpen(true)}
            />
          )
        )}

        {/* VIEW 4: DEDICATED SEPARATE ADMIN PORTAL & APPROVAL CONSOLE */}
        {currentTab === 'admin' && (
          <AdminPortal
            currentUser={user}
            onBackToClientApp={() => {
              window.location.hash = '';
              setCurrentTab(user ? 'dashboard' : 'home');
            }}
            deposits={deposits}
            onApproveDeposit={handleAdminApproveDeposit}
            onRejectDeposit={handleAdminRejectDeposit}
            registeredUsers={registeredUsers}
            packages={packages}
            withdrawalRecords={withdrawalRecords}
            onApproveWithdrawal={handleAdminApproveWithdrawal}
            onRejectWithdrawal={handleAdminRejectWithdrawal}
            onPurgeAllData={handleAdminPurgeAllData}
            onDeleteClient={handleAdminDeleteClient}
            onRefreshData={handleAdminRefreshData}
            onUpdateUser={handleAdminUpdateUser}
            announcement={globalAnnouncement}
            onSaveAnnouncement={handleSaveAnnouncement}
            kycSubmissions={kycSubmissions}
            onApproveKYC={handleAdminApproveKYC}
            onRejectKYC={handleAdminRejectKYC}
            promoCodes={promoCodes}
            onSavePromoCodes={handleSavePromoCodes}
            onInjectBonus={handleInjectBonus}
            bonusHistory={bonusHistory}
          />
        )}

      </main>

      {/* Footer with Discreet Admin Portal Link at bottom */}
      <footer className="border-t border-slate-900 bg-[#060912] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 ETH2.0 Smart Production. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[11px]">
            {(!user || isAuthorizedAdminEmail(user.email)) && (
              <button
                onClick={() => {
                  if (user && !isAuthorizedAdminEmail(user.email)) {
                    setActivationToast('⛔ Access Denied: Admin portal is restricted to authorized administrators.');
                    return;
                  }
                  window.location.hash = 'admin';
                  setCurrentTab('admin');
                }}
                className="text-slate-600 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 font-mono"
              >
                <span>🔒 Admin Access</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
        onUserRegistered={(newUser) => {
          setRegisteredUsers(prev => {
            const filtered = prev.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase());
            return [newUser, ...filtered];
          });
        }}
      />

      {/* Password Reset Modal (from Supabase email link) */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          window.location.hash = '';
        }}
        onSuccess={(updatedUser) => {
          handleLoginSuccess(updatedUser);
        }}
      />

      {/* Floating Live Support Widget (Tawk.to) */}
      <LiveSupportWidget
        isOpen={isLiveSupportOpen}
        onClose={() => setIsLiveSupportOpen(false)}
        user={user}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearAll={handleClearAllNotifications}
      />

    </div>
  );
}
