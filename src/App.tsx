import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { DepositPage } from './components/DepositPage';
import { ClientSmartDashboard } from './components/ClientSmartDashboard';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { LiveSupportWidget } from './components/LiveSupportWidget';

import { 
  UserProfile, 
  MiningPackage, 
  DepositRequest,
  WithdrawalRecordItem
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
  clearAllDeposits
} from './lib/supabaseClient';

// Initial Empty Registered Clients (clean zero-base)
const INITIAL_DEMO_USERS: UserProfile[] = [];

export default function App() {
  // 1. Current Authenticated Client User (saved in localStorage)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('hashforge_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Navigation State: 'home' | 'deposit' | 'dashboard' | 'admin'
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#admin') return 'admin';
    const saved = localStorage.getItem('hashforge_user');
    return saved ? 'dashboard' : 'home';
  });

  // Activation & System Notice Toast
  const [activationToast, setActivationToast] = useState<string | null>(null);

  // Clean up any legacy plaintext password vault immediately for security
  useEffect(() => {
    try {
      localStorage.removeItem('hashforge_password_vault');
    } catch {}
  }, []);

  // Listen for Supabase Auth Events & URL Hash/Search parameters
  useEffect(() => {
    // 1. URL Inspection (Hash and Search query parameters)
    const checkUrlAuth = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      if (hash === '#admin') {
        setCurrentTab('admin');
        return;
      }

      // Password Recovery Flow
      if (
        hash.includes('reset-password') ||
        hash.includes('type=recovery') ||
        search.includes('type=recovery')
      ) {
        setIsResetPasswordOpen(true);
        return;
      }

      // Email Confirmation / Activation Flow
      if (
        hash.includes('activated=true') ||
        hash.includes('type=signup') ||
        hash.includes('type=email_change') ||
        search.includes('type=signup')
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

    // 2. Supabase Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const freshUser: UserProfile = {
          id: u.id,
          name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Client',
          email: u.email || '',
          plan: 'VIP 1 Starter',
          vipLevel: 1,
          joinedDate: new Date().toISOString().substring(0, 10),
          isLoggedIn: true,
        };

        setUser(prev => {
          if (!prev || prev.id !== freshUser.id) {
            localStorage.setItem('hashforge_user', JSON.stringify(freshUser));
            return freshUser;
          }
          return prev;
        });

        setRegisteredUsers(prev => {
          if (!prev.some(x => x.email.toLowerCase() === freshUser.email.toLowerCase())) {
            return [freshUser, ...prev];
          }
          return prev;
        });

        saveSupabaseUser(freshUser);

        // If coming from confirmation link
        const currentHash = window.location.hash || '';
        if (currentHash.includes('type=signup') || currentHash.includes('activated')) {
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
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
        if (remoteUsers && remoteUsers.length > 0) {
          setRegisteredUsers(prev => {
            const combined = [...remoteUsers];
            prev.forEach(localU => {
              if (!combined.some(u => u.email.toLowerCase() === localU.email.toLowerCase())) {
                combined.push(localU);
              }
            });
            return combined;
          });
        }

        // Sync Deposits
        const remoteDeposits = await fetchSupabaseDeposits();
        if (remoteDeposits && remoteDeposits.length > 0) {
          setDeposits(prev => {
            const combined = [...remoteDeposits];
            prev.forEach(localD => {
              if (!combined.some(d => d.id === localD.id)) {
                combined.push(localD);
              }
            });
            return combined;
          });
        }

        // Sync Withdrawals
        const remoteWithdrawals = await fetchSupabaseWithdrawals();
        if (remoteWithdrawals && remoteWithdrawals.length > 0) {
          setWithdrawalRecords(remoteWithdrawals);
        }
      } catch (err) {
        console.warn('Supabase initial fetch silent fallback:', err);
      }
    }

    loadDataFromSupabase();
  }, []);

  // 8. Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isLiveSupportOpen, setIsLiveSupportOpen] = useState<boolean>(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(false);

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

  const handleLogout = () => {
    localStorage.removeItem('hashforge_user');
    setUser(null);
    setCurrentTab('home');
  };

  const isPackagePurchasedByUser = (pkg: MiningPackage, currentUserId?: string, currentUserName?: string) => {
    if (!currentUserId && !currentUserName) return false;
    return deposits.some(d => 
      (d.userId === currentUserId || d.userName === currentUserName) &&
      (d.status === 'approved' || d.status === 'pending') &&
      (
        d.packageId === pkg.id || 
        d.packageName === pkg.name || 
        (d.vipLevel === pkg.vipLevel && (d.planType === pkg.planType || (!d.planType && pkg.planType === 'daily')))
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
        vipLevel: 1,
        plan: 'VIP 1 Starter'
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
    setDeposits(prev =>
      prev.map(d => (d.id === depositId ? { ...d, status: 'rejected' } : d))
    );
    // Sync rejection to Supabase
    updateSupabaseDepositStatus(depositId, 'rejected');
  };

  // Admin approves a withdrawal
  const handleAdminApproveWithdrawal = (withdrawalId: string) => {
    setWithdrawalRecords(prev =>
      prev.map(w => (w.id === withdrawalId ? { ...w, status: 'Withdrawal successfully' } : w))
    );
    // Sync approval to Supabase
    updateSupabaseWithdrawalStatus(withdrawalId, 'Withdrawal successfully');
  };

  // Admin rejects / declines a withdrawal
  const handleAdminRejectWithdrawal = (withdrawalId: string) => {
    setWithdrawalRecords(prev =>
      prev.map(w => (w.id === withdrawalId ? { ...w, status: 'Failed' } : w))
    );
    // Sync rejection to Supabase
    updateSupabaseWithdrawalStatus(withdrawalId, 'Failed');
  };

  // Admin purges all test data & resets to clean zero-base
  const handleAdminPurgeAllData = () => {
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
    try {
      await supabase.from('clients').delete().eq('id', userId);
      await supabase.from('deposits').delete().eq('user_id', userId);
      await supabase.from('withdrawals').delete().eq('user_id', userId);
    } catch {}
    setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
    setDeposits(prev => prev.filter(d => d.userId !== userId));
    setWithdrawalRecords(prev => prev.filter(w => w.userId !== userId));
    if (user && (user.id === userId || user.email.toLowerCase() === email.toLowerCase())) {
      setUser(null);
      localStorage.removeItem('hashforge_user');
    }
  };

  // Live refresh for Admin Portal
  const handleAdminRefreshData = async () => {
    const remoteUsers = await fetchSupabaseUsers();
    if (remoteUsers && remoteUsers.length > 0) {
      setRegisteredUsers(prev => {
        const combined = [...remoteUsers];
        prev.forEach(localU => {
          if (!combined.some(u => u.email.toLowerCase() === localU.email.toLowerCase() || u.id === localU.id)) {
            combined.push(localU);
          }
        });
        return combined;
      });
    }
    const remoteDeposits = await fetchSupabaseDeposits();
    if (remoteDeposits) {
      setDeposits(prev => {
        const combined = [...remoteDeposits];
        prev.forEach(localD => {
          if (!combined.some(d => d.id === localD.id)) {
            combined.push(localD);
          }
        });
        return combined;
      });
    }
    const remoteWithdrawals = await fetchSupabaseWithdrawals();
    if (remoteWithdrawals) {
      setWithdrawalRecords(remoteWithdrawals);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header - Shown ONLY for client pages (Home / Deposit / Dashboard) */}
      {currentTab !== 'admin' && (
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          user={user}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
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
          <DepositPage
            selectedPackage={selectedPackage || packages[1]}
            user={user || {
              id: 'guest',
              name: 'Client User',
              email: 'client@hashforge.io',
              isLoggedIn: true,
              joinedDate: '2026-08-28',
              plan: 'VIP 1',
              vipLevel: 1
            }}
            onBack={() => setCurrentTab('home')}
            onSubmitDeposit={handleSubmitDeposit}
            pendingDeposits={deposits}
            allDeposits={deposits}
            onGoToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {/* VIEW 3: CLIENT DASHBOARD (LIVE MINING PROFIT & SMART PRODUCTION) */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <ClientSmartDashboard
              key={user?.id || 'guest'}
              user={user || {
                id: 'guest',
                name: 'VIP Miner',
                email: 'miner@hashforge.io',
                isLoggedIn: true,
                joinedDate: '2026-08-28',
                plan: 'VIP 5 Diamond',
                vipLevel: 5
              }}
              packages={packages}
              onSelectPackage={handleSelectPackage}
              onOpenLiveSupport={() => setIsLiveSupportOpen(true)}
              pendingDeposits={deposits}
              onClearUserPackages={handleClearUserPackages}
            />
          </div>
        )}

        {/* VIEW 4: DEDICATED SEPARATE ADMIN PORTAL & APPROVAL CONSOLE */}
        {currentTab === 'admin' && (
          <AdminPortal
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
          />
        )}

      </main>

      {/* Footer with Discreet Admin Portal Link at bottom */}
      <footer className="border-t border-slate-900 bg-[#060912] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 ETH2.0 Smart Production. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[11px]">
            {(!user || user.email?.toLowerCase() === 'yousaftariq2014@gmail.com') && (
              <button
                onClick={() => {
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

      {/* Floating Live Support Widget */}
      <LiveSupportWidget
        isOpen={isLiveSupportOpen}
        onClose={() => setIsLiveSupportOpen(false)}
      />

    </div>
  );
}
